import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  PillIcon,
  ArrowLeftIcon,
  PhoneIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  MessageSquareIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FollowUps = () => {
  const followUps = {
    urgent: [
      {
        name: "Sarah Mensah",
        phone: "024 123 4567",
        medication: "Artesunate-Lumefantrine",
        type: "Malaria Treatment Check",
        dueDate: "Today",
        daysSince: "3 days",
        adherence: "95%",
      },
      {
        name: "John Asante",
        phone: "055 987 6543",
        medication: "Amlodipine",
        type: "Refill Due",
        dueDate: "Today",
        daysSince: "30 days",
        adherence: "88%",
      },
    ],
    upcoming: [
      {
        name: "Grace Osei",
        phone: "027 456 7890",
        medication: "Amoxicillin",
        type: "Treatment Check",
        dueDate: "Tomorrow",
        daysSince: "4 days",
        adherence: "92%",
      },
      {
        name: "Kwame Boateng",
        phone: "020 111 2233",
        medication: "Metformin",
        type: "Chronic Follow-up",
        dueDate: "In 2 days",
        daysSince: "28 days",
        adherence: "90%",
      },
      {
        name: "Ama Darko",
        phone: "054 333 4455",
        medication: "Ciprofloxacin",
        type: "Treatment Check",
        dueDate: "In 3 days",
        daysSince: "4 days",
        adherence: "100%",
      },
    ],
    completed: [
      {
        name: "Michael Adjei",
        phone: "024 555 6677",
        medication: "Amoxicillin",
        type: "Treatment Check",
        completedDate: "2 hours ago",
        outcome: "Improving",
        notes: "Patient reports significant improvement. Advised to complete course.",
      },
      {
        name: "Abena Kusi",
        phone: "050 777 8899",
        medication: "Metformin",
        type: "Chronic Follow-up",
        completedDate: "1 day ago",
        outcome: "Refill Needed",
        notes: "Patient needs refill. Blood sugar levels stable.",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <PillIcon className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                PharmaCare
              </span>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Patient Follow-Ups</h1>
          <p className="text-muted-foreground text-lg">
            Track and manage patient follow-up calls and outcomes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-destructive/20 bg-destructive/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Urgent</span>
              <ClockIcon className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-3xl font-bold text-destructive">
              {followUps.urgent.length}
            </div>
          </Card>

          <Card className="p-4 border-warning/20 bg-warning/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Upcoming</span>
              <ClockIcon className="h-4 w-4 text-warning" />
            </div>
            <div className="text-3xl font-bold text-warning">
              {followUps.upcoming.length}
            </div>
          </Card>

          <Card className="p-4 border-success/20 bg-success/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Completed</span>
              <CheckCircle2Icon className="h-4 w-4 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">
              {followUps.completed.length}
            </div>
          </Card>

          <Card className="p-4 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">This Week</span>
              <CheckCircle2Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">
              {followUps.urgent.length + followUps.upcoming.length}
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="urgent" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="urgent">
              Urgent ({followUps.urgent.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({followUps.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({followUps.completed.length})
            </TabsTrigger>
          </TabsList>

          {/* Urgent Tab */}
          <TabsContent value="urgent" className="space-y-4">
            {followUps.urgent.map((patient, index) => (
              <Card key={index} className="p-6 border-destructive/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="destructive">DUE {patient.dueDate.toUpperCase()}</Badge>
                      <Badge variant="outline">{patient.type}</Badge>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{patient.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Medication:</span>{" "}
                        {patient.medication}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {patient.phone}
                      </p>
                      <p>
                        <span className="font-medium">Treatment Duration:</span>{" "}
                        {patient.daysSince}
                      </p>
                      <p>
                        <span className="font-medium">Adherence:</span>{" "}
                        <span className="text-success font-semibold">
                          {patient.adherence}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button className="w-full md:w-auto">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                    <Button variant="outline" className="w-full md:w-auto">
                      <MessageSquareIcon className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="space-y-4">
            {followUps.upcoming.map((patient, index) => (
              <Card key={index} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary">{patient.dueDate}</Badge>
                      <Badge variant="outline">{patient.type}</Badge>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{patient.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Medication:</span>{" "}
                        {patient.medication}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {patient.phone}
                      </p>
                      <p>
                        <span className="font-medium">Treatment Duration:</span>{" "}
                        {patient.daysSince}
                      </p>
                      <p>
                        <span className="font-medium">Adherence:</span>{" "}
                        <span className="text-success font-semibold">
                          {patient.adherence}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full md:w-auto">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      Schedule Call
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-4">
            {followUps.completed.map((patient, index) => (
              <Card key={index} className="p-6 bg-muted/30">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2Icon className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {patient.outcome}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {patient.completedDate}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{patient.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p>
                        <span className="font-medium">Medication:</span>{" "}
                        {patient.medication}
                      </p>
                      <p>
                        <span className="font-medium">Type:</span> {patient.type}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <p className="text-sm">
                        <span className="font-medium">Notes:</span> {patient.notes}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FollowUps;
