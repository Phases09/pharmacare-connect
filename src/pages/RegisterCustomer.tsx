import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { PillIcon, ArrowLeftIcon, CheckIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Medication {
  id: string;
  name: string;
  duration: string;
  quantity: string;
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
    { id: crypto.randomUUID(), name: "", duration: "", quantity: "" }
  ]);

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
        description: "You must be logged in to register patients",
        variant: "destructive",
      });
      return;
    }

    if (!patientInfo.consentGiven) {
      toast({
        title: "Consent Required",
        description: "Please confirm the patient has given consent to receive reminders",
        variant: "destructive",
      });
      return;
    }

    // Validate all medications
    const invalidMedication = medications.find(
      med => !med.name.trim() || !med.duration || !med.quantity.trim()
    );

    if (invalidMedication) {
      toast({
        title: "Incomplete Medication Details",
        description: "Please fill in all medication details (name, duration, and quantity)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create the patient first
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

      // Process each medication
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
            patient_id: patientData.id,
            medication_id: medicationData.id,
            prescribed_by: user.id,
            quantity: med.quantity,
            end_date: endDate.toISOString(),
          })
          .select()
          .single();

        if (patientMedError) throw patientMedError;

        // Schedule a follow-up for this medication
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + durationDays);

        const { error: followUpError } = await supabase
          .from("follow_ups")
          .insert({
            patient_id: patientData.id,
            patient_medication_id: patientMedData.id,
            pharmacist_id: user.id,
            scheduled_date: followUpDate.toISOString().split("T")[0],
          });

        if (followUpError) throw followUpError;

        // Create daily reminders for this medication
        const reminders = [];
        for (let day = 0; day < durationDays; day++) {
          const reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + day);
          reminderDate.setHours(9, 0, 0, 0); // Set to 9 AM

          reminders.push({
            patient_id: patientData.id,
            patient_medication_id: patientMedData.id,
            reminder_type: 'dose',
            message: `Hi ${patientInfo.name}, this is your reminder to take ${med.name}. Dosage: ${med.quantity}`,
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
        title: "Patient Registered Successfully",
        description: `${patientInfo.name} has been added with ${medications.length} medication(s). Reminders will be sent automatically.`,
      });

      // Reset form and navigate to dashboard
      setPatientInfo({
        name: "",
        phone: "",
        age: "",
        consentGiven: false,
      });
      setMedications([{ id: crypto.randomUUID(), name: "", duration: "", quantity: "" }]);

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error registering patient:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maxDuration = Math.max(...medications.map(med => parseInt(med.duration) || 0));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Register New Patient</h1>
            <p className="text-muted-foreground text-lg">
              Add patient details and medications to start automated follow-ups
            </p>
          </div>

          {/* Registration Form */}
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Information Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </span>
                  Patient Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={patientInfo.name}
                      onChange={(e) =>
                        setPatientInfo({ ...patientInfo, name: e.target.value })
                      }
                      placeholder="Enter patient name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={patientInfo.phone}
                      onChange={(e) =>
                        setPatientInfo({ ...patientInfo, phone: e.target.value })
                      }
                      placeholder="0XX XXX XXXX"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age (Optional)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={patientInfo.age}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, age: e.target.value })
                    }
                    placeholder="Enter age"
                    className="max-w-xs"
                  />
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

              {/* Consent Checkbox */}
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="consent"
                  checked={patientInfo.consentGiven}
                  onCheckedChange={(checked) =>
                    setPatientInfo({ ...patientInfo, consentGiven: checked === true })
                  }
                />
                <Label htmlFor="consent" className="text-sm">
                  Patient has given consent to receive SMS/WhatsApp reminders *
                </Label>
              </div>

              {/* Reminder Preview */}
              {medications.some(med => med.name && med.duration) && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        Automated Schedule Preview
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ {medications.filter(m => m.name).length} medication(s) will have daily reminders</li>
                        <li>✓ {medications.filter(m => m.name && m.duration).length} follow-up(s) scheduled</li>
                        <li>✓ Adherence tracking enabled for all medications</li>
                        {maxDuration >= 30 && (
                          <li>✓ Refill reminders will be sent for long-term medications</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" size="lg" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register Patient"}
                </Button>
                <Link to="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>

          {/* Help Card */}
          <Card className="p-6 mt-6 bg-muted/50">
            <h3 className="font-semibold mb-2">Quick Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You can add multiple medications for a single patient</li>
              <li>• Each medication gets its own reminders and follow-up schedule</li>
              <li>• The system will automatically schedule reminders based on each medication</li>
              <li>• You'll receive alerts when it's time to contact the patient</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterCustomer;
