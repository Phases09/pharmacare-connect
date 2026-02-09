import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { CheckIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

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
    name: "", phone: "", age: "", consentGiven: false,
  });
  const [medications, setMedications] = useState<Medication[]>([
    { id: crypto.randomUUID(), name: "", duration: "", quantity: "" }
  ]);

  const addMedication = () => {
    setMedications([...medications, { id: crypto.randomUUID(), name: "", duration: "", quantity: "" }]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) setMedications(medications.filter(med => med.id !== id));
  };

  const updateMedication = (id: string, field: keyof Omit<Medication, 'id'>, value: string) => {
    setMedications(medications.map(med => med.id === id ? { ...med, [field]: value } : med));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Error", description: "You must be logged in", variant: "destructive" }); return; }
    if (!patientInfo.consentGiven) { toast({ title: "Consent Required", description: "Patient must give consent to receive reminders", variant: "destructive" }); return; }
    const invalid = medications.find(med => !med.name.trim() || !med.duration || !med.quantity.trim());
    if (invalid) { toast({ title: "Incomplete", description: "Please fill in all medication details", variant: "destructive" }); return; }

    setIsLoading(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert({ full_name: patientInfo.name, phone: patientInfo.phone, age: patientInfo.age ? parseInt(patientInfo.age) : null, pharmacist_id: user.id, consent_given: patientInfo.consentGiven })
        .select().single();
      if (patientError) throw patientError;

      for (const med of medications) {
        const { data: medicationData, error: medicationError } = await supabase
          .from("medications")
          .insert({ name: med.name.trim(), treatment_duration_days: parseInt(med.duration), reminder_frequency: "daily", follow_up_day: parseInt(med.duration) })
          .select().single();
        if (medicationError) throw medicationError;

        const durationDays = parseInt(med.duration);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        const { data: patientMedData, error: patientMedError } = await supabase
          .from("patient_medications")
          .insert({ patient_id: patientData.id, medication_id: medicationData.id, prescribed_by: user.id, quantity: med.quantity, end_date: endDate.toISOString() })
          .select().single();
        if (patientMedError) throw patientMedError;

        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + durationDays);
        await supabase.from("follow_ups").insert({ patient_id: patientData.id, patient_medication_id: patientMedData.id, pharmacist_id: user.id, scheduled_date: followUpDate.toISOString().split("T")[0] });

        const reminders = [];
        for (let day = 0; day < durationDays; day++) {
          const reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + day);
          reminderDate.setHours(9, 0, 0, 0);
          reminders.push({ patient_id: patientData.id, patient_medication_id: patientMedData.id, reminder_type: 'dose', message: `Hi ${patientInfo.name}, this is your reminder to take ${med.name}. Dosage: ${med.quantity}`, scheduled_at: reminderDate.toISOString(), delivery_channel: 'sms', status: 'pending' });
        }
        if (reminders.length > 0) await supabase.from("reminders").insert(reminders);
      }

      toast({ title: "Patient Registered", description: `${patientInfo.name} added with ${medications.length} medication(s).` });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Error", description: error.message || "Failed to register patient", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const maxDuration = Math.max(...medications.map(med => parseInt(med.duration) || 0));

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 lg:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-1">Register New Patient</h1>
            <p className="text-muted-foreground">Add patient details and medications to start automated follow-ups.</p>
          </div>

          <Card className="p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Info */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  Patient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={patientInfo.name} onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })} placeholder="Enter patient name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" value={patientInfo.phone} onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })} placeholder="0XX XXX XXXX" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="age">Age (Optional)</Label>
                  <Input id="age" type="number" value={patientInfo.age} onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })} placeholder="Enter age" className="max-w-[200px]" />
                </div>
              </div>

              {/* Medications */}
              <div className="space-y-4 pt-5 border-t">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                    Medications ({medications.length})
                  </h2>
                  <Button type="button" variant="outline" size="sm" onClick={addMedication} className="gap-1.5 text-xs">
                    <PlusIcon className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>

                <div className="space-y-3">
                  {medications.map((med, index) => (
                    <Card key={med.id} className="p-4 bg-muted/30 border-dashed">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">Medication {index + 1}</span>
                        {medications.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeMedication(med.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={`med-${med.id}`} className="text-xs">Medication Name *</Label>
                          <Input id={`med-${med.id}`} value={med.name} onChange={(e) => updateMedication(med.id, 'name', e.target.value)} placeholder="e.g., Amoxicillin 500mg" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={`dur-${med.id}`} className="text-xs">Duration (days) *</Label>
                            <Input id={`dur-${med.id}`} type="number" min="1" max="365" value={med.duration} onChange={(e) => updateMedication(med.id, 'duration', e.target.value)} placeholder="e.g., 7" required />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`qty-${med.id}`} className="text-xs">Quantity/Dosage *</Label>
                            <Input id={`qty-${med.id}`} value={med.quantity} onChange={(e) => updateMedication(med.id, 'quantity', e.target.value)} placeholder="e.g., 2 tabs 3x daily" required />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Consent */}
              <div className="flex items-start space-x-2.5 pt-2">
                <Checkbox id="consent" checked={patientInfo.consentGiven} onCheckedChange={(checked) => setPatientInfo({ ...patientInfo, consentGiven: checked === true })} className="mt-0.5" />
                <Label htmlFor="consent" className="text-sm leading-tight">
                  Patient has given consent to receive SMS/WhatsApp reminders *
                </Label>
              </div>

              {/* Preview */}
              {medications.some(med => med.name && med.duration) && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1.5">Schedule Preview</h3>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>✓ {medications.filter(m => m.name).length} medication(s) with daily reminders</li>
                        <li>✓ {medications.filter(m => m.name && m.duration).length} follow-up(s) scheduled</li>
                        <li>✓ Adherence tracking enabled</li>
                        {maxDuration >= 30 && <li>✓ Refill reminders for long-term meds</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" size="lg" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register Patient"}
                </Button>
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterCustomer;
