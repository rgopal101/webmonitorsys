import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Globe, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "$1",
    period: "/month",
    description: "Perfect for personal projects and small websites.",
    features: [
      "Monitor up to 5 domains",
      "2 notification email addresses",
      "Basic status checks",
      "Basic dashboard",
      "Email alerts",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: "$5",
    period: "/month",
    description: "For growing businesses that need detailed insights.",
    features: [
      "Monitor up to 10 domains",
      "5 notification email addresses",
      "Response time tracking",
      "Uptime history & logs",
      "Status analytics",
      "Priority support",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Unlimited",
    price: "$15",
    period: "/month",
    description: "For teams and agencies managing many websites.",
    features: [
      "Unlimited domain monitoring",
      "Unlimited notification emails",
      "Advanced analytics",
      "Full monitoring history",
      "Priority support",
      "Custom check intervals",
    ],
    cta: "Get Started",
    popular: false,
  },
];

const freePlan = {
  features: [
    "Monitor 1 domain",
    "1 notification email",
    "Basic status checks",
    "15-day free trial",
  ],
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Globe className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">isitonlineornot<span className="text-primary">.com</span></span>
          </Link>
          <div className="hidden items-center gap-6 text-sm md:flex">
            <Link to="/" className="text-muted-foreground transition hover:text-foreground">Home</Link>
            <Link to="/pricing" className="text-foreground font-medium">Pricing</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button size="sm" variant="ghost">Login</Button></Link>
            <Link to="/signup"><Button size="sm">Sign Up Free</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Zap className="mr-1.5 h-3.5 w-3.5" /> Simple Pricing
            </Badge>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              Choose Your Monitoring Plan
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              Start free, upgrade when you need more. All plans include real-time alerts and uptime monitoring.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Free Tier Banner */}
      <div className="mx-auto max-w-4xl px-4 mb-12">
        <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">🎉 Free Forever Plan</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started with no credit card required</p>
          <div className="flex flex-wrap justify-center gap-4">
            {freePlan.features.map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" /> {f}
              </span>
            ))}
          </div>
          <Link to="/signup">
            <Button className="mt-4" variant="outline">Start Free <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>
      </div>

      {/* Plans */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative rounded-2xl border p-8 transition-all",
                  plan.popular
                    ? "border-primary bg-card shadow-xl shadow-primary/10 scale-[1.02]"
                    : "border-border bg-card hover:border-primary/30"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} isitonlineornot.com — Website Monitoring Tool
        </div>
      </footer>
    </div>
  );
}
