import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Phone, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/DashboardLayout";

interface FollowUp {
  id: string;
  scheduled_date: string;
  status: string;
  outcome: string | null;
  notes: string | null;
  contacted_at: string | null;
  patient: { full_name: string; phone: string };
  patient_medication: { medication: { name: string } };
}

const FollowUps = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, string>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => { fetchFollowUps(); }, []);

  const fetchFollowUps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('follow_ups')
        .select(`*, patient:patients(full_name, phone), patient_medication:patient_medications(medication:medications(name))`)
        .eq('pharmacist_id', user.id)
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      setFollowUps(data || []);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast({ title: "Error", description: "Failed to load follow-ups", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateFollowUp = async (followUpId: string, updates: any) => {
    try {
      const { error } = await supabase.from('follow_ups').update(updates).eq('id', followUpId);
      if (error) throw error;
      toast({ title: "Success", description: "Follow-up updated successfully" });
      fetchFollowUps();
      setSelectedFollowUp(null);
      setOutcomes(prev => { const s = { ...prev }; delete s[followUpId]; return s; });
      setNotesMap(prev => { const s = { ...prev }; delete s[followUpId]; return s; });
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast({ title: "Error", description: "Failed to update follow-up", variant: "destructive" });
    }
  };

  const categorizeFollowUps = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      urgent: followUps.filter(f => f.status === 'pending' && new Date(f.scheduled_date) < today),
      upcoming: followUps.filter(f => f.status === 'pending' && new Date(f.scheduled_date) >= today),
      completed: followUps.filter(f => f.status === 'completed'),
    };
  };

  const { urgent, upcoming, completed } = categorizeFollowUps();

  const getDaysOverdue = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  const getDaysUntil = (d: string) => Math.floor((new Date(d).getTime() - Date.now()) / 86400000);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const renderFollowUpCard = (followUp: FollowUp, type: "urgent" | "upcoming" | "completed") => (
    <Card key={followUp.id} className={type === "urgent" ? "border-destructive/40" : ""}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{followUp.patient.full_name}</h3>
              {type === "urgent" && (
                <Badge variant="destructive" className="text-xs">
                  {getDaysOverdue(followUp.scheduled_date)}d overdue
                </Badge>
              )}
              {type === "upcoming" && (
                <Badge variant="secondary" className="text-xs">
                  In {getDaysUntil(followUp.scheduled_date)}d
                </Badge>
              )}
              {type === "completed" && (
                <Badge className="bg-success/10 text-success border-0 text-xs">Completed</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {followUp.patient.phone}
            </p>
            <p className="text-sm">
              <span className="font-medium">Medication:</span>{" "}
              {followUp.patient_medication.medication.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {type === "completed" ? "Completed" : "Due"}: {followUp.scheduled_date}
            </p>

            {type === "completed" && followUp.outcome && (
              <div className="pt-2">
                <p className="text-xs"><span className="font-medium">Outcome:</span> {followUp.outcome}</p>
                {followUp.notes && <p className="text-xs text-muted-foreground mt-0.5">{followUp.notes}</p>}
              </div>
            )}

            {selectedFollowUp === followUp.id && (
              <div className="space-y-3 pt-3 border-t mt-3">
                <Select value={outcomes[followUp.id] || ""} onValueChange={(val) => setOutcomes(prev => ({ ...prev, [followUp.id]: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Called - Improving">Called - Improving</SelectItem>
                    <SelectItem value="Called - Needs Refill">Called - Needs Refill</SelectItem>
                    <SelectItem value="Not Reached">Not Reached</SelectItem>
                    <SelectItem value="Wants Consultation">Wants Consultation</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Add notes..."
                  value={notesMap[followUp.id] || ""}
                  onChange={(e) => setNotesMap(prev => ({ ...prev, [followUp.id]: e.target.value }))}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateFollowUp(followUp.id, { status: 'completed', outcome: outcomes[followUp.id], notes: notesMap[followUp.id] || "", contacted_at: new Date().toISOString() })} disabled={!outcomes[followUp.id]}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedFollowUp(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          {type !== "completed" && selectedFollowUp !== followUp.id && (
            <Button size="sm" variant={type === "urgent" ? "default" : "outline"} onClick={() => setSelectedFollowUp(followUp.id)} className="shrink-0">
              <Phone className="h-3.5 w-3.5 mr-1.5" />
              {type === "urgent" ? "Mark Complete" : "Call Early"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Patient Follow-Ups</h1>
          <p className="text-muted-foreground">Manage and track follow-up calls for your patients.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Urgent", value: urgent.length, icon: AlertCircle, color: "destructive" },
            { label: "Upcoming", value: upcoming.length, icon: Clock, color: "primary" },
            { label: "Completed", value: completed.length, icon: CheckCircle2, color: "success" },
            { label: "Total", value: followUps.length, icon: null, color: "foreground" },
          ].map((s, i) => (
            <Card key={i} className="p-5">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">{s.label}</div>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold text-${s.color}`}>{s.value}</span>
                {s.icon && <s.icon className={`h-6 w-6 text-${s.color}/60`} />}
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="urgent" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="urgent">Urgent ({urgent.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="urgent" className="space-y-3">
            {urgent.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No urgent follow-ups 🎉</div>
            ) : urgent.map(f => renderFollowUpCard(f, "urgent"))}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3">
            {upcoming.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No upcoming follow-ups</div>
            ) : upcoming.map(f => renderFollowUpCard(f, "upcoming"))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completed.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No completed follow-ups yet</div>
            ) : completed.map(f => renderFollowUpCard(f, "completed"))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FollowUps;
