import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "How do I check if a website is down?", a: "Simply enter the website URL in our checker tool on the homepage and click 'Check Status'. Our system will instantly verify if the website is reachable from our servers and report its status." },
  { q: "Why might a website be offline?", a: "Websites can go offline for several reasons: server downtime, hosting provider issues, DNS configuration problems, expired domains, DDoS attacks, or scheduled maintenance windows." },
  { q: "Is this tool free?", a: "Yes! Our website status checker is completely free to use with no registration required. You can check unlimited websites as many times as you need." },
  { q: "How accurate is the status check?", a: "We check websites from our server infrastructure in real-time. If a site is unreachable from our servers, it's likely experiencing issues. However, regional outages may only affect specific locations." },
  { q: "Can I monitor my website continuously?", a: "Yes! Sign up for our free monitoring service to receive email alerts whenever your website goes down. We'll check your site at regular intervals and notify you instantly." },
  { q: "What does 'slow response' mean?", a: "A 'slow response' status means the website is reachable but took longer than expected to respond. This could indicate server load issues, network congestion, or performance problems." },
  { q: "How often does the monitoring check my site?", a: "Our monitoring system checks your websites at configurable intervals. The default check interval depends on your subscription plan, ranging from every few minutes to hourly checks." },
  { q: "Can I monitor multiple websites?", a: "Yes! You can add multiple websites to your monitoring dashboard. The number of websites you can monitor depends on your subscription plan." },
  { q: "Do you support HTTPS websites?", a: "Yes, we fully support both HTTP and HTTPS websites. Our checker will automatically handle SSL/TLS connections when checking HTTPS sites." },
  { q: "How do I receive downtime alerts?", a: "When you sign up and add a website to monitoring, we'll send email notifications to your registered email address whenever we detect that your website is down." },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Frequently Asked <span className="text-primary">Questions</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about our website monitoring service.
            </p>
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
    </div>
  );
}
