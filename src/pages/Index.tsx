import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ActivityIcon, BellIcon, CalendarIcon, LineChartIcon,
  PillIcon, UsersIcon, ArrowRightIcon, CheckCircle2Icon, ShieldCheckIcon
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/60 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <PillIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">PharmaCare</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="shadow-sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-6 py-24 lg:py-36 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide uppercase">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Smart Pharmacy Management
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
              Never Miss a{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Patient Follow-Up
                </span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Automated medication reminders, intelligent follow-ups, and data-driven insights to improve patient outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="text-base px-8 h-12 w-full sm:w-auto shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                  Get Started
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground">
              {["HIPAA-conscious design", "SMS & WhatsApp", "Real-time analytics"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything You Need to{" "}
              <span className="text-primary">Care for Patients</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Comprehensive tools designed to improve patient outcomes and pharmacy operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BellIcon, title: "Automated Reminders", description: "Timely SMS and WhatsApp medication reminders that patients actually respond to." },
              { icon: CalendarIcon, title: "Smart Follow-Ups", description: "Auto-scheduled follow-ups based on treatment protocols and medication timelines." },
              { icon: PillIcon, title: "Drug Database", description: "Built-in dosage rules, therapy guidelines, and chronic medication tracking." },
              { icon: LineChartIcon, title: "Analytics Dashboard", description: "Track adherence rates, engagement metrics, and operational efficiency.", link: "/analytics" },
              { icon: UsersIcon, title: "Patient Management", description: "Quick registration, complete medication history, and exportable records." },
              { icon: ActivityIcon, title: "Refill Alerts", description: "Predict and remind for chronic medication refills before they run out." },
            ].map((feature, i) => {
              const content = (
                <Card key={i} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group border-border/60">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              );
              return feature.link ? <Link key={i} to={feature.link}>{content}</Link> : content;
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Simple Setup,{" "}
              <span className="text-primary">Powerful Results</span>
            </h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-0">
            {[
              { step: "1", title: "Register Patient & Medication", description: "Quick entry of customer details and prescriptions with multi-drug support." },
              { step: "2", title: "Auto-Schedule Reminders", description: "System creates personalized reminders based on the drug database." },
              { step: "3", title: "Track & Follow Up", description: "Receive alerts and monitor patient adherence in real-time." },
              { step: "4", title: "Analyze & Improve", description: "Use actionable insights to improve care and pharmacy operations." },
            ].map((item, i, arr) => (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground shadow-sm">
                    {item.step}
                  </div>
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-border my-2" />}
                </div>
                <div className={`pt-1 ${i < arr.length - 1 ? 'pb-10' : 'pb-0'}`}>
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
            Ready to Transform Your Pharmacy?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Start managing patient follow-ups and medication reminders today.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all">
              Get Started Free
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10 bg-card/30">
        <div className="container mx-auto px-4 lg:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <PillIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">PharmaCare</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PharmaCare. Improving patient outcomes, one reminder at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;