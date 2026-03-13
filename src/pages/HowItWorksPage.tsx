import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, Search, Server, BarChart3, Bell } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Search,
    title: "Enter Your Website URL",
    desc: "Type any website address into our status checker. You can check any publicly accessible website — no account needed.",
  },
  {
    num: "02",
    icon: Server,
    title: "We Ping the Server",
    desc: "Our system sends an HTTP request to the website from our servers and measures the response time and status code.",
  },
  {
    num: "03",
    icon: BarChart3,
    title: "Get Instant Results",
    desc: "Within seconds, you'll see whether the website is online, offline, or responding slowly — along with response time data.",
  },
  {
    num: "04",
    icon: Bell,
    title: "Set Up Monitoring (Optional)",
    desc: "Want continuous checks? Sign up for free and add your website to our monitoring dashboard. We'll alert you via email if it goes down.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-14 text-center">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              How <span className="text-primary">It Works</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Checking website status is simple. Here's exactly what happens when you use our tool.
            </p>
          </div>
          <div className="space-y-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <s.icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Step {s.num}</div>
                  <h3 className="mb-2 text-xl font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
