import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Send, CreditCard, Eye, EyeOff } from "lucide-react";

function SmtpTab() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["smtp-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("smtp_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    host: "smtp.gmail.com",
    port: 587,
    email: "",
    password: "",
    encryption: "tls",
  });

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

  return (
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
          <Button type="button" variant="outline" onClick={() => toast.info("SMTP test functionality will be available via edge function")}>
            <Send className="mr-2 h-4 w-4" />
            Test SMTP
          </Button>
        </div>
      </form>
    </div>
  );
}

function PayPalTab() {
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["paypal-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("paypal_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    client_id: "",
    client_secret: "",
    mode: "sandbox",
  });

  const [initialized, setInitialized] = useState(false);
  if (settings && !initialized) {
    setForm({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      mode: settings.mode,
    });
    setInitialized(true);
  }

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (settings) {
        const { error } = await supabase.from("paypal_settings").update(form).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("paypal_settings").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paypal-settings"] });
      toast.success("PayPal settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">PayPal Integration</p>
          <p className="text-xs text-muted-foreground">Configure PayPal API credentials for payment processing</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveSettings.mutate(); }} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground">PayPal Client ID</Label>
          <Input
            value={form.client_id}
            onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
            placeholder="Enter your PayPal Client ID"
            className="bg-background border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">PayPal Secret Key</Label>
          <div className="relative">
            <Input
              type={showSecret ? "text" : "password"}
              value={form.client_secret}
              onChange={(e) => setForm((f) => ({ ...f, client_secret: e.target.value }))}
              placeholder="Enter your PayPal Secret Key"
              className="bg-background border-border pr-10"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Environment</Label>
          <Select value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v }))}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
              <SelectItem value="live">Live (Production)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {form.mode === "sandbox"
              ? "Use sandbox mode for testing. No real payments will be processed."
              : "⚠️ Live mode will process real payments. Make sure your credentials are correct."}
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saveSettings.isPending}>
            {saveSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function SmtpSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage SMTP and payment integration settings</p>
      </div>

      <Tabs defaultValue="smtp" className="w-full">
        <TabsList>
          <TabsTrigger value="smtp" className="gap-2">
            <Mail className="h-4 w-4" /> SMTP
          </TabsTrigger>
          <TabsTrigger value="paypal" className="gap-2">
            <CreditCard className="h-4 w-4" /> PayPal
          </TabsTrigger>
        </TabsList>
        <TabsContent value="smtp" className="mt-6">
          <SmtpTab />
        </TabsContent>
        <TabsContent value="paypal" className="mt-6">
          <PayPalTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
