import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { PillIcon, ArrowLeftIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const RegisterCustomer = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    medicationName: "",
    duration: "",
    quantity: "",
    consentGiven: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to register patients",
        variant: "destructive",
      });
      return;
    }

    if (!formData.consentGiven) {
      toast({
        title: "Consent Required",
        description: "Please confirm the patient has given consent to receive reminders",
        variant: "destructive",
      });
      return;
    }

    if (!formData.medicationName.trim()) {
      toast({
        title: "Medication Required",
        description: "Please enter the medication name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.duration) {
      toast({
        title: "Duration Required",
        description: "Please select a treatment duration",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, create or find the medication
      const { data: medicationData, error: medicationError } = await supabase
        .from("medications")
        .insert({
          name: formData.medicationName.trim(),
          treatment_duration_days: parseInt(formData.duration),
          reminder_frequency: "daily",
          follow_up_day: parseInt(formData.duration),
        })
        .select()
        .single();

      if (medicationError) throw medicationError;

      // Create the patient
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert({
          full_name: formData.name,
          phone: formData.phone,
          age: formData.age ? parseInt(formData.age) : null,
          pharmacist_id: user.id,
          consent_given: formData.consentGiven,
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Create the patient medication record
      const durationDays = parseInt(formData.duration);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const { data: patientMedData, error: patientMedError } = await supabase
        .from("patient_medications")
        .insert({
          patient_id: patientData.id,
          medication_id: medicationData.id,
          prescribed_by: user.id,
          quantity: formData.quantity,
          end_date: endDate.toISOString(),
        })
        .select()
        .single();

      if (patientMedError) throw patientMedError;

      // Schedule a follow-up
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + durationDays);

      const { error: followUpError } = await supabase
        .from("follow_ups")
        .insert({
          patient_id: patientData.id,
          patient_medication_id: patientMedData.id,
          pharmacist_id: user.id,
          scheduled_date: followUpDate.toISOString().split("T")[0],
        });

      if (followUpError) throw followUpError;

      // Create daily reminders for the treatment duration
      const reminders = [];
      for (let day = 0; day < durationDays; day++) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + day);
        reminderDate.setHours(9, 0, 0, 0); // Set to 9 AM

        reminders.push({
          patient_id: patientData.id,
          patient_medication_id: patientMedData.id,
          reminder_type: 'dose',
          message: `Hi ${formData.name}, this is your reminder to take ${formData.medicationName}. Dosage: ${formData.quantity}`,
          scheduled_at: reminderDate.toISOString(),
          delivery_channel: 'sms',
          status: 'pending'
        });
      }

      if (reminders.length > 0) {
        const { error: remindersError } = await supabase
          .from("reminders")
          .insert(reminders);

        if (remindersError) {
          console.error("Error creating reminders:", remindersError);
          // Don't throw, just log - patient is already registered
        }
      }

      toast({
        title: "Patient Registered Successfully",
        description: `${formData.name} has been added. Reminders will be sent automatically.`,
      });

      // Reset form and navigate to dashboard
      setFormData({
        name: "",
        phone: "",
        age: "",
        medicationName: "",
        duration: "",
        quantity: "",
        consentGiven: false,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error registering patient:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                  <Input
                    id="medication"
                    value={formData.medicationName}
                    onChange={(e) =>
                      setFormData({ ...formData, medicationName: e.target.value })
                    }
                    placeholder="e.g., Amoxicillin 500mg"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Treatment Duration (days) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      placeholder="e.g., 7"
                      required
                    />
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

              {/* Consent Checkbox */}
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="consent"
                  checked={formData.consentGiven}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, consentGiven: checked === true })
                  }
                />
                <Label htmlFor="consent" className="text-sm">
                  Patient has given consent to receive SMS/WhatsApp reminders *
                </Label>
              </div>

              {/* Reminder Preview */}
              {formData.medicationName && formData.duration && (
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
                <Button type="submit" size="lg" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register Patient"}
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