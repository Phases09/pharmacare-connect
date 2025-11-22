import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  PillIcon,
  ArrowLeftIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DrugDatabase = () => {
  const drugs = [
    {
      name: "Artesunate-Lumefantrine",
      category: "Antimalarial",
      duration: "3 days",
      frequency: "2x daily",
      followUp: "Day 3",
      color: "primary",
    },
    {
      name: "Amoxicillin",
      category: "Antibiotic",
      duration: "5-7 days",
      frequency: "3x daily (8hrs)",
      followUp: "Day 2 & 5",
      color: "accent",
    },
    {
      name: "Amlodipine",
      category: "Antihypertensive",
      duration: "Chronic",
      frequency: "1x daily",
      followUp: "Every 30 days",
      color: "success",
    },
    {
      name: "Metformin",
      category: "Antidiabetic",
      duration: "Chronic",
      frequency: "2x daily",
      followUp: "Every 30 days",
      color: "success",
    },
    {
      name: "Paracetamol",
      category: "Analgesic",
      duration: "As needed",
      frequency: "PRN (max 4x daily)",
      followUp: "None",
      color: "warning",
    },
    {
      name: "Ciprofloxacin",
      category: "Antibiotic",
      duration: "7 days",
      frequency: "2x daily",
      followUp: "Day 4",
      color: "accent",
    },
  ];

  const categories = [
    { name: "All Drugs", count: drugs.length },
    { name: "Antibiotics", count: 2 },
    { name: "Chronic", count: 2 },
    { name: "Antimalarial", count: 1 },
    { name: "Analgesics", count: 1 },
  ];

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Drug Database</h1>
            <p className="text-muted-foreground text-lg">
              Manage medication rules and treatment protocols
            </p>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Drug
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <Button
                    key={index}
                    variant={index === 0 ? "secondary" : "ghost"}
                    className="w-full justify-between"
                  >
                    <span>{category.name}</span>
                    <Badge variant="secondary">{category.count}</Badge>
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <h3 className="font-semibold mb-2 text-sm">Database Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Drugs</span>
                  <span className="font-semibold">{drugs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chronic Meds</span>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-semibold">5</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Bar */}
            <Card className="p-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medications..."
                  className="pl-10"
                />
              </div>
            </Card>

            {/* Drugs Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Follow-Up</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drugs.map((drug, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {drug.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{drug.category}</Badge>
                      </TableCell>
                      <TableCell>{drug.duration}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {drug.frequency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`bg-${drug.color}/10 text-${drug.color}`}
                        >
                          {drug.followUp}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <EditIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Example Drug Detail Card */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Example: Artesunate-Lumefantrine Protocol
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-lg">
                    Treatment Details
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Category:</dt>
                      <dd className="font-medium">Antimalarial</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Duration:</dt>
                      <dd className="font-medium">3 days</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Dosage:</dt>
                      <dd className="font-medium">2x daily (12 hours apart)</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total Doses:</dt>
                      <dd className="font-medium">6 doses</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-lg">
                    Reminder Schedule
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Reminder 2 hours before each dose</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Missed dose alert after 3 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Follow-up alert on Day 3</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Treatment completion notification</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrugDatabase;
