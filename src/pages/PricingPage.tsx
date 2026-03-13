import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Globe, ArrowRight, Zap, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const plans = [
  {
    name: "Starter",
    key: "starter",
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
    popular: false,
  },
  {
    name: "Professional",
    key: "professional",
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
    popular: true,
  },
  {
    name: "Unlimited",
    key: "unlimited",
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
    popular: false,
  },
];

const freePlan = {
  features: [
    "Monitor 1 domain",
    "1 notification email",
    "15-day free trial",
  ],
};

export default function PricingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Handle PayPal return or auto-pay after login
  useEffect(() => {
    const token = searchParams.get("token");
    const paymentStatus = searchParams.get("payment");
    const autoPay = searchParams.get("auto_pay");

    if (paymentStatus === "cancelled") {
      toast.error("Payment was cancelled");
      return;
    }

    if (token && user) {
      capturePayPalOrder(token);
    }

    // Auto-trigger PayPal after login redirect
    if (autoPay && user && plans.find(p => p.key === autoPay)) {
      // Clean URL and trigger payment
      window.history.replaceState({}, "", "/pricing");
      handlePayPal(autoPay);
    }
  }, [searchParams, user]);

  const capturePayPalOrder = async (orderId: string) => {
    setLoadingPlan("capturing");
    try {
      const { data, error } = await supabase.functions.invoke("paypal-capture-order", {
        body: { order_id: orderId },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Subscription activated! Plan: ${data.plan}`);
        window.location.href = "/my-dashboard";
      } else {
        toast.error(data?.error || "Payment capture failed");
      }
    } catch (e: any) {
      toast.error(e.message || "Payment failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePayPal = async (planKey: string) => {
    if (!user) {
      // Redirect to login with selected plan
      window.location.href = `/login?plan=${planKey}`;
      return;
    }

    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-create-order", {
        body: {
          plan: planKey,
          user_id: user.id,
          return_url: `${window.location.origin}/pricing?payment=success`,
          cancel_url: `${window.location.origin}/pricing?payment=cancelled`,
        },
      });
      if (error) throw error;

      if (data?.approval_url) {
        window.location.href = data.approval_url;
      } else {
        toast.error("Could not create PayPal order");
      }
    } catch (e: any) {
      toast.error(e.message || "PayPal error");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

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
          <h3 className="text-lg font-semibold mb-2">🎉 15-Day Free Trial</h3>
          <p className="text-sm text-muted-foreground mb-4">Try it free for 15 days — no credit card required</p>
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
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handlePayPal(plan.key)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.key ? (
                    <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Pay with PayPal <ArrowRight className="ml-1 h-4 w-4" /></>
                  )}
                </Button>
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
