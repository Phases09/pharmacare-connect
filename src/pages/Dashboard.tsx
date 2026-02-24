import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  BellIcon,
  CalendarIcon,
  PillIcon,
  UsersIcon,
  TrendingUpIcon,
  PhoneIcon,
  PlusIcon,
  BarChart3Icon,
  DownloadIcon,
  ActivityIcon,
  MessageCircleIcon,
} from "lucide-react";
import { exportPatientsToExcel } from "@/lib/exportToExcel";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import PatientListDialog from "@/components/PatientListDialog";

interface FollowUp {
  id: string;
  scheduled_date: string;
  status: string;
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

interface Reminder {
  id: string;
  reminder_type: string;
  created_at: string;
  patient: {
    full_name: string;
    phone: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeReminders: 0,
    followUpsDue: 0,
    adherenceRate: 0,
  });
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [recentActivity, setRecentActivity] = useState<Reminder[]>([]);
  const [exporting, setExporting] = useState(false);
  const [patientListOpen, setPatientListOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { count: patientsCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("pharmacist_id", user.id);

      const { data: patientData } = await supabase
        .from("patients")
        .select("id")
        .eq("pharmacist_id", user.id);

      const patientIds = patientData?.map((p) => p.id) || [];

      let remindersCount = 0;
      let totalRemindersCount = 0;
      let sentRemindersCount = 0;

      if (patientIds.length > 0) {
        const { count } = await supabase
          .from("reminders")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .in("patient_id", patientIds);
        remindersCount = count || 0;

        const { data: allReminders } = await supabase
          .from("reminders")
          .select("status")
          .in("patient_id", patientIds);
        if (allReminders) {
          totalRemindersCount = allReminders.length;
          sentRemindersCount = allReminders.filter(r => r.status === "sent").length;
        }
      }

      const today = new Date().toISOString().split("T")[0];
      const { count: followUpsCount } = await supabase
        .from("follow_ups")
        .select("*", { count: "exact", head: true })
        .eq("pharmacist_id", user.id)
        .eq("status", "pending")
        .lte("scheduled_date", today);

      const { data: followUpsData } = await supabase
        .from("follow_ups")
        .select(`
          id, scheduled_date, status,
          patient:patients(full_name, phone),
          patient_medication:patient_medications(medication:medications(name))
        `)
        .eq("pharmacist_id", user.id)
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true })
        .limit(4);

      const { data: remindersData } = await supabase
        .from("reminders")
        .select(`id, reminder_type, created_at, patient:patients(full_name, phone)`)
        .in("patient_id", patientIds.length > 0 ? patientIds : [""])
        .order("created_at", { ascending: false })
        .limit(4);

      const adherenceRate = totalRemindersCount > 0
        ? Math.round((sentRemindersCount / totalRemindersCount) * 100)
        : 0;

      setStats({
        totalPatients: patientsCount || 0,
        activeReminders: remindersCount,
        followUpsDue: followUpsCount || 0,
        adherenceRate,
      });
      setUpcomingFollowUps(followUpsData || []);
      setRecentActivity(remindersData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPatients = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: patients, error } = await supabase
        .from("patients")
        .select("id, full_name, phone, age, consent_given, created_at")
        .eq("pharmacist_id", user.id)
        .order("full_name", { ascending: true });
      if (error) throw error;
      if (!patients || patients.length === 0) {
        toast.error("No patients to export");
        return;
      }
      exportPatientsToExcel(patients, "pharmacare-patients");
      toast.success(`Exported ${patients.length} patients to Excel`);
    } catch (error) {
      console.error("Error exporting patients:", error);
      toast.error("Failed to export patients");
    } finally {
      setExporting(false);
    }
  };

  const getFollowUpDueDate = (scheduledDate: string) => {
    const date = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Overdue";
    return `${diffDays} days`;
  };

  const getActivityTime = (createdAt: string) => {
    const diffMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "dose": return BellIcon;
      case "adherence": return CalendarIcon;
      case "refill": return PillIcon;
      default: return ActivityIcon;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "dose": return "Dose reminder sent";
      case "adherence": return "Adherence check";
      case "refill": return "Refill reminder";
      default: return "Reminder sent";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const headerActions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPatientListOpen(true)}
        className="gap-2"
      >
        <UsersIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Patient Records</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPatients}
        disabled={exporting}
        className="hidden sm:inline-flex gap-2"
      >
        <DownloadIcon className="h-4 w-4" />
        {exporting ? "Exporting..." : "Export"}
      </Button>
      <Link to="/register">
        <Button size="sm" className="gap-2">
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">New Patient</span>
        </Button>
      </Link>
    </>
  );

  return (
    <DashboardLayout actions={headerActions}>
      <div className="container mx-auto px-4 lg:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back 👋</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your patients today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Patients", value: stats.totalPatients, icon: UsersIcon, color: "primary" },
            { label: "Active Reminders", value: stats.activeReminders, icon: BellIcon, color: "accent" },
            { label: "Follow-Ups Due", value: stats.followUpsDue, icon: CalendarIcon, color: "warning" },
            { label: "Adherence Rate", value: `${stats.adherenceRate}%`, icon: TrendingUpIcon, color: "success" },
          ].map((stat, i) => (
            <Card key={i} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                </div>
                <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
                  {stat.label.split(" ")[0]}
                </Badge>
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Follow-Ups */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Upcoming Follow-Ups
              </h2>
              <Link to="/follow-ups">
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </Link>
            </div>

            {upcomingFollowUps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No upcoming follow-ups scheduled
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingFollowUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {followUp.patient.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{followUp.patient.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {followUp.patient_medication.medication.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          getFollowUpDueDate(followUp.scheduled_date) === "Today" ||
                          getFollowUpDueDate(followUp.scheduled_date) === "Overdue"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {getFollowUpDueDate(followUp.scheduled_date)}
                      </Badge>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            const phone = followUp.patient.phone.replace(/\s+/g, "").replace(/^0/, "233").replace("+", "");
                            window.open(`https://wa.me/${phone}`, "_blank");
                          }}
                        >
                          <MessageCircleIcon className="h-3.5 w-3.5 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => window.open(`tel:${followUp.patient.phone}`, "_self")}
                        >
                          <PhoneIcon className="h-3.5 w-3.5 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-5">
              <ActivityIcon className="h-5 w-5 text-primary" />
              Recent Activity
            </h2>

            {recentActivity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No recent activity
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.reminder_type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium leading-tight">
                          {getActivityLabel(activity.reminder_type)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {activity.patient.full_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                          {getActivityTime(activity.created_at)}
                        </div>
                      </div>
                      {activity.patient.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs flex-shrink-0"
                          onClick={() => {
                            const phone = activity.patient.phone.replace(/\s+/g, "").replace(/^0/, "233").replace("+", "");
                            window.open(`https://wa.me/${phone}`, "_blank");
                          }}
                        >
                          <MessageCircleIcon className="h-3.5 w-3.5 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { label: "New Patient", desc: "Register & prescribe", path: "/register", icon: PlusIcon, color: "primary" },
            { label: "Add Medications", desc: "Existing patients", path: "/add-medications", icon: PillIcon, color: "warning" },
            { label: "Follow-Ups", desc: "View scheduled", path: "/follow-ups", icon: CalendarIcon, color: "accent" },
            { label: "Analytics", desc: "Performance metrics", path: "/analytics", icon: BarChart3Icon, color: "success" },
          ].map((action, i) => (
            <Link key={i} to={action.path}>
              <Card className="p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group h-full">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-${action.color}/10 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <action.icon className={`h-5 w-5 text-${action.color}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <PatientListDialog open={patientListOpen} onOpenChange={setPatientListOpen} />
    </DashboardLayout>
  );
};

export default Dashboard;
