import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Globe, ArrowRight, Zap, Loader2, IndianRupee, DollarSign } from "lucide-react";
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
    priceUSD: "$1",
    priceINR: "₹99",
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
    priceUSD: "$5",
    priceINR: "₹499",
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
    priceUSD: "$15",
    priceINR: "₹1,499",
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

  useEffect(() => {
    const token = searchParams.get("token");
    const paymentStatus = searchParams.get("payment");
    const autoPay = searchParams.get("auto_pay");
    const autoMethod = searchParams.get("method") || "paypal";

    if (paymentStatus === "cancelled") {
      toast.error("Payment was cancelled");
      return;
    }

    if (token && user) {
      capturePayPalOrder(token);
    }

    if (autoPay && user && plans.find(p => p.key === autoPay)) {
      window.history.replaceState({}, "", "/pricing");
      if (autoMethod === "razorpay") {
        handleRazorpay(autoPay);
      } else {
        handlePayPal(autoPay);
      }
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
      window.location.href = `/login?plan=${planKey}&method=paypal`;
      return;
    }

    setLoadingPlan(`${planKey}-paypal`);
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

  const handleRazorpay = async (planKey: string) => {
    if (!user) {
      window.location.href = `/login?plan=${planKey}&method=razorpay`;
      return;
    }

    setLoadingPlan(`${planKey}-razorpay`);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: {
          plan: planKey,
          user_id: user.id,
          customer_name: user.user_metadata?.full_name || "",
          customer_email: user.email || "",
          customer_contact: "",
        },
      });
      if (error) throw error;

      if (!data?.order_id || !data?.key_id) {
        toast.error("Could not create Razorpay order");
        setLoadingPlan(null);
        return;
      }

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        let pollingActive = true;
        let pollStarted = false;
        let paymentSettled = false;
        let checkoutDismissed = false;

        const stopPolling = () => {
          pollingActive = false;
        };

        const checkPaymentStatus = async (): Promise<boolean> => {
          try {
            const { data: checkData, error: checkError } = await supabase.functions.invoke("razorpay-check-payment", {
              body: { order_id: data.order_id, user_id: user.id },
            });

            if (checkError) return false;

            if (checkData?.status === "paid") {
              paymentSettled = true;
              stopPolling();
              toast.success(`Subscription activated! Plan: ${checkData.plan}`);
              window.location.href = "/my-dashboard";
              return true;
            }

            return false;
          } catch {
            return false;
          }
        };

        const startPolling = () => {
          if (pollStarted) return;
          pollStarted = true;

          const poll = async (attempt = 0) => {
            if (!pollingActive || paymentSettled) return;

            const success = await checkPaymentStatus();
            if (success) return;

            if (attempt >= 39) {
              stopPolling();
              if (checkoutDismissed) {
                setLoadingPlan(null);
                toast.error("Payment not confirmed yet. If money was debited, please wait a few seconds and refresh.");
              }
              return;
            }

            window.setTimeout(() => {
              void poll(attempt + 1);
            }, 3000);
          };

          void poll();
        };

        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          name: "IsItOnlineOrNot.com",
          description: data.plan_name,
          order_id: data.order_id,
          prefill: data.prefill,
          theme: { color: "#6366f1" },
          handler: async (response: any) => {
            paymentSettled = true;
            stopPolling();
            setLoadingPlan(`${planKey}-razorpay`);
            try {
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke("razorpay-verify-payment", {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  user_id: user.id,
                },
              });
              if (verifyError) throw verifyError;
              if (verifyData?.success) {
                toast.success(`Subscription activated! Plan: ${verifyData.plan}`);
                window.location.href = "/my-dashboard";
              } else {
                toast.error(verifyData?.error || "Payment verification failed");
              }
            } catch (e: any) {
              toast.error(e.message || "Verification failed");
            } finally {
              setLoadingPlan(null);
            }
          },
          modal: {
            ondismiss: () => {
              checkoutDismissed = true;
              if (!paymentSettled) {
                setLoadingPlan(`${planKey}-razorpay`);
                toast.info("Checking payment status...");
              }
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        startPolling();
        setLoadingPlan(null);
      };
      script.onerror = () => {
        toast.error("Failed to load Razorpay. Please try again.");
        setLoadingPlan(null);
      };
      document.body.appendChild(script);
    } catch (e: any) {
      toast.error(e.message || "Razorpay error");
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
              Start free, upgrade when you need more. Pay in USD via PayPal or INR via Razorpay.
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
                <div className="mb-2">
                  <span className="text-4xl font-extrabold">{plan.priceUSD}</span>
                  <span className="text-muted-foreground"> USD{plan.period}</span>
                </div>
                <div className="mb-6 text-sm text-muted-foreground">
                  or <span className="font-semibold text-foreground">{plan.priceINR}</span> INR{plan.period}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => handlePayPal(plan.key)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === `${plan.key}-paypal` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Pay {plan.priceUSD.replace('$', '')} USD</>
                    )}
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => handleRazorpay(plan.key)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === `${plan.key}-razorpay` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Pay {plan.priceINR.replace('₹', '')} INR</>
                    )}
                  </button>
                </div>
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
