import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Acceptance of Terms",
    content: `By accessing and using isitonlineornot.com, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.`,
  },
  {
    title: "Description of Service",
    content: `isitonlineornot.com provides website status checking and uptime monitoring services. We offer both free status checks and subscription-based continuous monitoring with email alerts.`,
  },
  {
    title: "User Accounts",
    content: `To access monitoring features, you must create an account with accurate information. You are responsible for:

• Maintaining the confidentiality of your account credentials.
• All activities that occur under your account.
• Notifying us immediately of any unauthorized access.`,
  },
  {
    title: "Acceptable Use",
    content: `You agree not to:

• Use the service for any unlawful purpose.
• Attempt to overload or disrupt our servers or infrastructure.
• Use automated tools to excessively query our service.
• Interfere with other users' access to the service.
• Reverse engineer or attempt to extract the source code of our service.`,
  },
  {
    title: "Service Availability",
    content: `We strive to maintain high availability of our service but do not guarantee uninterrupted access. We may perform scheduled maintenance or experience unexpected downtime. We are not liable for any losses resulting from service interruptions.`,
  },
  {
    title: "Limitation of Liability",
    content: `isitonlineornot.com is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the service. Our monitoring results are for informational purposes and should not be the sole basis for critical business decisions.`,
  },
  {
    title: "Subscriptions & Payments",
    content: `Paid subscription plans are billed according to the selected billing cycle. You may cancel your subscription at any time. Refunds are handled on a case-by-case basis. We reserve the right to change pricing with reasonable notice.`,
  },
  {
    title: "Termination",
    content: `We reserve the right to suspend or terminate your account if you violate these terms. You may also delete your account at any time. Upon termination, your data will be deleted in accordance with our Privacy Policy.`,
  },
  {
    title: "Changes to Terms",
    content: `We may update these Terms of Service from time to time. Continued use of the service after changes constitutes acceptance of the new terms.`,
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">Legal</Badge>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: March 13, 2026</p>
          </div>
          <div className="space-y-8">
            {sections.map((s) => (
              <div key={s.title} className="rounded-2xl border border-border bg-card p-8">
                <h2 className="mb-4 text-xl font-semibold">{s.title}</h2>
                <div className="whitespace-pre-line text-muted-foreground leading-relaxed text-sm">
                  {s.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
