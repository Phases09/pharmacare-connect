import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ActivityIcon, 
  BellIcon, 
  CalendarIcon, 
  LineChartIcon, 
  PillIcon, 
  UsersIcon,
  CheckCircle2Icon,
  ClockIcon,
  TrendingUpIcon
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PillIcon className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              PharmaCare
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <ActivityIcon className="h-4 w-4" />
                Smart Pharmacy Management
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Never Miss a <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Patient Follow-Up
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              Automated medication reminders, intelligent follow-ups, and data-driven insights 
              to improve patient outcomes and boost pharmacy revenue.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Link to="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-700">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="h-5 w-5 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="h-5 w-5 text-success" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { value: "95%", label: "Patient Adherence", icon: CheckCircle2Icon },
              { value: "3x", label: "Repeat Visits", icon: TrendingUpIcon },
              { value: "80%", label: "Time Saved", icon: ClockIcon },
              { value: "50K+", label: "Reminders Sent", icon: BellIcon },
            ].map((stat, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to <span className="text-primary">Care for Patients</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to improve patient outcomes and pharmacy operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BellIcon,
                title: "Automated Reminders",
                description: "Send timely medication reminders via SMS and WhatsApp to improve adherence",
                color: "primary"
              },
              {
                icon: CalendarIcon,
                title: "Smart Follow-Ups",
                description: "Automatically schedule and track follow-ups based on treatment duration",
                color: "accent"
              },
              {
                icon: PillIcon,
                title: "Drug Database",
                description: "Comprehensive database with dosage rules and therapy guidelines",
                color: "success"
              },
              {
                icon: LineChartIcon,
                title: "Analytics Dashboard",
                description: "Track adherence rates, revenue impact, and customer engagement metrics",
                color: "warning"
              },
              {
                icon: UsersIcon,
                title: "Patient Management",
                description: "Quick registration and complete patient history at your fingertips",
                color: "primary"
              },
              {
                icon: ActivityIcon,
                title: "Refill Alerts",
                description: "Predict and remind patients when it's time to refill chronic medications",
                color: "accent"
              },
            ].map((feature, index) => {
              const isAnalytics = feature.title === "Analytics Dashboard";
              const CardContent = (
                <Card 
                  key={index} 
                  className={`p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group ${isAnalytics ? 'cursor-pointer' : ''}`}
                >
                  <div className={`h-12 w-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );

              return isAnalytics ? (
                <Link key={index} to="/dashboard">
                  {CardContent}
                </Link>
              ) : CardContent;
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple Setup, <span className="text-primary">Powerful Results</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our streamlined workflow
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Register Patient & Medication",
                description: "Quick entry of customer details and prescribed medication"
              },
              {
                step: "2",
                title: "Auto-Schedule Reminders",
                description: "System automatically creates reminder schedule based on drug database"
              },
              {
                step: "3",
                title: "Track & Follow Up",
                description: "Receive alerts for follow-ups and track patient adherence"
              },
              {
                step: "4",
                title: "Analyze & Improve",
                description: "Use insights to improve patient care and pharmacy operations"
              }
            ].map((item, index) => (
              <div key={index} className="flex gap-6 mb-12 last:mb-0">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                    {item.step}
                  </div>
                </div>
                <div className="flex-grow pt-2">
                  <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="text-primary">Transparent Pricing</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your pharmacy's needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "GH₵ 200",
                period: "/month",
                features: [
                  "Up to 100 patients",
                  "Basic reminders (SMS)",
                  "Follow-up tracking",
                  "Basic analytics",
                  "Email support"
                ]
              },
              {
                name: "Professional",
                price: "GH₵ 400",
                period: "/month",
                popular: true,
                features: [
                  "Up to 500 patients",
                  "SMS + WhatsApp reminders",
                  "Advanced analytics",
                  "Drug database access",
                  "Priority support",
                  "Custom branding"
                ]
              },
              {
                name: "Enterprise",
                price: "GH₵ 800",
                period: "/month",
                features: [
                  "Unlimited patients",
                  "All reminder channels",
                  "Full analytics suite",
                  "API integration",
                  "Dedicated support",
                  "Custom features"
                ]
              }
            ].map((plan, index) => (
              <Card 
                key={index} 
                className={`p-8 relative ${plan.popular ? 'border-primary border-2 shadow-xl scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2">
                      <CheckCircle2Icon className="h-5 w-5 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/dashboard">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    Get Started
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Pharmacy?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join hundreds of pharmacies improving patient care with PharmaCare
            </p>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <PillIcon className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">PharmaCare</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 PharmaCare. Improving patient outcomes, one reminder at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
