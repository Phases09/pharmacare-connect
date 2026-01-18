import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import {
  TrendingUpIcon,
  UsersIcon,
  BellIcon,
  CalendarIcon,
  ActivityIcon,
  PillIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ReminderStats {
  sent: number;
  pending: number;
  failed: number;
}

interface FollowUpStats {
  completed: number;
  pending: number;
}

interface MedicationCategory {
  category: string;
  count: number;
}

interface MonthlyData {
  month: string;
  patients: number;
  reminders: number;
}

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalReminders, setTotalReminders] = useState(0);
  const [reminderStats, setReminderStats] = useState<ReminderStats>({ sent: 0, pending: 0, failed: 0 });
  const [followUpStats, setFollowUpStats] = useState<FollowUpStats>({ completed: 0, pending: 0 });
  const [medicationCategories, setMedicationCategories] = useState<MedicationCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Get patient IDs for this pharmacist
      const { data: patients } = await supabase
        .from("patients")
        .select("id, created_at")
        .eq("pharmacist_id", user.id);

      const patientIds = patients?.map(p => p.id) || [];
      setTotalPatients(patientIds.length);

      // Fetch reminders stats
      if (patientIds.length > 0) {
        const { data: reminders } = await supabase
          .from("reminders")
          .select("status")
          .in("patient_id", patientIds);

        if (reminders) {
          setTotalReminders(reminders.length);
          setReminderStats({
            sent: reminders.filter(r => r.status === 'sent').length,
            pending: reminders.filter(r => r.status === 'pending').length,
            failed: reminders.filter(r => r.status === 'failed').length,
          });
        }
      }

      // Fetch follow-up stats
      const { data: followUps } = await supabase
        .from("follow_ups")
        .select("status")
        .eq("pharmacist_id", user.id);

      if (followUps) {
        setFollowUpStats({
          completed: followUps.filter(f => f.status === 'completed').length,
          pending: followUps.filter(f => f.status === 'pending').length,
        });
      }

      // Fetch medication categories
      if (patientIds.length > 0) {
        const { data: patientMeds } = await supabase
          .from("patient_medications")
          .select("medication_id, medications(category)")
          .in("patient_id", patientIds);

        if (patientMeds) {
          const categoryMap: Record<string, number> = {};
          patientMeds.forEach((pm: any) => {
            const cat = pm.medications?.category || "Other";
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
          });
          
          setMedicationCategories(
            Object.entries(categoryMap).map(([category, count]) => ({
              category,
              count,
            }))
          );
        }
      }

      // Generate monthly data from patients
      if (patients && patients.length > 0) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthCounts: Record<string, { patients: number; reminders: number }> = {};
        
        // Initialize last 6 months
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          monthCounts[key] = { patients: 0, reminders: 0 };
        }

        // Count patients by month
        patients.forEach(p => {
          const d = new Date(p.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (monthCounts[key] !== undefined) {
            monthCounts[key].patients++;
          }
        });

        setMonthlyData(
          Object.entries(monthCounts).map(([key, val]) => {
            const [year, month] = key.split("-").map(Number);
            return {
              month: monthNames[month],
              patients: val.patients,
              reminders: val.reminders,
            };
          })
        );
      }

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const adherenceRate = totalReminders > 0 
    ? Math.round((reminderStats.sent / totalReminders) * 100) 
    : 0;

  const followUpCompletionRate = (followUpStats.completed + followUpStats.pending) > 0
    ? Math.round((followUpStats.completed / (followUpStats.completed + followUpStats.pending)) * 100)
    : 0;

  const reminderData = [
    { name: "Sent", value: reminderStats.sent, color: "hsl(var(--success))" },
    { name: "Pending", value: reminderStats.pending, color: "hsl(var(--primary))" },
    { name: "Failed", value: reminderStats.failed, color: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0);

  const stats = [
    {
      title: "Total Patients",
      value: totalPatients.toString(),
      icon: UsersIcon,
    },
    {
      title: "Adherence Rate",
      value: `${adherenceRate}%`,
      icon: TrendingUpIcon,
    },
    {
      title: "Reminders Sent",
      value: reminderStats.sent.toString(),
      icon: BellIcon,
    },
    {
      title: "Follow-ups Done",
      value: followUpStats.completed.toString(),
      icon: CalendarIcon,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <div className="flex items-center gap-2">
                  <PillIcon className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">PharmaCare</span>
                </div>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            </div>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.title}</div>
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Patient Registrations by Month
                </h3>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="patients"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="New Patients"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available yet
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Medication Categories
                </h3>
                {medicationCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={medicationCategories}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--primary))"
                        name="Prescriptions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No medications recorded yet
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Adherence Tab */}
          <TabsContent value="adherence" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                    <ActivityIcon className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{adherenceRate}%</div>
                    <div className="text-sm text-muted-foreground">
                      Delivery Rate
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUpIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{reminderStats.sent}</div>
                    <div className="text-sm text-muted-foreground">
                      Reminders Delivered
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{totalPatients}</div>
                    <div className="text-sm text-muted-foreground">
                      Active Patients
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Reminder Delivery Status
                </h3>
                {reminderData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reminderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reminderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No reminders created yet
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">
                  Reminder Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Created</span>
                    <span className="text-2xl font-bold">{totalReminders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sent Successfully</span>
                    <span className="text-2xl font-bold text-success">{reminderStats.sent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-xl font-semibold">{reminderStats.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="text-xl font-semibold text-destructive">{reminderStats.failed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Delivery Rate</span>
                    <span className="text-xl font-semibold text-success">{adherenceRate}%</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Follow-ups Tab */}
          <TabsContent value="followups" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Completed
                </div>
                <div className="text-3xl font-bold text-success">{followUpStats.completed}</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Pending</div>
                <div className="text-3xl font-bold text-warning">{followUpStats.pending}</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Completion Rate
                </div>
                <div className="text-3xl font-bold">{followUpCompletionRate}%</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Total
                </div>
                <div className="text-3xl font-bold">{followUpStats.completed + followUpStats.pending}</div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Follow-up Summary
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-success h-full transition-all duration-500"
                      style={{ width: `${followUpCompletionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12">{followUpCompletionRate}%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {followUpStats.completed} out of {followUpStats.completed + followUpStats.pending} follow-ups completed
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
