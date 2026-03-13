import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Globe, Plus, Trash2, Edit2, LogOut, Activity, CheckCircle2, XCircle,
  AlertTriangle, Clock, BarChart3, Loader2, ExternalLink, Crown, X, Settings,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type WebsiteForm = {
  name: string;
  url: string;
  owner_email: string;
  tracking_enabled: boolean;
};

const emptyForm: WebsiteForm = { name: "", url: "", owner_email: "", tracking_enabled: true };

export default function UserDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<WebsiteForm>(emptyForm);

  // Fetch user's subscription
  const { data: subscription } = useQuery({
    queryKey: ["user-subscription"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's websites
  const { data: websites, isLoading } = useQuery({
    queryKey: ["user-websites"],
    queryFn: async () => {
      const { data } = await supabase
        .from("websites")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const maxDomains = subscription?.max_domains ?? 5;
  const currentCount = websites?.length ?? 0;
  const canAdd = currentCount < maxDomains;

  const saveMutation = useMutation({
    mutationFn: async (data: WebsiteForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from("websites").update({
          name: data.name, url: data.url, owner_email: data.owner_email, tracking_enabled: data.tracking_enabled,
        }).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("websites").insert({
          name: data.name, url: data.url, owner_email: data.owner_email,
          tracking_enabled: data.tracking_enabled, user_id: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-websites"] });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
      toast.success(editId ? "Website updated" : "Website added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("websites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-websites"] });
      toast.success("Website removed");
    },
  });

  const checkMutation = useMutation({
    mutationFn: async (website: { id: string; url: string }) => {
      const { data, error } = await supabase.functions.invoke("check-website", {
        body: { url: website.url },
      });
      if (error) throw error;
      await supabase.from("websites").update({
        status: data.status,
        response_time_ms: data.responseTime,
        last_checked_at: new Date().toISOString(),
      }).eq("id", website.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-websites"] });
      toast.success("Check complete");
    },
  });

  const openAdd = () => {
    if (!canAdd) {
      toast.error(`You've reached the ${maxDomains} domain limit. Upgrade your plan for more.`);
      return;
    }
    setEditId(null);
    setForm({ ...emptyForm, owner_email: user?.email ?? "" });
    setDialogOpen(true);
  };

  const openEdit = (w: any) => {
    setEditId(w.id);
    setForm({ name: w.name, url: w.url, owner_email: w.owner_email, tracking_enabled: w.tracking_enabled });
    setDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const onlineCount = websites?.filter((w) => w.status === "online").length ?? 0;
  const offlineCount = websites?.filter((w) => w.status === "offline").length ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Monitored</p>
            <p className="text-3xl font-bold mt-1">{currentCount}<span className="text-lg text-muted-foreground">/{maxDomains === 999 ? "∞" : maxDomains}</span></p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Online</p>
            <p className="text-3xl font-bold mt-1 text-success">{onlineCount}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Offline</p>
            <p className="text-3xl font-bold mt-1 text-destructive">{offlineCount}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-xl font-bold mt-1 capitalize">{subscription?.plan ?? "Free"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Your Websites</h2>
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Website
          </Button>
        </div>

        {/* Websites Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : websites?.length === 0 ? (
            <div className="py-16 text-center">
              <Globe className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">No websites added yet</p>
              <Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" /> Add Your First Website</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">Website</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Response</th>
                    <th className="px-6 py-3">Last Checked</th>
                    <th className="px-6 py-3">Tracking</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {websites?.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium">{w.name}</p>
                        <p className="text-xs text-muted-foreground">{w.url}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={w.status === "online" ? "default" : w.status === "offline" ? "destructive" : "secondary"} className="text-xs">
                          {w.status === "online" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {w.status === "offline" && <XCircle className="mr-1 h-3 w-3" />}
                          {w.status === "online" ? "Online" : w.status === "offline" ? "Offline" : "Unknown"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        {w.response_time_ms ? `${w.response_time_ms}ms` : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {w.last_checked_at ? new Date(w.last_checked_at).toLocaleString() : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={w.tracking_enabled ? "default" : "secondary"} className="text-xs">
                          {w.tracking_enabled ? "ON" : "OFF"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => checkMutation.mutate({ id: w.id, url: w.url })}
                            disabled={checkMutation.isPending}>
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(w)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(w.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {subscription?.plan === "free" && (
          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <Crown className="mx-auto h-8 w-8 text-primary mb-2" />
            <h3 className="text-lg font-semibold mb-1">Upgrade Your Plan</h3>
            <p className="text-sm text-muted-foreground mb-4">Get more domains, notification emails, and advanced analytics.</p>
            <Link to="/pricing">
              <Button>View Plans</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Website" : "Add Website"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate({ ...form, id: editId ?? undefined });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Website Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Website" required />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" required />
            </div>
            <div className="space-y-2">
              <Label>Notification Email</Label>
              <Input type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} placeholder="you@example.com" required />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enable Monitoring</Label>
              <Switch checked={form.tracking_enabled} onCheckedChange={(v) => setForm({ ...form, tracking_enabled: v })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Add Website"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
