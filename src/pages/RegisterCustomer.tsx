import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { PillIcon, ArrowLeftIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const RegisterCustomer = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    medication: "",
    duration: "",
    quantity: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Patient Registered Successfully",
      description: `${formData.name} has been added. Reminders will be sent automatically.`,
    });
    // Reset form
    setFormData({
      name: "",
      phone: "",
      age: "",
      medication: "",
      duration: "",
      quantity: "",
    });
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
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Register New Patient</h1>
            <p className="text-muted-foreground text-lg">
              Add patient details and medication to start automated follow-ups
            </p>
          </div>

          {/* Registration Form */}
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Information Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </span>
                  Patient Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter patient name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="0XX XXX XXXX"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age (Optional)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    placeholder="Enter age"
                    className="max-w-xs"
                  />
                </div>
              </div>

              {/* Medication Information Section */}
              <div className="space-y-4 pt-6 border-t border-border">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </span>
                  Medication Details
                </h2>

                <div className="space-y-2">
                  <Label htmlFor="medication">Medication Prescribed *</Label>
                  <Select
                    value={formData.medication}
                    onValueChange={(value) =>
                      setFormData({ ...formData, medication: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artesunate">
                        Artesunate-Lumefantrine (Malaria)
                      </SelectItem>
                      <SelectItem value="amoxicillin">
                        Amoxicillin (Antibiotic)
                      </SelectItem>
                      <SelectItem value="amlodipine">
                        Amlodipine (Hypertension)
                      </SelectItem>
                      <SelectItem value="metformin">
                        Metformin (Diabetes)
                      </SelectItem>
                      <SelectItem value="paracetamol">
                        Paracetamol (Pain Relief)
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Treatment Duration *</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(value) =>
                        setFormData({ ...formData, duration: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="5">5 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days (Chronic)</SelectItem>
                        <SelectItem value="90">90 days (Chronic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity/Dosage *</Label>
                    <Input
                      id="quantity"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      placeholder="e.g., 2 tablets 3x daily"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reminder Preview */}
              {formData.medication && formData.duration && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        Automated Schedule Preview
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Daily medication reminders will be sent</li>
                        <li>
                          ✓ Follow-up scheduled for day {formData.duration}
                        </li>
                        <li>✓ Adherence tracking enabled</li>
                        {parseInt(formData.duration) >= 30 && (
                          <li>✓ Refill reminder will be sent</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" size="lg" className="flex-1">
                  Register Patient
                </Button>
                <Link to="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>

          {/* Help Card */}
          <Card className="p-6 mt-6 bg-muted/50">
            <h3 className="font-semibold mb-2">Quick Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• The system will automatically schedule reminders based on the medication</li>
              <li>• Follow-up dates are calculated from treatment duration</li>
              <li>• You'll receive alerts when it's time to contact the patient</li>
              <li>• SMS reminders are sent automatically to the patient's phone</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterCustomer;
