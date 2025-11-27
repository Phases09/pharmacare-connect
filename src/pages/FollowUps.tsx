import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Phone, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FollowUp {
  id: string;
  scheduled_date: string;
  status: string;
  outcome: string | null;
  notes: string | null;
  contacted_at: string | null;
  patient: {
    full_name: string;
    phone: string;
  };
  patient_medication: {
    medication: {
      name: string;
    };
  };
}

const FollowUps = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          patient:patients(full_name, phone),
          patient_medication:patient_medications(
            medication:medications(name)
          )
        `)
        .eq('pharmacist_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setFollowUps(data || []);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast({
        title: "Error",
        description: "Failed to load follow-ups",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFollowUp = async (followUpId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('follow_ups')
        .update(updates)
        .eq('id', followUpId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Follow-up updated successfully"
      });

      fetchFollowUps();
      setSelectedFollowUp(null);
      setOutcome("");
      setNotes("");
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to update follow-up",
        variant: "destructive"
      });
    }
  };

  const categorizeFollowUps = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const urgent = followUps.filter(f => 
      f.status === 'pending' && new Date(f.scheduled_date) < today
    );

    const upcoming = followUps.filter(f => 
      f.status === 'pending' && new Date(f.scheduled_date) >= today
    );

    const completed = followUps.filter(f => 
      f.status === 'completed'
    );

    return { urgent, upcoming, completed };
  };

  const { urgent, upcoming, completed } = categorizeFollowUps();

  const getDaysOverdue = (scheduledDate: string) => {
    const today = new Date();
    const scheduled = new Date(scheduledDate);
    const diff = Math.floor((today.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDaysUntil = (scheduledDate: string) => {
    const today = new Date();
    const scheduled = new Date(scheduledDate);
    const diff = Math.floor((scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">MR</span>
            </div>
            <h1 className="text-2xl font-bold">MedReminder Pro</h1>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Patient Follow-Ups</h2>
            <p className="text-muted-foreground">
              Manage and track follow-up calls for your patients
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Urgent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-destructive">
                    {urgent.length}
                  </span>
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-primary">
                    {upcoming.length}
                  </span>
                  <Clock className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-green-600">
                    {completed.length}
                  </span>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">
                    {followUps.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Follow-up Lists */}
          <Tabs defaultValue="urgent" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="urgent">
                Urgent ({urgent.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completed.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="urgent" className="space-y-4">
              {urgent.map((followUp) => (
                <Card key={followUp.id} className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{followUp.patient.full_name}</h3>
                          <Badge variant="destructive">
                            {getDaysOverdue(followUp.scheduled_date)} days overdue
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {followUp.patient.phone}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Medication:</span> {followUp.patient_medication.medication.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {followUp.scheduled_date}
                        </p>

                        {selectedFollowUp === followUp.id && (
                          <div className="space-y-3 pt-4 border-t">
                            <Select value={outcome} onValueChange={setOutcome}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select outcome" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Called - Improving">Called - Improving</SelectItem>
                                <SelectItem value="Called - Needs Refill">Called - Needs Refill</SelectItem>
                                <SelectItem value="Not Reached">Not Reached</SelectItem>
                                <SelectItem value="Wants Consultation">Wants Consultation</SelectItem>
                              </SelectContent>
                            </Select>

                            <Textarea
                              placeholder="Add notes..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            />

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateFollowUp(followUp.id, {
                                    status: 'completed',
                                    outcome,
                                    notes,
                                    contacted_at: new Date().toISOString()
                                  });
                                }}
                                disabled={!outcome}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedFollowUp(null);
                                  setOutcome("");
                                  setNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedFollowUp !== followUp.id && (
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedFollowUp(followUp.id)}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcoming.map((followUp) => (
                <Card key={followUp.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{followUp.patient.full_name}</h3>
                          <Badge variant="secondary">
                            In {getDaysUntil(followUp.scheduled_date)} days
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {followUp.patient.phone}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Medication:</span> {followUp.patient_medication.medication.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {followUp.scheduled_date}
                        </p>

                        {selectedFollowUp === followUp.id && (
                          <div className="space-y-3 pt-4 border-t">
                            <Select value={outcome} onValueChange={setOutcome}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select outcome" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Called - Improving">Called - Improving</SelectItem>
                                <SelectItem value="Called - Needs Refill">Called - Needs Refill</SelectItem>
                                <SelectItem value="Not Reached">Not Reached</SelectItem>
                                <SelectItem value="Wants Consultation">Wants Consultation</SelectItem>
                              </SelectContent>
                            </Select>

                            <Textarea
                              placeholder="Add notes..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            />

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateFollowUp(followUp.id, {
                                    status: 'completed',
                                    outcome,
                                    notes,
                                    contacted_at: new Date().toISOString()
                                  });
                                }}
                                disabled={!outcome}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedFollowUp(null);
                                  setOutcome("");
                                  setNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedFollowUp !== followUp.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFollowUp(followUp.id)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Early
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completed.map((followUp) => (
                <Card key={followUp.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{followUp.patient.full_name}</h3>
                          <Badge variant="default" className="bg-green-600">
                            {followUp.outcome}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {followUp.contacted_at ? new Date(followUp.contacted_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {followUp.patient.phone}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Medication:</span> {followUp.patient_medication.medication.name}
                      </p>
                      {followUp.notes && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium">Notes:</span> {followUp.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default FollowUps;
