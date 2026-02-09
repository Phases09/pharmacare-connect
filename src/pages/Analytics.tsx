import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUpIcon, UsersIcon, BellIcon, CalendarIcon, ActivityIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

interface ReminderStats { sent: number; pending: number; failed: number; }
interface FollowUpStats { completed: number; pending: number; }
interface MedicationCategory { category: string; count: number; }
interface MonthlyData { month: string; patients: number; reminders: number; }

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalReminders, setTotalReminders] = useState(0);
  const [reminderStats, setReminderStats] = useState<ReminderStats>({ sent: 0, pending: 0, failed: 0 });
  const [followUpStats, setFollowUpStats] = useState<FollowUpStats>({ completed: 0, pending: 0 });
  const [medicationCategories, setMedicationCategories] = useState<MedicationCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => { if (user) fetchAnalyticsData(); }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: patients } = await supabase.from("patients").select("id, created_at").eq("pharmacist_id", user.id);
      const patientIds = patients?.map(p => p.id) || [];
      setTotalPatients(patientIds.length);

      if (patientIds.length > 0) {
        const { data: reminders } = await supabase.from("reminders").select("status").in("patient_id", patientIds);
        if (reminders) {
          setTotalReminders(reminders.length);
          setReminderStats({ sent: reminders.filter(r => r.status === 'sent').length, pending: reminders.filter(r => r.status === 'pending').length, failed: reminders.filter(r => r.status === 'failed').length });
        }
      }

      const { data: followUps } = await supabase.from("follow_ups").select("status").eq("pharmacist_id", user.id);
      if (followUps) setFollowUpStats({ completed: followUps.filter(f => f.status === 'completed').length, pending: followUps.filter(f => f.status === 'pending').length });

      if (patientIds.length > 0) {
        const { data: patientMeds } = await supabase.from("patient_medications").select("medication_id, medications(category)").in("patient_id", patientIds);
        if (patientMeds) {
          const categoryMap: Record<string, number> = {};
          patientMeds.forEach((pm: any) => { const cat = pm.medications?.category || "Other"; categoryMap[cat] = (categoryMap[cat] || 0) + 1; });
          setMedicationCategories(Object.entries(categoryMap).map(([category, count]) => ({ category, count })));
        }
      }

      if (patients && patients.length > 0) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthCounts: Record<string, { patients: number; reminders: number }> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); monthCounts[`${d.getFullYear()}-${d.getMonth()}`] = { patients: 0, reminders: 0 }; }
        patients.forEach(p => { const d = new Date(p.created_at); const key = `${d.getFullYear()}-${d.getMonth()}`; if (monthCounts[key] !== undefined) monthCounts[key].patients++; });
        setMonthlyData(Object.entries(monthCounts).map(([key, val]) => { const [, month] = key.split("-").map(Number); return { month: monthNames[month], patients: val.patients, reminders: val.reminders }; }));
      }
    } catch (error) { console.error("Error fetching analytics:", error); }
    finally { setLoading(false); }
  };

  const adherenceRate = totalReminders > 0 ? Math.round((reminderStats.sent / totalReminders) * 100) : 0;
  const followUpCompletionRate = (followUpStats.completed + followUpStats.pending) > 0 ? Math.round((followUpStats.completed / (followUpStats.completed + followUpStats.pending)) * 100) : 0;

  const reminderData = [
    { name: "Sent", value: reminderStats.sent, color: "hsl(152, 60%, 40%)" },
    { name: "Pending", value: reminderStats.pending, color: "hsl(174, 62%, 38%)" },
    { name: "Failed", value: reminderStats.failed, color: "hsl(0, 72%, 51%)" },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Analytics</h1>
          <p className="text-muted-foreground">Track performance metrics and patient outcomes.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Patients", value: totalPatients, icon: UsersIcon },
            { label: "Adherence Rate", value: `${adherenceRate}%`, icon: TrendingUpIcon },
            { label: "Reminders Sent", value: reminderStats.sent, icon: BellIcon },
            { label: "Follow-ups Done", value: followUpStats.completed, icon: CalendarIcon },
          ].map((stat, i) => (
            <Card key={i} className="p-5">
              <stat.icon className="h-4 w-4 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="adherence">Adherence</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-semibold mb-4">Patient Registrations</h3>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="patients" stroke="hsl(174, 62%, 38%)" strokeWidth={2} dot={{ r: 4 }} name="New Patients" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-semibold mb-4">Medication Categories</h3>
                {medicationCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={medicationCategories}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} name="Prescriptions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No medications yet</div>}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="adherence" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Delivery Rate", value: `${adherenceRate}%`, icon: ActivityIcon, color: "success" },
                { label: "Reminders Delivered", value: reminderStats.sent, icon: TrendingUpIcon, color: "primary" },
                { label: "Active Patients", value: totalPatients, icon: UsersIcon, color: "accent" },
              ].map((s, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full bg-${s.color}/10 flex items-center justify-center`}>
                      <s.icon className={`h-5 w-5 text-${s.color}`} />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-semibold mb-4">Delivery Status</h3>
                {reminderData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={reminderData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={95} dataKey="value">
                        {reminderData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No reminders yet</div>}
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-semibold mb-4">Statistics</h3>
                <div className="space-y-3">
                  {[
                    { label: "Total Created", value: totalReminders },
                    { label: "Sent Successfully", value: reminderStats.sent, className: "text-success" },
                    { label: "Pending", value: reminderStats.pending },
                    { label: "Failed", value: reminderStats.failed, className: "text-destructive" },
                    { label: "Delivery Rate", value: `${adherenceRate}%`, className: "text-success" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={`text-lg font-semibold ${item.className || ""}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="followups" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Completed", value: followUpStats.completed, className: "text-success" },
                { label: "Pending", value: followUpStats.pending, className: "text-warning" },
                { label: "Completion Rate", value: `${followUpCompletionRate}%` },
                { label: "Total", value: followUpStats.completed + followUpStats.pending },
              ].map((s, i) => (
                <Card key={i} className="p-5">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.className || ""}`}>{s.value}</div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm flex-1">Completed follow-ups</span>
                  <span className="font-semibold">{followUpStats.completed}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm flex-1">Pending follow-ups</span>
                  <span className="font-semibold">{followUpStats.pending}</span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
