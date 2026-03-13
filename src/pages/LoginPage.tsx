import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter – $1/mo",
  professional: "Professional – $5/mo",
  unlimited: "Unlimited – $15/mo",
};

export default function LoginPage() {
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (session) {
    if (selectedPlan) {
      navigate(`/pricing?auto_pay=${selectedPlan}`);
    } else {
      navigate("/my-dashboard");
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If a plan was selected, redirect to pricing to auto-pay
    if (selectedPlan) {
      navigate(`/pricing?auto_pay=${selectedPlan}`);
      setLoading(false);
      return;
    }

    // Check role to redirect accordingly
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (roleData?.role === "admin" || roleData?.role === "manager") {
        navigate("/admin/dashboard");
      } else {
        navigate("/my-dashboard");
      }
    } else {
      navigate("/my-dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Globe className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">isitonlineornot<span className="text-primary">.com</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your monitoring dashboard</p>
          {selectedPlan && PLAN_NAMES[selectedPlan] && (
            <Badge variant="secondary" className="mt-3 px-3 py-1">
              Selected plan: {PLAN_NAMES[selectedPlan]}
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-card border-border" required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-card border-border" required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/reset-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to={selectedPlan ? `/signup?plan=${selectedPlan}` : "/signup"} className="text-primary hover:underline font-medium">Sign up free</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
