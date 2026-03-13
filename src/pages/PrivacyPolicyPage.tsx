import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Information We Collect",
    content: `When you use isitonlineornot.com, we may collect the following information:
    
• **Account Information**: When you sign up, we collect your email address and name.
• **Website URLs**: URLs you submit for status checks or monitoring.
• **Usage Data**: Pages visited, features used, and interaction patterns.
• **Technical Data**: IP address, browser type, device information, and cookies.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use the collected information to:

• Provide and maintain our website monitoring service.
• Send you downtime alerts and notifications.
• Improve our service and user experience.
• Communicate with you about your account or service updates.
• Ensure security and prevent abuse of our platform.`,
  },
  {
    title: "Data Storage & Security",
    content: `We take data security seriously. Your data is stored on secure servers with encryption at rest and in transit. We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or destruction.`,
  },
  {
    title: "Cookies",
    content: `We use essential cookies to maintain your session and preferences. We may also use analytics cookies to understand how our service is used. You can control cookie settings through your browser preferences.`,
  },
  {
    title: "Third-Party Services",
    content: `We may use third-party services for analytics, payment processing, and email delivery. These services have their own privacy policies and may collect data as described in their respective policies.`,
  },
  {
    title: "Your Rights",
    content: `You have the right to:

• Access the personal data we hold about you.
• Request correction of inaccurate data.
• Request deletion of your account and associated data.
• Opt out of marketing communications.
• Export your data in a portable format.`,
  },
  {
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the effective date.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">Legal</Badge>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Privacy Policy</h1>
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
      <Footer />
    </div>
  );
}
