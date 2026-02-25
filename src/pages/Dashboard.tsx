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
import { useEffect, useState, useCallback } from "react";
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
  const [generatingMsg, setGeneratingMsg] = useState<string | null>(null);

  const openWhatsAppWithAI = useCallback(async (phone: string, patientName: string, medicationName: string, dueDate: string) => {
    const formattedPhone = phone.replace(/\s+/g, "").replace(/^0/, "233").replace("+", "");
    setGeneratingMsg(patientName);
    try {
      const { data, error } = await supabase.functions.invoke("generate-whatsapp-reminder", {
        body: { patientName, medicationName, dueDate },
      });
      if (error) throw error;
      const message = encodeURIComponent(data.message || "");
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
    } catch (e) {
      console.error("Failed to generate message:", e);
      toast.error("Could not generate message, opening WhatsApp without it");
      window.open(`https://wa.me/${formattedPhone}`, "_blank");
    } finally {
      setGeneratingMsg(null);
    }
  }, []);

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

  const statItems = [
    { label: "Total Patients", value: stats.totalPatients, icon: UsersIcon, iconBg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Active Reminders", value: stats.activeReminders, icon: BellIcon, iconBg: "bg-accent/10", iconColor: "text-accent" },
    { label: "Follow-Ups Due", value: stats.followUpsDue, icon: CalendarIcon, iconBg: "bg-warning/10", iconColor: "text-warning" },
    { label: "Adherence Rate", value: `${stats.adherenceRate}%`, icon: TrendingUpIcon, iconBg: "bg-success/10", iconColor: "text-success" },
  ];

  const headerActions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPatientListOpen(true)}
        className="gap-2 border-border/60"
      >
        <UsersIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Patient Records</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPatients}
        disabled={exporting}
        className="hidden sm:inline-flex gap-2 border-border/60"
      >
        <DownloadIcon className="h-4 w-4" />
        {exporting ? "Exporting..." : "Export"}
      </Button>
      <Link to="/register">
        <Button size="sm" className="gap-2 shadow-sm">
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
          <h1 className="text-2xl font-bold tracking-tight mb-1">Welcome back 👋</h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with your patients today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statItems.map((stat, i) => (
            <Card key={i} className="p-5 border-border/60 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Follow-Ups */}
          <Card className="lg:col-span-2 border-border/60">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                </div>
                Upcoming Follow-Ups
              </h2>
              <Link to="/follow-ups">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">View All</Button>
              </Link>
            </div>

            <div className="p-6 pt-4">
              {upcomingFollowUps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No upcoming follow-ups scheduled
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingFollowUps.map((followUp) => (
                    <div
                      key={followUp.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center text-sm font-semibold text-primary">
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
                          className="text-[10px] font-medium"
                        >
                          {getFollowUpDueDate(followUp.scheduled_date)}
                        </Badge>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-border/50"
                            disabled={generatingMsg === followUp.patient.full_name}
                            onClick={() => openWhatsAppWithAI(
                              followUp.patient.phone,
                              followUp.patient.full_name,
                              followUp.patient_medication.medication.name,
                              getFollowUpDueDate(followUp.scheduled_date)
                            )}
                          >
                            <MessageCircleIcon className="h-3.5 w-3.5 mr-1" />
                            {generatingMsg === followUp.patient.full_name ? "Generating..." : "WhatsApp"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-border/50"
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
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/60">
            <div className="p-6 pb-0">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ActivityIcon className="h-4 w-4 text-primary" />
                </div>
                Recent Activity
              </h2>
            </div>

            <div className="p-6 pt-4">
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
                        <div className="h-8 w-8 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-tight">
                            {getActivityLabel(activity.reminder_type)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {activity.patient.full_name}
                          </div>
                          <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                            {getActivityTime(activity.created_at)}
                          </div>
                        </div>
                        {activity.patient.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs flex-shrink-0 border-border/50"
                            disabled={generatingMsg === activity.patient.full_name}
                            onClick={() => openWhatsAppWithAI(
                              activity.patient.phone,
                              activity.patient.full_name,
                              activity.reminder_type,
                              "today"
                            )}
                          >
                            <MessageCircleIcon className="h-3.5 w-3.5 mr-1" />
                            {generatingMsg === activity.patient.full_name ? "..." : "WhatsApp"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { label: "New Patient", desc: "Register & prescribe", path: "/register", icon: PlusIcon, iconBg: "bg-primary/10", iconColor: "text-primary" },
            { label: "Add Medications", desc: "Existing patients", path: "/add-medications", icon: PillIcon, iconBg: "bg-warning/10", iconColor: "text-warning" },
            { label: "Follow-Ups", desc: "View scheduled", path: "/follow-ups", icon: CalendarIcon, iconBg: "bg-accent/10", iconColor: "text-accent" },
            { label: "Analytics", desc: "Performance metrics", path: "/analytics", icon: BarChart3Icon, iconBg: "bg-success/10", iconColor: "text-success" },
          ].map((action, i) => (
            <Link key={i} to={action.path}>
              <Card className="p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group h-full border-border/60">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${action.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <action.icon className={`h-5 w-5 ${action.iconColor}`} />
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
