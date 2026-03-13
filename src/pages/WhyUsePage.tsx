import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Zap,
  Activity,
  Mail,
  Globe,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
} from "lucide-react";

const reasons = [
  {
    icon: Zap,
    title: "Instant Results",
    desc: "Get real-time website status checks in seconds. No waiting, no delays — just instant answers about whether a site is up or down.",
  },
  {
    icon: Activity,
    title: "Continuous Monitoring",
    desc: "Our system checks your websites around the clock, so you're always the first to know when something goes wrong.",
  },
  {
    icon: Mail,
    title: "Instant Email Alerts",
    desc: "Receive immediate notifications when your website goes offline, so you can act fast and minimize downtime.",
  },
  {
    icon: Globe,
    title: "Global Server Network",
    desc: "We monitor from multiple locations worldwide to give you an accurate picture of your website's availability everywhere.",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    desc: "Track response times, uptime percentages, and historical data with easy-to-read charts and reports.",
  },
  {
    icon: Shield,
    title: "100% Free",
    desc: "Our core website status checker is completely free to use. No hidden fees, no credit card required.",
  },
  {
    icon: Clock,
    title: "Historical Uptime Data",
    desc: "Access detailed logs showing when your site was up or down, helping you identify patterns and recurring issues.",
  },
  {
    icon: CheckCircle2,
    title: "No Signup Required",
    desc: "Check any website's status instantly without creating an account. Sign up only when you want monitoring features.",
  },
];

export default function WhyUsePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-14 text-center">
            <Badge variant="secondary" className="mb-4">Why Choose Us</Badge>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Why Use <span className="text-primary">isitonlineornot.com</span>?
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              The simplest, fastest, and most reliable way to check if any website is online or experiencing downtime.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group rounded-2xl border border-border bg-card p-7 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <r.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{r.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
