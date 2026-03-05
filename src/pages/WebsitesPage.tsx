import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Play, Pause, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WebsitesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", owner_email: "", tracking_enabled: true });

  const { data: websites, isLoading } = useQuery({
    queryKey: ["websites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("websites").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addWebsite = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("websites").insert({
        name: form.name,
        url: form.url,
        owner_email: form.owner_email,
        tracking_enabled: form.tracking_enabled,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websites"] });
      toast.success("Website added");
      setForm({ name: "", url: "", owner_email: "", tracking_enabled: true });
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleTracking = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("websites").update({ tracking_enabled: enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websites"] });
      toast.success("Tracking updated");
    },
  });

  const deleteWebsite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("websites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websites"] });
      toast.success("Website deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const checkAll = useMutation({
    mutationFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/monitor-websites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Check failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["websites"] });
      toast.success(`Checked ${data.checked} website(s)`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Websites</h1>
          <p className="text-sm text-muted-foreground">Manage monitored websites</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => checkAll.mutate()} disabled={checkAll.isPending}>
            <RefreshCw className={cn("mr-2 h-4 w-4", checkAll.isPending && "animate-spin")} />
            {checkAll.isPending ? "Checking..." : "Check All Now"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Website</Button>
            </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Website</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addWebsite.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Website Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Website URL</Label>
                <Input type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://example.com" required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Owner Email</Label>
                <Input type="email" value={form.owner_email} onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))} required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Tracking Status</Label>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-background border border-border">
                  <label className={cn("flex items-center gap-2 cursor-pointer", form.tracking_enabled && "text-success")}>
                    <input
                      type="radio"
                      checked={form.tracking_enabled}
                      onChange={() => setForm((f) => ({ ...f, tracking_enabled: true }))}
                      className="accent-[hsl(var(--success))]"
                    />
                    <span className="text-sm font-medium">ON</span>
                  </label>
                  <label className={cn("flex items-center gap-2 cursor-pointer", !form.tracking_enabled && "text-destructive")}>
                    <input
                      type="radio"
                      checked={!form.tracking_enabled}
                      onChange={() => setForm((f) => ({ ...f, tracking_enabled: false }))}
                      className="accent-[hsl(var(--destructive))]"
                    />
                    <span className="text-sm font-medium">OFF</span>
                  </label>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={addWebsite.isPending}>
                {addWebsite.isPending ? "Adding..." : "Add Website"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3">Website</th>
              <th className="px-6 py-3">Owner</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Response</th>
              <th className="px-6 py-3">Tracking</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>}
            {websites?.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">No websites added</td></tr>}
            {websites?.map((w) => (
              <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.url}</p>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{w.owner_email}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    w.status === "online" ? "status-online" : w.status === "offline" ? "status-offline" : "bg-muted text-muted-foreground"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", w.status === "online" ? "bg-success" : w.status === "offline" ? "bg-destructive" : "bg-muted-foreground")} />
                    {w.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-foreground">{w.response_time_ms ? `${w.response_time_ms}ms` : "—"}</td>
                <td className="px-6 py-4">
                  <Switch
                    checked={w.tracking_enabled}
                    onCheckedChange={(v) => toggleTracking.mutate({ id: w.id, enabled: v })}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => toggleTracking.mutate({ id: w.id, enabled: !w.tracking_enabled })}>
                      {w.tracking_enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteWebsite.mutate(w.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
