import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { PillIcon, ArrowLeftIcon, CheckIcon, PlusIcon, TrashIcon, SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

interface Medication {
  id: string;
  name: string;
  duration: string;
  quantity: string;
}

const AddMedications = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [medications, setMedications] = useState<Medication[]>([
    { id: crypto.randomUUID(), name: "", duration: "", quantity: "" }
  ]);

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, phone")
      .eq("pharmacist_id", user.id)
      .order("full_name", { ascending: true });
    
    if (error) {
      console.error("Error fetching patients:", error);
      return;
    }
    
    setPatients(data || []);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const addMedication = () => {
    setMedications([
      ...medications,
      { id: crypto.randomUUID(), name: "", duration: "", quantity: "" }
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter(med => med.id !== id));
    }
  };

  const updateMedication = (id: string, field: keyof Omit<Medication, 'id'>, value: string) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
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

    if (!selectedPatientId) {
      toast({
        title: "Select Patient",
        description: "Please select a patient first",
        variant: "destructive",
      });
      return;
    }

    const invalidMedication = medications.find(
      med => !med.name.trim() || !med.duration || !med.quantity.trim()
    );

    if (invalidMedication) {
      toast({
        title: "Incomplete Medication Details",
        description: "Please fill in all medication details",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      for (const med of medications) {
        // Create the medication record
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

        // Create the patient medication record
        const durationDays = parseInt(med.duration);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        const { data: patientMedData, error: patientMedError } = await supabase
          .from("patient_medications")
          .insert({
            patient_id: selectedPatientId,
            medication_id: medicationData.id,
            prescribed_by: user.id,
            quantity: med.quantity,
            end_date: endDate.toISOString(),
          })
          .select()
          .single();

        if (patientMedError) throw patientMedError;

        // Schedule a follow-up
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + durationDays);

        const { error: followUpError } = await supabase
          .from("follow_ups")
          .insert({
            patient_id: selectedPatientId,
            patient_medication_id: patientMedData.id,
            pharmacist_id: user.id,
            scheduled_date: followUpDate.toISOString().split("T")[0],
          });

        if (followUpError) throw followUpError;

        // Create daily reminders
        const reminders = [];
        for (let day = 0; day < durationDays; day++) {
          const reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + day);
          reminderDate.setHours(9, 0, 0, 0);

          reminders.push({
            patient_id: selectedPatientId,
            patient_medication_id: patientMedData.id,
            reminder_type: 'dose',
            message: `Hi ${selectedPatient?.full_name}, this is your reminder to take ${med.name}. Dosage: ${med.quantity}`,
            scheduled_at: reminderDate.toISOString(),
            delivery_channel: 'sms',
            status: 'pending'
          });
        }

        if (reminders.length > 0) {
          const { error: remindersError } = await supabase
            .from("reminders")
            .insert(reminders);

          if (remindersError) {
            console.error("Error creating reminders:", remindersError);
          }
        }
      }

      toast({
        title: "Medications Added",
        description: `${medications.length} medication(s) added to ${selectedPatient?.full_name}`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error adding medications:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add medications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <PillIcon className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                PharmaCare
              </span>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Add Medications</h1>
            <p className="text-muted-foreground text-lg">
              Add new medications to an existing patient
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </span>
                  Select Patient
                </h2>

                <div className="space-y-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPatients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name} - {patient.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedPatient && (
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {selectedPatient.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold">{selectedPatient.full_name}</div>
                          <div className="text-sm text-muted-foreground">{selectedPatient.phone}</div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              {/* Medications Section */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      2
                    </span>
                    Medications ({medications.length})
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMedication}
                    className="flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Medication
                  </Button>
                </div>

                <div className="space-y-4">
                  {medications.map((med, index) => (
                    <Card key={med.id} className="p-4 bg-muted/30">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Medication {index + 1}
                        </span>
                        {medications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedication(med.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`medication-${med.id}`}>Medication Name *</Label>
                          <Input
                            id={`medication-${med.id}`}
                            value={med.name}
                            onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                            placeholder="e.g., Amoxicillin 500mg"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`duration-${med.id}`}>Treatment Duration (days) *</Label>
                            <Input
                              id={`duration-${med.id}`}
                              type="number"
                              min="1"
                              max="365"
                              value={med.duration}
                              onChange={(e) => updateMedication(med.id, 'duration', e.target.value)}
                              placeholder="e.g., 7"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`quantity-${med.id}`}>Quantity/Dosage *</Label>
                            <Input
                              id={`quantity-${med.id}`}
                              value={med.quantity}
                              onChange={(e) => updateMedication(med.id, 'quantity', e.target.value)}
                              placeholder="e.g., 2 tablets 3x daily"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {selectedPatient && medications.some(med => med.name && med.duration) && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        Schedule Preview for {selectedPatient.full_name}
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ {medications.filter(m => m.name).length} new medication(s) will be added</li>
                        <li>✓ {medications.filter(m => m.name && m.duration).length} follow-up(s) will be scheduled</li>
                        <li>✓ Daily reminders will be created for each medication</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" size="lg" className="flex-1" disabled={isLoading || !selectedPatientId}>
                  {isLoading ? "Adding..." : "Add Medications"}
                </Button>
                <Link to="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddMedications;
