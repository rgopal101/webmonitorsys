import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Play, Pause, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type WebsiteForm = {
  name: string;
  url: string;
  emails: string[];
  emailInput: string;
  tracking_enabled: boolean;
};

const emptyForm: WebsiteForm = { name: "", url: "", emails: [], emailInput: "", tracking_enabled: true };

function EmailTagInput({ emails, emailInput, onEmailsChange, onInputChange }: {
  emails: string[];
  emailInput: string;
  onEmailsChange: (emails: string[]) => void;
  onInputChange: (val: string) => void;
}) {
  const addEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Invalid email address");
      return;
    }
    if (emails.includes(trimmed)) {
      toast.error("Email already added");
      return;
    }
    onEmailsChange([...emails, trimmed]);
    onInputChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {emails.map((email) => (
          <span key={email} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {email}
            <button type="button" onClick={() => onEmailsChange(emails.filter((e) => e !== email))} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          value={emailInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addEmail}
          placeholder="Enter email and press Enter"
          className="bg-background border-border"
        />
        <Button type="button" variant="outline" size="sm" onClick={addEmail}>Add</Button>
      </div>
    </div>
  );
}

export default function WebsitesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WebsiteForm>(emptyForm);

  const { data: websites, isLoading } = useQuery({
    queryKey: ["websites"],
    ...LIVE_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase.from("websites").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
  };

  const saveWebsite = useMutation({
    mutationFn: async () => {
      if (form.emails.length === 0) throw new Error("At least one owner email is required");
      const ownerEmail = form.emails.join(", ");
      
      if (editingId) {
        const { error } = await supabase.from("websites").update({
          name: form.name,
          url: form.url,
          owner_email: ownerEmail,
          tracking_enabled: form.tracking_enabled,
        }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("websites").insert({
          name: form.name,
          url: form.url,
          owner_email: ownerEmail,
          tracking_enabled: form.tracking_enabled,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websites"] });
      toast.success(editingId ? "Website updated" : "Website added");
      resetForm();
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

  const openEdit = (w: typeof websites extends (infer T)[] | undefined ? T : never) => {
    if (!w) return;
    setEditingId(w.id);
    setForm({
      name: w.name,
      url: w.url,
      emails: w.owner_email.split(",").map((e: string) => e.trim()).filter(Boolean),
      emailInput: "",
      tracking_enabled: w.tracking_enabled,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Websites</h1>
          <p className="text-sm text-muted-foreground">Manage monitored websites</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => checkAll.mutate()} disabled={checkAll.isPending} className="border-border text-foreground hover:bg-muted">
            <RefreshCw className={cn("mr-2 h-4 w-4", checkAll.isPending && "animate-spin")} />
            {checkAll.isPending ? "Checking..." : "Check All Now"}
          </Button>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(v); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Website</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">{editingId ? "Edit Website" : "Add Website"}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingId ? "Update website details and notification emails" : "Add a new website to monitor"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveWebsite.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Website Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Website URL</Label>
                  <Input type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://example.com" required className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Notification Emails</Label>
                  <p className="text-xs text-muted-foreground">Add multiple emails to receive alerts when this site goes down or recovers</p>
                  <EmailTagInput
                    emails={form.emails}
                    emailInput={form.emailInput}
                    onEmailsChange={(emails) => setForm((f) => ({ ...f, emails }))}
                    onInputChange={(emailInput) => setForm((f) => ({ ...f, emailInput }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Tracking Status</Label>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-background border border-border">
                    <label className={cn("flex items-center gap-2 cursor-pointer", form.tracking_enabled && "text-[hsl(var(--success))]")}>
                      <input type="radio" checked={form.tracking_enabled} onChange={() => setForm((f) => ({ ...f, tracking_enabled: true }))} className="accent-[hsl(var(--success))]" />
                      <span className="text-sm font-medium">ON</span>
                    </label>
                    <label className={cn("flex items-center gap-2 cursor-pointer", !form.tracking_enabled && "text-destructive")}>
                      <input type="radio" checked={!form.tracking_enabled} onChange={() => setForm((f) => ({ ...f, tracking_enabled: false }))} className="accent-[hsl(var(--destructive))]" />
                      <span className="text-sm font-medium">OFF</span>
                    </label>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saveWebsite.isPending}>
                  {saveWebsite.isPending ? "Saving..." : editingId ? "Update Website" : "Add Website"}
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
              <th className="px-6 py-3">Notify</th>
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
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {w.owner_email.split(",").map((e: string) => e.trim()).filter(Boolean).map((email: string) => (
                      <span key={email} className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{email}</span>
                    ))}
                  </div>
                </td>
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
                  <Switch checked={w.tracking_enabled} onCheckedChange={(v) => toggleTracking.mutate({ id: w.id, enabled: v })} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => toggleTracking.mutate({ id: w.id, enabled: !w.tracking_enabled })}>
                      {w.tracking_enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(w)}>
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
