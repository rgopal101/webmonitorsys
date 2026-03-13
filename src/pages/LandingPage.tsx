import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Search,
  Bell,
  BarChart3,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Zap,
  Monitor,
  Mail,
  Activity,
  ChevronDown,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type CheckResult = {
  status: "online" | "offline" | "slow" | null;
  responseTime?: number;
  url?: string;
  checkedAt?: string;
} | null;

const features = [
  { icon: Zap, title: "Instant Website Status Check", desc: "Quickly check if any website is reachable from our global servers." },
  { icon: Activity, title: "Real-Time Monitoring", desc: "Track uptime and downtime with continuous monitoring and instant alerts." },
  { icon: Mail, title: "Email Notifications", desc: "Get alerts delivered to your inbox when your website goes offline." },
  { icon: Globe, title: "Global Monitoring", desc: "Servers monitor your website from multiple locations worldwide." },
  { icon: BarChart3, title: "Uptime Statistics", desc: "Track uptime performance, response times, and historical data." },
  { icon: Shield, title: "100% Free to Use", desc: "Our website status checker is completely free with no signup required." },
];

const steps = [
  { num: "01", title: "Enter your website URL", desc: "Type any website address into our checker tool above." },
  { num: "02", title: "We check the server status", desc: "Our system pings the server and measures response time." },
  { num: "03", title: "See instant results", desc: "Get real-time status — online, offline, or slow response." },
];

const monitoringFeatures = [
  "24/7 uptime monitoring",
  "Instant downtime alerts",
  "Email notifications",
  "Response time tracking",
  "Monitoring history & reports",
  "Multiple check intervals",
];

const faqs = [
  { q: "How do I check if a website is down?", a: "Simply enter the website URL in our checker tool above and click 'Check Status'. Our system will instantly verify if the website is reachable from our servers and report its status." },
  { q: "Why might a website be offline?", a: "Websites can go offline for several reasons: server downtime, hosting provider issues, DNS configuration problems, expired domains, DDoS attacks, or scheduled maintenance windows." },
  { q: "Is this tool free?", a: "Yes! Our website status checker is completely free to use with no registration required. You can check unlimited websites as many times as you need." },
  { q: "How accurate is the status check?", a: "We check websites from our server infrastructure in real-time. If a site is unreachable from our servers, it's likely experiencing issues. However, regional outages may only affect specific locations." },
  { q: "Can I monitor my website continuously?", a: "Yes! Sign up for our free monitoring service to receive email alerts whenever your website goes down. We'll check your site at regular intervals and notify you instantly." },
];

export default function LandingPage() {
  const { session } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult>(null);

  const checkWebsite = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("check-website", {
        body: { url: url.trim() },
      });
      if (error) throw error;
      setResult({
        status: data.status,
        responseTime: data.responseTime,
        url: data.url,
        checkedAt: new Date().toLocaleTimeString(),
      });
    } catch {
      setResult({ status: "offline", url: url.trim(), checkedAt: new Date().toLocaleTimeString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-20 md:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-4 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Zap className="mr-1.5 h-3.5 w-3.5" /> Free Website Status Checker
            </Badge>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
              Check if Any Website is{" "}
              <span className="bg-gradient-to-r from-primary to-[hsl(var(--primary)/0.7)] bg-clip-text text-transparent">
                Online or Down
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Instantly monitor website uptime and check if a website is currently reachable from our servers.
            </p>
          </motion.div>

          {/* Checker */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-xl shadow-primary/5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Enter website URL (e.g. google.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && checkWebsite()}
                    className="h-13 border-0 bg-transparent pl-11 text-base shadow-none focus-visible:ring-0 md:text-lg"
                  />
                </div>
                <Button onClick={checkWebsite} disabled={loading} size="lg" className="h-13 rounded-xl px-6 text-base font-semibold">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check Status"}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Result */}
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mt-8 max-w-lg">
              <div className={`rounded-2xl border p-6 ${
                result.status === "online" ? "border-success/30 bg-success/5" :
                result.status === "slow" ? "border-warning/30 bg-warning/5" :
                "border-destructive/30 bg-destructive/5"
              }`}>
                <div className="flex items-center justify-center gap-3 mb-3">
                  {result.status === "online" && <CheckCircle2 className="h-8 w-8 text-success" />}
                  {result.status === "slow" && <AlertTriangle className="h-8 w-8 text-warning" />}
                  {result.status === "offline" && <XCircle className="h-8 w-8 text-destructive" />}
                  <span className="text-2xl font-bold">
                    {result.status === "online" ? "Website Online" : result.status === "slow" ? "Slow Response" : "Website Down"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> {result.url}</span>
                  {result.responseTime && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {result.responseTime}ms</span>}
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {result.checkedAt}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/50 bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-14 text-center">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why Use isitonlineornot.com?</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Everything you need to monitor your websites and ensure they stay online.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group rounded-2xl border border-border bg-card p-7 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Check Website Status in Seconds</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="relative text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-extrabold text-primary">
                  {s.num}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-8 hidden h-6 w-6 text-muted-foreground/40 md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Monitoring CTA */}
      <section id="monitoring" className="border-t border-border/50 bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-4">Free Monitoring</Badge>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Monitor Your Website 24/7</h2>
              <p className="mb-8 text-muted-foreground leading-relaxed">
                Add your website to our monitoring system and receive instant alerts when your website goes offline. Stay informed with real-time notifications.
              </p>
              <ul className="mb-8 grid gap-3 sm:grid-cols-2">
                {monitoringFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button size="lg" className="rounded-xl px-8 text-base font-semibold">
                  Start Monitoring Free <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
                <Monitor className="h-5 w-5 text-primary" />
                <span className="font-semibold">Monitoring Dashboard</span>
              </div>
              {[
                { name: "google.com", status: "online", time: "45ms" },
                { name: "github.com", status: "online", time: "120ms" },
                { name: "example.com", status: "offline", time: "—" },
              ].map((site) => (
                <div key={site.name} className="flex items-center justify-between border-b border-border/50 py-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${site.status === "online" ? "bg-success" : "bg-destructive"}`} />
                    <span className="text-sm font-medium">{site.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{site.time}</span>
                    <Badge variant={site.status === "online" ? "default" : "destructive"} className="text-xs">
                      {site.status === "online" ? "Online" : "Down"}
                    </Badge>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Check Website Status Instantly</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            isitonlineornot.com helps you quickly determine if a website is online or down. Our monitoring system checks the website server response and reports whether the website is reachable. This tool is useful for developers, website owners, and businesses who want to monitor uptime and ensure their websites remain accessible around the clock.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/50 bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="text-left font-medium hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Globe className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">isitonlineornot<span className="text-primary">.com</span></span>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                Free website monitoring and status checking tool. Check if any website is online or down instantly.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="text-muted-foreground transition hover:text-foreground">Website Status Checker</a></li>
                <li><a href="#monitoring" className="text-muted-foreground transition hover:text-foreground">Website Monitoring</a></li>
                <li><a href="#features" className="text-muted-foreground transition hover:text-foreground">Features</a></li>
                <li><a href="#faq" className="text-muted-foreground transition hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="text-muted-foreground transition hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground transition hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground transition hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} isitonlineornot.com — Website Monitoring Tool
          </div>
        </div>
      </footer>
    </div>
  );
}
