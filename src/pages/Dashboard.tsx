import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  ActivityIcon,
  BellIcon,
  CalendarIcon,
  PillIcon,
  UsersIcon,
  TrendingUpIcon,
  PhoneIcon,
  PlusIcon,
  DatabaseIcon,
  BarChart3Icon,
  LogOutIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  };
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeReminders: 0,
    followUpsDue: 0,
    adherenceRate: 0,
  });
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [recentActivity, setRecentActivity] = useState<Reminder[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Fetch total patients
      const { count: patientsCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("pharmacist_id", user!.id);

      // Fetch patient IDs for this pharmacist
      const { data: patientData } = await supabase
        .from("patients")
        .select("id")
        .eq("pharmacist_id", user!.id);

      const patientIds = patientData?.map((p) => p.id) || [];

      // Fetch active reminders
      const { count: remindersCount } = await supabase
        .from("reminders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .in("patient_id", patientIds.length > 0 ? patientIds : [""]);

      // Fetch follow-ups due today
      const today = new Date().toISOString().split("T")[0];
      const { count: followUpsCount } = await supabase
        .from("follow_ups")
        .select("*", { count: "exact", head: true })
        .eq("pharmacist_id", user!.id)
        .eq("status", "pending")
        .lte("scheduled_date", today);

      // Fetch upcoming follow-ups with patient and medication details
      const { data: followUpsData } = await supabase
        .from("follow_ups")
        .select(`
          id,
          scheduled_date,
          status,
          patient:patients(full_name, phone),
          patient_medication:patient_medications(
            medication:medications(name)
          )
        `)
        .eq("pharmacist_id", user!.id)
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true })
        .limit(4);

      // Fetch recent reminders for activity feed
      const { data: remindersData } = await supabase
        .from("reminders")
        .select(`
          id,
          reminder_type,
          created_at,
          patient:patients(full_name)
        `)
        .in("patient_id", patientIds.length > 0 ? patientIds : [""])
        .order("created_at", { ascending: false })
        .limit(4);

      setStats({
        totalPatients: patientsCount || 0,
        activeReminders: remindersCount || 0,
        followUpsDue: followUpsCount || 0,
        adherenceRate: 94, // This would need a more complex calculation
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getFollowUpDueDate = (scheduledDate: string) => {
    const date = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Overdue";
    return `${diffDays} days`;
  };

  const getActivityTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "dose":
        return BellIcon;
      case "adherence":
        return CalendarIcon;
      case "refill":
        return PillIcon;
      default:
        return ActivityIcon;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "dose":
        return "Dose reminder sent";
      case "adherence":
        return "Adherence check sent";
      case "refill":
        return "Refill reminder sent";
      default:
        return "Reminder sent";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <PillIcon className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  PharmaCare
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-1 ml-8">
                <Button variant="ghost" className="text-primary bg-primary/10">
                  Dashboard
                </Button>
                <Link to="/register">
                  <Button variant="ghost">Register Patient</Button>
                </Link>
                <Link to="/drug-database">
                  <Button variant="ghost">Drug Database</Button>
                </Link>
                <Link to="/follow-ups">
                  <Button variant="ghost">Follow-Ups</Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/register">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Patient
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOutIcon className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your patients today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Total
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalPatients}</div>
            <div className="text-sm text-muted-foreground">Total Patients</div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <BellIcon className="h-6 w-6 text-accent" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.activeReminders}</div>
            <div className="text-sm text-muted-foreground">Active Reminders</div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-warning" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Today
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.followUpsDue}</div>
            <div className="text-sm text-muted-foreground">Follow-Ups Due</div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUpIcon className="h-6 w-6 text-success" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Rate
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.adherenceRate}%</div>
            <div className="text-sm text-muted-foreground">Adherence Rate</div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Follow-Ups Card */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold">Upcoming Follow-Ups</h2>
              </div>
              <Link to="/follow-ups">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {upcomingFollowUps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming follow-ups scheduled
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingFollowUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                        <UsersIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{followUp.patient.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {followUp.patient_medication.medication.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getFollowUpDueDate(followUp.scheduled_date) === "Today" || getFollowUpDueDate(followUp.scheduled_date) === "Overdue" ? "destructive" : "secondary"}>
                        {getFollowUpDueDate(followUp.scheduled_date)}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Activity Card */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <ActivityIcon className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Recent Activity</h2>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const ActivityIconComponent = getActivityIcon(activity.reminder_type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <ActivityIconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {getActivityLabel(activity.reminder_type)}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {activity.patient.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {getActivityTime(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Link to="/register">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-lg">Register Patient</div>
                  <div className="text-sm text-muted-foreground">
                    Add new patient & medication
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/drug-database">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DatabaseIcon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-lg">Drug Database</div>
                  <div className="text-sm text-muted-foreground">
                    Manage drug information
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3Icon className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="font-semibold text-lg">View Analytics</div>
                <div className="text-sm text-muted-foreground">
                  Track performance metrics
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
