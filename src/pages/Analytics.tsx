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

const Analytics = () => {
  // Sample data - will be replaced with real data from database
  const adherenceData = [
    { month: "Jan", rate: 85 },
    { month: "Feb", rate: 87 },
    { month: "Mar", rate: 90 },
    { month: "Apr", rate: 88 },
    { month: "May", rate: 92 },
    { month: "Jun", rate: 95 },
  ];

  const reminderData = [
    { name: "Sent", value: 420, color: "hsl(var(--primary))" },
    { name: "Delivered", value: 398, color: "hsl(var(--success))" },
    { name: "Failed", value: 22, color: "hsl(var(--destructive))" },
  ];

  const followUpData = [
    { week: "Week 1", completed: 45, pending: 12 },
    { week: "Week 2", completed: 52, pending: 8 },
    { week: "Week 3", completed: 48, pending: 15 },
    { week: "Week 4", completed: 60, pending: 5 },
  ];

  const medicationCategories = [
    { category: "Antimalarial", count: 145 },
    { category: "Antibiotic", count: 230 },
    { category: "Chronic", count: 180 },
    { category: "Pain Relief", count: 95 },
    { category: "Other", count: 120 },
  ];

  const stats = [
    {
      title: "Total Patients",
      value: "847",
      change: "+12%",
      icon: UsersIcon,
      trend: "up",
    },
    {
      title: "Adherence Rate",
      value: "95%",
      change: "+3%",
      icon: TrendingUpIcon,
      trend: "up",
    },
    {
      title: "Reminders Sent",
      value: "1,420",
      change: "+18%",
      icon: BellIcon,
      trend: "up",
    },
    {
      title: "Follow-ups",
      value: "205",
      change: "-5%",
      icon: CalendarIcon,
      trend: "down",
    },
  ];

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
                <span
                  className={`text-sm font-medium ${
                    stat.trend === "up" ? "text-success" : "text-destructive"
                  }`}
                >
                  {stat.change}
                </span>
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
                  Patient Adherence Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={adherenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Adherence Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Medication Categories
                </h3>
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
                      name="Patients"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Adherence Tab */}
          <TabsContent value="adherence" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Monthly Adherence Performance
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={adherenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    name="Adherence Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                    <ActivityIcon className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">95%</div>
                    <div className="text-sm text-muted-foreground">
                      Current Rate
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
                    <div className="text-2xl font-bold">+8%</div>
                    <div className="text-sm text-muted-foreground">
                      Improvement
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
                    <div className="text-2xl font-bold">805</div>
                    <div className="text-sm text-muted-foreground">
                      Adherent Patients
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
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">
                  Reminder Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Sent</span>
                    <span className="text-2xl font-bold">1,420</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Delivery Rate</span>
                    <span className="text-2xl font-bold text-success">94.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">SMS</span>
                    <span className="text-xl font-semibold">820</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <span className="text-xl font-semibold">600</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="text-xl font-semibold text-destructive">22</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Follow-ups Tab */}
          <TabsContent value="followups" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Follow-up Performance
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={followUpData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--success))"
                    name="Completed"
                  />
                  <Bar
                    dataKey="pending"
                    fill="hsl(var(--warning))"
                    name="Pending"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Completed
                </div>
                <div className="text-3xl font-bold text-success">205</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Pending</div>
                <div className="text-3xl font-bold text-warning">40</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Completion Rate
                </div>
                <div className="text-3xl font-bold">83.7%</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Avg Response Time
                </div>
                <div className="text-3xl font-bold">2.4d</div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
