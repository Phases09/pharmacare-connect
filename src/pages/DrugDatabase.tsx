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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Medication {
  id: string;
  name: string;
  category: string | null;
  treatment_duration_days: number;
  dosage_frequency_hours: number | null;
  follow_up_day: number;
  reminder_frequency: string;
  is_chronic: boolean | null;
}

const DrugDatabase = () => {
  const { toast } = useToast();
  const [isAddDrugOpen, setIsAddDrugOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  
  // Form state
  const [drugName, setDrugName] = useState("");
  const [category, setCategory] = useState("");
  const [treatmentDuration, setTreatmentDuration] = useState("");
  const [dosageFrequency, setDosageFrequency] = useState("");
  const [followUpDay, setFollowUpDay] = useState("");

  // Fetch medications from database
  const fetchMedications = async () => {
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Error fetching medications:", error);
      return;
    }
    
    setMedications(data || []);
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleSaveDrug = async () => {
    if (!drugName.trim()) {
      toast({
        title: "Error",
        description: "Drug name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const durationDays = parseInt(treatmentDuration) || 7;
    const frequencyHours = parseInt(dosageFrequency) || 8;
    const followUp = parseInt(followUpDay) || Math.ceil(durationDays / 2);

    const { error } = await supabase.from("medications").insert({
      name: drugName.trim(),
      category: category.trim() || null,
      treatment_duration_days: durationDays,
      dosage_frequency_hours: frequencyHours,
      follow_up_day: followUp,
      reminder_frequency: `Every ${frequencyHours} hours`,
      is_chronic: durationDays >= 30,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save drug: " + error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Drug added successfully",
    });

    // Reset form and close dialog
    setDrugName("");
    setCategory("");
    setTreatmentDuration("");
    setDosageFrequency("");
    setFollowUpDay("");
    setIsAddDrugOpen(false);
    
    // Refresh medications list
    fetchMedications();
  };

  const categories = [
    { name: "All Drugs", count: medications.length },
    { name: "Antibiotics", count: medications.filter(m => m.category?.toLowerCase() === "antibiotic").length },
    { name: "Chronic", count: medications.filter(m => m.is_chronic).length },
    { name: "Antimalarial", count: medications.filter(m => m.category?.toLowerCase() === "antimalarial").length },
    { name: "Analgesics", count: medications.filter(m => m.category?.toLowerCase() === "analgesic").length },
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
          <Dialog open={isAddDrugOpen} onOpenChange={setIsAddDrugOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add New Drug
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Drug</DialogTitle>
                <DialogDescription>
                  Add a new medication to the database with treatment protocols.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Drug Name</label>
                  <Input 
                    placeholder="Enter drug name" 
                    value={drugName}
                    onChange={(e) => setDrugName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input 
                    placeholder="e.g., Antibiotic, Antimalarial" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Treatment Duration (days)</label>
                  <Input 
                    placeholder="e.g., 7, 30" 
                    type="number"
                    value={treatmentDuration}
                    onChange={(e) => setTreatmentDuration(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Dosage Frequency (hours)</label>
                  <Input 
                    placeholder="e.g., 8, 12, 24" 
                    type="number"
                    value={dosageFrequency}
                    onChange={(e) => setDosageFrequency(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Follow-up Day</label>
                  <Input 
                    placeholder="e.g., 3, 7" 
                    type="number"
                    value={followUpDay}
                    onChange={(e) => setFollowUpDay(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleSaveDrug} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Drug"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  <span className="font-semibold">{medications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chronic Meds</span>
                  <span className="font-semibold">{medications.filter(m => m.is_chronic).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-semibold">{new Set(medications.map(m => m.category).filter(Boolean)).size}</span>
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
                  {medications.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">
                        {med.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{med.category || "Uncategorized"}</Badge>
                      </TableCell>
                      <TableCell>{med.is_chronic ? "Chronic" : `${med.treatment_duration_days} days`}</TableCell>
                      <TableCell className="text-muted-foreground">
                        Every {med.dosage_frequency_hours || 8} hours
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Day {med.follow_up_day}
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
