import { Link } from "react-router-dom";
import { Globe } from "lucide-react";

export default function Footer() {
  return (
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
              <li><Link to="/why-use" className="text-muted-foreground transition hover:text-foreground">Why Use</Link></li>
              <li><Link to="/how-it-works" className="text-muted-foreground transition hover:text-foreground">How It Works</Link></li>
              <li><Link to="/faq" className="text-muted-foreground transition hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/privacy-policy" className="text-muted-foreground transition hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-muted-foreground transition hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/contact" className="text-muted-foreground transition hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} isitonlineornot.com — Website Monitoring Tool
        </div>
      </div>
    </footer>
  );
}
