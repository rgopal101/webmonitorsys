import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";

export default function SmtpSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["smtp-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("smtp_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    host: settings?.host ?? "smtp.gmail.com",
    port: settings?.port ?? 587,
    email: settings?.email ?? "",
    password: settings?.password ?? "",
    encryption: settings?.encryption ?? "tls",
  });

  // Sync form when settings load
  const [initialized, setInitialized] = useState(false);
  if (settings && !initialized) {
    setForm({
      host: settings.host,
      port: settings.port,
      email: settings.email,
      password: settings.password,
      encryption: settings.encryption,
    });
    setInitialized(true);
  }

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (settings) {
        const { error } = await supabase.from("smtp_settings").update(form).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("smtp_settings").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp-settings"] });
      toast.success("SMTP settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const testSmtp = () => {
    toast.info("SMTP test functionality will be available via edge function");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SMTP Settings</h1>
        <p className="text-sm text-muted-foreground">Configure email notifications via Gmail SMTP</p>
      </div>

      <div className="max-w-lg rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Gmail SMTP Configuration</p>
            <p className="text-xs text-muted-foreground">Use your Gmail App Password for secure delivery</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveSettings.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">SMTP Host</Label>
              <Input value={form.host} onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">SMTP Port</Label>
              <Input type="number" value={form.port} onChange={(e) => setForm((f) => ({ ...f, port: parseInt(e.target.value) }))} className="bg-background border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">SMTP Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">SMTP Password / App Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Encryption</Label>
            <Select value={form.encryption} onValueChange={(v) => setForm((f) => ({ ...f, encryption: v }))}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saveSettings.isPending}>
              {saveSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
            <Button type="button" variant="outline" onClick={testSmtp}>
              <Send className="mr-2 h-4 w-4" />
              Test SMTP
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
