import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogo } from "@/hooks/useSiteSettings";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/why-use", label: "Why Use" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
  { to: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const { session, signOut } = useAuth();
  const location = useLocation();
  const { logoUrl, logoAlt } = useLogo();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <img src={logoUrl} alt={logoAlt} className="h-10 w-auto object-contain" />
        </Link>

        <div className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "transition hover:text-foreground",
                location.pathname === link.to
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link to="/my-dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => signOut()}>
                <LogOut className="mr-1 h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button size="sm" variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up Free</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
