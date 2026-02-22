import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import {
  CheckIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
  XIcon,
  UsersIcon,
} from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Medication {
  id: string;
  name: string;
  duration: string;
  quantity: string;
}

interface BulkPatient {
  full_name: string;
  phone: string;
  age: number | null;
  medications: { name: string; duration: string; quantity: string }[];
  selected: boolean;
}

const RegisterCustomer = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    phone: "",
    age: "",
    consentGiven: false,
  });
  const [medications, setMedications] = useState<Medication[]>([
    { id: crypto.randomUUID(), name: "", duration: "", quantity: "" },
  ]);

  // Bulk import state
  const [bulkPatients, setBulkPatients] = useState<BulkPatient[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMedication = () => {
    setMedications([
      ...medications,
      { id: crypto.randomUUID(), name: "", duration: "", quantity: "" },
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1)
      setMedications(medications.filter((med) => med.id !== id));
  };

  const updateMedication = (
    id: string,
    field: keyof Omit<Medication, "id">,
    value: string
  ) => {
    setMedications(
      medications.map((med) =>
        med.id === id ? { ...med, [field]: value } : med
      )
    );
  };

  // Parse Excel file client-side
  const parseExcelFile = (file: File): Promise<BulkPatient[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

          if (rows.length === 0) {
            reject(new Error("The file appears to be empty"));
            return;
          }

          // Map columns flexibly (case-insensitive, partial match)
          const findCol = (row: any, keywords: string[]) => {
            const keys = Object.keys(row);
            for (const kw of keywords) {
              const match = keys.find((k) =>
                k.toLowerCase().includes(kw.toLowerCase())
              );
              if (match) return String(row[match]).trim();
            }
            return "";
          };

          const patients: BulkPatient[] = rows
            .map((row) => {
              const fullName = findCol(row, [
                "name",
                "full_name",
                "patient",
                "customer",
              ]);
              const phone = findCol(row, ["phone", "tel", "mobile", "contact", "number"]);
              const ageStr = findCol(row, ["age"]);
              const medName = findCol(row, [
                "medication",
                "drug",
                "medicine",
                "med",
              ]);
              const duration = findCol(row, [
                "duration",
                "days",
                "treatment",
                "period",
              ]);
              const quantity = findCol(row, [
                "quantity",
                "dosage",
                "dose",
                "qty",
              ]);

              return {
                full_name: fullName,
                phone: phone,
                age: ageStr ? parseInt(ageStr) || null : null,
                medications:
                  medName
                    ? [
                        {
                          name: medName,
                          duration: duration.replace(/\D/g, "") || "",
                          quantity: quantity || "",
                        },
                      ]
                    : [],
                selected: true,
              };
            })
            .filter((p) => p.full_name && p.phone);

          // Group medications by patient name+phone
          const grouped = new Map<string, BulkPatient>();
          for (const p of patients) {
            const key = `${p.full_name}||${p.phone}`;
            if (grouped.has(key)) {
              const existing = grouped.get(key)!;
              existing.medications.push(...p.medications);
            } else {
              grouped.set(key, { ...p });
            }
          }

          resolve(Array.from(grouped.values()));
        } catch (err) {
          reject(new Error("Failed to parse the Excel file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  // Parse PDF/Word via edge function with AI
  const parseWithAI = async (file: File): Promise<BulkPatient[]> => {
    const reader = new FileReader();
    const textContent = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });

    const { data, error } = await supabase.functions.invoke(
      "parse-patient-file",
      {
        body: { fileContent: textContent, fileName: file.name },
      }
    );

    if (error) throw new Error(error.message || "Failed to parse file");
    if (!data?.success)
      throw new Error(data?.error || "Failed to extract patient data");

    return (data.patients || []).map((p: any) => ({
      ...p,
      selected: true,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const supportedExcel = ["xlsx", "xls", "csv"];
    const supportedAI = ["pdf", "doc", "docx"];

    if (
      !supportedExcel.includes(ext || "") &&
      !supportedAI.includes(ext || "")
    ) {
      toast({
        title: "Unsupported File",
        description: "Please upload an Excel (.xlsx, .xls, .csv), Word (.doc, .docx), or PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    setUploadedFileName(file.name);
    setBulkPatients([]);

    try {
      let patients: BulkPatient[];

      if (supportedExcel.includes(ext || "")) {
        patients = await parseExcelFile(file);
      } else {
        patients = await parseWithAI(file);
      }

      if (patients.length === 0) {
        toast({
          title: "No Data Found",
          description:
            "Could not extract any patient data from the file. Please ensure it contains patient names and phone numbers.",
          variant: "destructive",
        });
      } else {
        setBulkPatients(patients);
        toast({
          title: "File Parsed",
          description: `Found ${patients.length} patient(s) in the file.`,
        });
      }
    } catch (error: any) {
      console.error("File parse error:", error);
      toast({
        title: "Parse Error",
        description: error.message || "Failed to parse the uploaded file",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const togglePatientSelection = (index: number) => {
    setBulkPatients((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const toggleAllPatients = (selected: boolean) => {
    setBulkPatients((prev) => prev.map((p) => ({ ...p, selected })));
  };

  const handleBulkImport = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    const selectedPatients = bulkPatients.filter((p) => p.selected);
    if (selectedPatients.length === 0) {
      toast({
        title: "No Patients Selected",
        description: "Please select at least one patient to import.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkImporting(true);
    let importedCount = 0;

    try {
      for (const patient of selectedPatients) {
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .insert({
            full_name: patient.full_name,
            phone: patient.phone,
            age: patient.age,
            pharmacist_id: user.id,
            consent_given: true,
          })
          .select()
          .single();

        if (patientError) {
          console.error(`Failed to import ${patient.full_name}:`, patientError);
          continue;
        }

        for (const med of patient.medications) {
          if (!med.name) continue;

          const durationDays = parseInt(med.duration) || 7;

          const { data: medicationData, error: medicationError } =
            await supabase
              .from("medications")
              .insert({
                name: med.name.trim(),
                treatment_duration_days: durationDays,
                reminder_frequency: "daily",
                follow_up_day: durationDays,
              })
              .select()
              .single();

          if (medicationError) continue;

          const endDate = new Date();
          endDate.setDate(endDate.getDate() + durationDays);

          const { data: patientMedData, error: patientMedError } =
            await supabase
              .from("patient_medications")
              .insert({
                patient_id: patientData.id,
                medication_id: medicationData.id,
                prescribed_by: user.id,
                quantity: med.quantity || "As prescribed",
                end_date: endDate.toISOString(),
              })
              .select()
              .single();

          if (patientMedError) continue;

          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + durationDays);
          await supabase.from("follow_ups").insert({
            patient_id: patientData.id,
            patient_medication_id: patientMedData.id,
            pharmacist_id: user.id,
            scheduled_date: followUpDate.toISOString().split("T")[0],
          });

          const reminders = [];
          for (let day = 0; day < durationDays; day++) {
            const reminderDate = new Date();
            reminderDate.setDate(reminderDate.getDate() + day);
            reminderDate.setHours(9, 0, 0, 0);
            reminders.push({
              patient_id: patientData.id,
              patient_medication_id: patientMedData.id,
              reminder_type: "dose",
              message: `Hi ${patient.full_name}, this is your reminder to take ${med.name}. Dosage: ${med.quantity || "As prescribed"}`,
              scheduled_at: reminderDate.toISOString(),
              delivery_channel: "sms",
              status: "pending",
            });
          }
          if (reminders.length > 0)
            await supabase.from("reminders").insert(reminders);
        }

        importedCount++;
      }

      toast({
        title: "Bulk Import Complete",
        description: `Successfully imported ${importedCount} of ${selectedPatients.length} patient(s).`,
      });

      if (importedCount > 0) {
        setBulkPatients([]);
        setUploadedFileName("");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Bulk import error:", error);
      toast({
        title: "Import Error",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }
    if (!patientInfo.consentGiven) {
      toast({
        title: "Consent Required",
        description: "Patient must give consent to receive reminders",
        variant: "destructive",
      });
      return;
    }
    const invalid = medications.find(
      (med) => !med.name.trim() || !med.duration || !med.quantity.trim()
    );
    if (invalid) {
      toast({
        title: "Incomplete",
        description: "Please fill in all medication details",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert({
          full_name: patientInfo.name,
          phone: patientInfo.phone,
          age: patientInfo.age ? parseInt(patientInfo.age) : null,
          pharmacist_id: user.id,
          consent_given: patientInfo.consentGiven,
        })
        .select()
        .single();
      if (patientError) throw patientError;

      for (const med of medications) {
        const { data: medicationData, error: medicationError } = await supabase
          .from("medications")
          .insert({
            name: med.name.trim(),
            treatment_duration_days: parseInt(med.duration),
            reminder_frequency: "daily",
            follow_up_day: parseInt(med.duration),
          })
          .select()
          .single();
        if (medicationError) throw medicationError;

        const durationDays = parseInt(med.duration);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        const { data: patientMedData, error: patientMedError } = await supabase
          .from("patient_medications")
          .insert({
            patient_id: patientData.id,
            medication_id: medicationData.id,
            prescribed_by: user.id,
            quantity: med.quantity,
            end_date: endDate.toISOString(),
          })
          .select()
          .single();
        if (patientMedError) throw patientMedError;

        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + durationDays);
        await supabase.from("follow_ups").insert({
          patient_id: patientData.id,
          patient_medication_id: patientMedData.id,
          pharmacist_id: user.id,
          scheduled_date: followUpDate.toISOString().split("T")[0],
        });

        const reminders = [];
        for (let day = 0; day < durationDays; day++) {
          const reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + day);
          reminderDate.setHours(9, 0, 0, 0);
          reminders.push({
            patient_id: patientData.id,
            patient_medication_id: patientMedData.id,
            reminder_type: "dose",
            message: `Hi ${patientInfo.name}, this is your reminder to take ${med.name}. Dosage: ${med.quantity}`,
            scheduled_at: reminderDate.toISOString(),
            delivery_channel: "sms",
            status: "pending",
          });
        }
        if (reminders.length > 0)
          await supabase.from("reminders").insert(reminders);
      }

      toast({
        title: "Patient Registered",
        description: `${patientInfo.name} added with ${medications.length} medication(s).`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register patient",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maxDuration = Math.max(
    ...medications.map((med) => parseInt(med.duration) || 0)
  );
  const selectedCount = bulkPatients.filter((p) => p.selected).length;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 lg:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              Register New Patient
            </h1>
            <p className="text-muted-foreground">
              Add a single patient or bulk import from a file.
            </p>
          </div>

          <Tabs defaultValue="single" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Single Patient
              </TabsTrigger>
              <TabsTrigger value="bulk" className="gap-2">
                <UploadIcon className="h-4 w-4" />
                Bulk Import
              </TabsTrigger>
            </TabsList>

            {/* Single Patient Tab */}
            <TabsContent value="single">
              <Card className="p-6 lg:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Patient Info */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        1
                      </span>
                      Patient Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={patientInfo.name}
                          onChange={(e) =>
                            setPatientInfo({
                              ...patientInfo,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter patient name"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={patientInfo.phone}
                          onChange={(e) =>
                            setPatientInfo({
                              ...patientInfo,
                              phone: e.target.value,
                            })
                          }
                          placeholder="0XX XXX XXXX"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="age">Age (Optional)</Label>
                      <Input
                        id="age"
                        type="number"
                        value={patientInfo.age}
                        onChange={(e) =>
                          setPatientInfo({
                            ...patientInfo,
                            age: e.target.value,
                          })
                        }
                        placeholder="Enter age"
                        className="max-w-[200px]"
                      />
                    </div>
                  </div>

                  {/* Medications */}
                  <div className="space-y-4 pt-5 border-t">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          2
                        </span>
                        Medications ({medications.length})
                      </h2>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMedication}
                        className="gap-1.5 text-xs"
                      >
                        <PlusIcon className="h-3.5 w-3.5" /> Add
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {medications.map((med, index) => (
                        <Card
                          key={med.id}
                          className="p-4 bg-muted/30 border-dashed"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground">
                              Medication {index + 1}
                            </span>
                            {medications.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMedication(med.id)}
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`med-${med.id}`}
                                className="text-xs"
                              >
                                Medication Name *
                              </Label>
                              <Input
                                id={`med-${med.id}`}
                                value={med.name}
                                onChange={(e) =>
                                  updateMedication(
                                    med.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Amoxicillin 500mg"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`dur-${med.id}`}
                                  className="text-xs"
                                >
                                  Duration (days) *
                                </Label>
                                <Input
                                  id={`dur-${med.id}`}
                                  type="number"
                                  min="1"
                                  max="365"
                                  value={med.duration}
                                  onChange={(e) =>
                                    updateMedication(
                                      med.id,
                                      "duration",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., 7"
                                  required
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`qty-${med.id}`}
                                  className="text-xs"
                                >
                                  Quantity/Dosage *
                                </Label>
                                <Input
                                  id={`qty-${med.id}`}
                                  value={med.quantity}
                                  onChange={(e) =>
                                    updateMedication(
                                      med.id,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., 2 tabs 3x daily"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Consent */}
                  <div className="flex items-start space-x-2.5 pt-2">
                    <Checkbox
                      id="consent"
                      checked={patientInfo.consentGiven}
                      onCheckedChange={(checked) =>
                        setPatientInfo({
                          ...patientInfo,
                          consentGiven: checked === true,
                        })
                      }
                      className="mt-0.5"
                    />
                    <Label htmlFor="consent" className="text-sm leading-tight">
                      Patient has given consent to receive SMS/WhatsApp
                      reminders *
                    </Label>
                  </div>

                  {/* Preview */}
                  {medications.some((med) => med.name && med.duration) && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm mb-1.5">
                            Schedule Preview
                          </h3>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            <li>
                              ✓ {medications.filter((m) => m.name).length}{" "}
                              medication(s) with daily reminders
                            </li>
                            <li>
                              ✓{" "}
                              {
                                medications.filter(
                                  (m) => m.name && m.duration
                                ).length
                              }{" "}
                              follow-up(s) scheduled
                            </li>
                            <li>✓ Adherence tracking enabled</li>
                            {maxDuration >= 30 && (
                              <li>✓ Refill reminders for long-term meds</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? "Registering..." : "Register Patient"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={() => navigate("/dashboard")}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </TabsContent>

            {/* Bulk Import Tab */}
            <TabsContent value="bulk">
              <Card className="p-6 lg:p-8 space-y-6">
                {/* Upload Section */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      1
                    </span>
                    Upload Patient File
                  </h2>

                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isParsing ? (
                      <div className="space-y-3">
                        <Loader2Icon className="h-10 w-10 mx-auto text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">
                          Parsing {uploadedFileName}...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <FileSpreadsheetIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            Click to upload a file
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Supports Excel (.xlsx, .xls, .csv), Word (.doc,
                            .docx), and PDF files
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">
                      Expected columns (for Excel):
                    </p>
                    <p>
                      Name, Phone, Age (optional), Medication, Duration (days),
                      Quantity/Dosage
                    </p>
                    <p>
                      For PDF/Word files, the system will use AI to extract
                      patient data automatically.
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                {bulkPatients.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          2
                        </span>
                        Review Patients ({bulkPatients.length})
                      </h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {selectedCount} selected
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            toggleAllPatients(selectedCount < bulkPatients.length)
                          }
                        >
                          {selectedCount === bulkPatients.length
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive"
                          onClick={() => {
                            setBulkPatients([]);
                            setUploadedFileName("");
                          }}
                        >
                          <XIcon className="h-3.5 w-3.5 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Medications</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkPatients.map((patient, index) => (
                            <TableRow
                              key={index}
                              className={
                                !patient.selected ? "opacity-50" : ""
                              }
                            >
                              <TableCell>
                                <Checkbox
                                  checked={patient.selected}
                                  onCheckedChange={() =>
                                    togglePatientSelection(index)
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {patient.full_name}
                              </TableCell>
                              <TableCell className="text-sm">
                                {patient.phone}
                              </TableCell>
                              <TableCell className="text-sm">
                                {patient.age || "—"}
                              </TableCell>
                              <TableCell>
                                {patient.medications.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {patient.medications.map((m, mi) => (
                                      <Badge
                                        key={mi}
                                        variant="outline"
                                        className="text-[10px]"
                                      >
                                        {m.name}
                                        {m.duration
                                          ? ` (${m.duration}d)`
                                          : ""}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    None
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Import Button */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        size="lg"
                        className="flex-1 gap-2"
                        onClick={handleBulkImport}
                        disabled={isBulkImporting || selectedCount === 0}
                      >
                        {isBulkImporting ? (
                          <>
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <UsersIcon className="h-4 w-4" />
                            Import {selectedCount} Patient(s)
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => navigate("/dashboard")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterCustomer;
