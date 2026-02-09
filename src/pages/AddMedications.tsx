import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { CheckIcon, PlusIcon, TrashIcon, SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";

interface Patient { id: string; full_name: string; phone: string; }
interface Medication { id: string; name: string; duration: string; quantity: string; }

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

  useEffect(() => { fetchPatients(); }, [user]);

  const fetchPatients = async () => {
    if (!user) return;
    const { data } = await supabase.from("patients").select("id, full_name, phone").eq("pharmacist_id", user.id).order("full_name");
    setPatients(data || []);
  };

  const filteredPatients = patients.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm));
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const addMedication = () => setMedications([...medications, { id: crypto.randomUUID(), name: "", duration: "", quantity: "" }]);
  const removeMedication = (id: string) => { if (medications.length > 1) setMedications(medications.filter(m => m.id !== id)); };
  const updateMedication = (id: string, field: keyof Omit<Medication, 'id'>, value: string) => setMedications(medications.map(m => m.id === id ? { ...m, [field]: value } : m));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Error", description: "You must be logged in", variant: "destructive" }); return; }
    if (!selectedPatientId) { toast({ title: "Select Patient", description: "Please select a patient first", variant: "destructive" }); return; }
    const invalid = medications.find(m => !m.name.trim() || !m.duration || !m.quantity.trim());
    if (invalid) { toast({ title: "Incomplete", description: "Fill in all medication details", variant: "destructive" }); return; }

    setIsLoading(true);
    try {
      for (const med of medications) {
        const { data: medicationData, error: medicationError } = await supabase.from("medications").insert({ name: med.name.trim(), treatment_duration_days: parseInt(med.duration), reminder_frequency: "daily", follow_up_day: parseInt(med.duration) }).select().single();
        if (medicationError) throw medicationError;

        const durationDays = parseInt(med.duration);
        const endDate = new Date(); endDate.setDate(endDate.getDate() + durationDays);
        const { data: patientMedData, error: patientMedError } = await supabase.from("patient_medications").insert({ patient_id: selectedPatientId, medication_id: medicationData.id, prescribed_by: user.id, quantity: med.quantity, end_date: endDate.toISOString() }).select().single();
        if (patientMedError) throw patientMedError;

        const followUpDate = new Date(); followUpDate.setDate(followUpDate.getDate() + durationDays);
        await supabase.from("follow_ups").insert({ patient_id: selectedPatientId, patient_medication_id: patientMedData.id, pharmacist_id: user.id, scheduled_date: followUpDate.toISOString().split("T")[0] });

        const reminders = [];
        for (let day = 0; day < durationDays; day++) {
          const reminderDate = new Date(); reminderDate.setDate(reminderDate.getDate() + day); reminderDate.setHours(9, 0, 0, 0);
          reminders.push({ patient_id: selectedPatientId, patient_medication_id: patientMedData.id, reminder_type: 'dose', message: `Hi ${selectedPatient?.full_name}, reminder to take ${med.name}. Dosage: ${med.quantity}`, scheduled_at: reminderDate.toISOString(), delivery_channel: 'sms', status: 'pending' });
        }
        if (reminders.length > 0) await supabase.from("reminders").insert(reminders);
      }
      toast({ title: "Medications Added", description: `${medications.length} medication(s) added to ${selectedPatient?.full_name}` });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add medications", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 lg:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-1">Add Medications</h1>
            <p className="text-muted-foreground">Add new medications to an existing patient.</p>
          </div>

          <Card className="p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Selection */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  Select Patient
                </h2>
                <div className="space-y-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search patients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger><SelectValue placeholder="Select a patient" /></SelectTrigger>
                    <SelectContent>
                      {filteredPatients.map(p => (<SelectItem key={p.id} value={p.id}>{p.full_name} — {p.phone}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {selectedPatient && (
                    <Card className="p-3 bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">{selectedPatient.full_name.charAt(0)}</div>
                        <div>
                          <div className="font-medium text-sm">{selectedPatient.full_name}</div>
                          <div className="text-xs text-muted-foreground">{selectedPatient.phone}</div>
                        </div>
                      </div>
                    </Card>
                  )}
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
                          <Label className="text-xs">Medication Name *</Label>
                          <Input value={med.name} onChange={(e) => updateMedication(med.id, 'name', e.target.value)} placeholder="e.g., Amoxicillin 500mg" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Duration (days) *</Label>
                            <Input type="number" min="1" max="365" value={med.duration} onChange={(e) => updateMedication(med.id, 'duration', e.target.value)} placeholder="e.g., 7" required />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Quantity/Dosage *</Label>
                            <Input value={med.quantity} onChange={(e) => updateMedication(med.id, 'quantity', e.target.value)} placeholder="e.g., 2 tabs 3x daily" required />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {selectedPatient && medications.some(m => m.name && m.duration) && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1.5">Preview for {selectedPatient.full_name}</h3>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>✓ {medications.filter(m => m.name).length} new medication(s)</li>
                        <li>✓ {medications.filter(m => m.name && m.duration).length} follow-up(s)</li>
                        <li>✓ Daily reminders for each medication</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" size="lg" className="flex-1" disabled={isLoading || !selectedPatientId}>
                  {isLoading ? "Adding..." : "Add Medications"}
                </Button>
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => navigate("/dashboard")}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddMedications;
