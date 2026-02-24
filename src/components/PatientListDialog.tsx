import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SearchIcon, UserIcon, PillIcon, CalendarIcon, PhoneIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PatientRecord {
  id: string;
  full_name: string;
  phone: string;
  age: number | null;
  consent_given: boolean | null;
  created_at: string | null;
}

interface MedicationHistory {
  id: string;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  quantity: string;
  custom_dosage: string | null;
  medication: {
    name: string;
    treatment_duration_days: number;
    standard_dosage: string | null;
    category: string | null;
  };
}

interface PatientListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PatientListDialog({ open, onOpenChange }: PatientListDialogProps) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [medHistory, setMedHistory] = useState<MedicationHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (open && user) fetchPatients();
  }, [open, user]);

  const fetchPatients = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("patients")
      .select("id, full_name, phone, age, consent_given, created_at")
      .eq("pharmacist_id", user.id)
      .order("full_name");
    setPatients(data || []);
    setLoading(false);
  };

  const viewRecord = async (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setLoadingHistory(true);
    const { data } = await supabase
      .from("patient_medications")
      .select(`
        id, start_date, end_date, status, quantity, custom_dosage,
        medication:medications(name, treatment_duration_days, standard_dosage, category)
      `)
      .eq("patient_id", patient.id)
      .order("start_date", { ascending: false });
    setMedHistory((data as unknown as MedicationHistory[]) || []);
    setLoadingHistory(false);
  };

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  // Patient record detail view
  if (selectedPatient) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setSelectedPatient(null); } onOpenChange(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              Patient Record
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Info */}
            <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {selectedPatient.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{selectedPatient.full_name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <PhoneIcon className="h-3 w-3" /> {selectedPatient.phone}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                {selectedPatient.age && <span>Age: {selectedPatient.age}</span>}
                <span>Registered: {selectedPatient.created_at ? new Date(selectedPatient.created_at).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>

            {/* Medication History */}
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <PillIcon className="h-4 w-4 text-primary" />
                Medication History
              </h3>
              <ScrollArea className="max-h-[40vh]">
                {loadingHistory ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
                ) : medHistory.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No medications found</div>
                ) : (
                  <div className="space-y-2">
                    {medHistory.map((med) => (
                      <div key={med.id} className="p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{med.medication.name}</span>
                          <Badge variant={med.status === "active" ? "default" : "secondary"} className="text-[10px]">
                            {med.status || "active"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                          {med.medication.category && <span>{med.medication.category}</span>}
                          <span>Qty: {med.quantity}</span>
                          {med.medication.standard_dosage && <span>Dosage: {med.medication.standard_dosage}</span>}
                          <span>Duration: {med.medication.treatment_duration_days} days</span>
                        </div>
                        <div className="flex gap-3 text-[11px] text-muted-foreground/70 mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Start: {med.start_date ? new Date(med.start_date).toLocaleDateString() : "N/A"}
                          </span>
                          {med.end_date && <span>End: {new Date(med.end_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedPatient(null)}>
              ← Back to Patient List
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Patient list view
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Patient List ({patients.length})
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-2">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-[55vh]">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading patients...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No patients found</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {patient.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{patient.full_name}</div>
                      <div className="text-xs text-muted-foreground">{patient.phone}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => viewRecord(patient)}>
                    View Record
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
