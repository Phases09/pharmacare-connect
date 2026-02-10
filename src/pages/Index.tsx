import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ActivityIcon, BellIcon, CalendarIcon, LineChartIcon,
  PillIcon, UsersIcon, CheckCircle2Icon, ClockIcon, TrendingUpIcon
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <PillIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">PharmaCare</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
        <div className="container mx-auto px-4 lg:px-6 py-20 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <ActivityIcon className="h-3.5 w-3.5" />
              Smart Pharmacy Management
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Never Miss a{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Patient Follow-Up
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Automated medication reminders, intelligent follow-ups, and data-driven insights to improve patient outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="text-base px-6 w-full sm:w-auto">Start Free Trial</Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base px-6 w-full sm:w-auto">Watch Demo</Button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2Icon className="h-4 w-4 text-success" />
                No credit card required
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2Icon className="h-4 w-4 text-success" />
                14-day free trial
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "95%", label: "Patient Adherence", icon: CheckCircle2Icon },
              { value: "3x", label: "Repeat Visits", icon: TrendingUpIcon },
              { value: "80%", label: "Time Saved", icon: ClockIcon },
              { value: "50K+", label: "Reminders Sent", icon: BellIcon },
            ].map((stat, i) => (
              <Card key={i} className="p-5 text-center hover:shadow-md transition-shadow">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Everything You Need to <span className="text-primary">Care for Patients</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Comprehensive tools designed to improve patient outcomes and pharmacy operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BellIcon, title: "Automated Reminders", description: "Timely SMS and WhatsApp medication reminders" },
              { icon: CalendarIcon, title: "Smart Follow-Ups", description: "Auto-scheduled follow-ups based on treatment" },
              { icon: PillIcon, title: "Drug Database", description: "Dosage rules and therapy guidelines" },
              { icon: LineChartIcon, title: "Analytics Dashboard", description: "Track adherence, revenue, and engagement", link: "/analytics" },
              { icon: UsersIcon, title: "Patient Management", description: "Quick registration and complete history" },
              { icon: ActivityIcon, title: "Refill Alerts", description: "Predict and remind for chronic medication refills" },
            ].map((feature, i) => {
              const content = (
                <Card key={i} className="p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
              return feature.link ? <Link key={i} to={feature.link}>{content}</Link> : content;
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Simple Setup, <span className="text-primary">Powerful Results</span>
            </h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-8">
            {[
              { step: "1", title: "Register Patient & Medication", description: "Quick entry of customer details and prescriptions" },
              { step: "2", title: "Auto-Schedule Reminders", description: "System creates reminders based on drug database" },
              { step: "3", title: "Track & Follow Up", description: "Receive alerts and track patient adherence" },
              { step: "4", title: "Analyze & Improve", description: "Use insights to improve care and operations" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground shadow-sm">
                  {item.step}
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold mb-0.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-primary/70" />
        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Pharmacy?
          </h2>
          <p className="text-lg text-primary-foreground/85 mb-6 max-w-md mx-auto">
            Join hundreds of pharmacies improving patient care with PharmaCare.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-base px-6">Start Your Free Trial</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card/50">
        <div className="container mx-auto px-4 lg:px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <PillIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">PharmaCare</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 PharmaCare. Improving patient outcomes, one reminder at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
