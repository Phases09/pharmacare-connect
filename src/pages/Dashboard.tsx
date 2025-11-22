import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ActivityIcon,
  BellIcon,
  CalendarIcon,
  PillIcon,
  UsersIcon,
  TrendingUpIcon,
  ClockIcon,
  PhoneIcon,
  PlusIcon,
  DatabaseIcon,
  BarChart3Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const stats = [
    {
      label: "Total Patients",
      value: "248",
      change: "+12%",
      icon: UsersIcon,
      color: "primary",
    },
    {
      label: "Active Reminders",
      value: "156",
      change: "+8%",
      icon: BellIcon,
      color: "accent",
    },
    {
      label: "Follow-Ups Due",
      value: "23",
      change: "Today",
      icon: CalendarIcon,
      color: "warning",
    },
    {
      label: "Adherence Rate",
      value: "94%",
      change: "+5%",
      icon: TrendingUpIcon,
      color: "success",
    },
  ];

  const upcomingFollowUps = [
    {
      name: "Sarah Mensah",
      medication: "Artesunate-Lumefantrine",
      dueDate: "Today",
      type: "Malaria Check",
      status: "urgent",
    },
    {
      name: "John Asante",
      medication: "Amlodipine",
      dueDate: "Today",
      type: "Refill Due",
      status: "urgent",
    },
    {
      name: "Grace Osei",
      medication: "Amoxicillin",
      dueDate: "Tomorrow",
      type: "Treatment Check",
      status: "pending",
    },
    {
      name: "Kwame Boateng",
      medication: "Metformin",
      dueDate: "2 days",
      type: "Chronic Follow-up",
      status: "pending",
    },
  ];

  const recentActivity = [
    {
      action: "Reminder sent",
      patient: "Sarah Mensah",
      time: "10 mins ago",
      icon: BellIcon,
    },
    {
      action: "New registration",
      patient: "Michael Adjei",
      time: "1 hour ago",
      icon: UsersIcon,
    },
    {
      action: "Follow-up completed",
      patient: "Grace Osei",
      time: "2 hours ago",
      icon: CalendarIcon,
    },
    {
      action: "Refill requested",
      patient: "John Asante",
      time: "3 hours ago",
      icon: PillIcon,
    },
  ];

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
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, Pharmacist! 👋</h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your patients today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`h-12 w-12 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}
                >
                  <stat.icon className={`h-6 w-6 text-${stat.color}`} />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stat.change}
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
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

            <div className="space-y-4">
              {upcomingFollowUps.map((followUp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        followUp.status === "urgent"
                          ? "bg-destructive/10"
                          : "bg-primary/10"
                      }`}
                    >
                      <UsersIcon
                        className={`h-5 w-5 ${
                          followUp.status === "urgent"
                            ? "text-destructive"
                            : "text-primary"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-semibold">{followUp.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {followUp.medication} • {followUp.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        followUp.status === "urgent" ? "destructive" : "secondary"
                      }
                    >
                      {followUp.dueDate}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity Card */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <ActivityIcon className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Recent Activity</h2>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{activity.action}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {activity.patient}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
