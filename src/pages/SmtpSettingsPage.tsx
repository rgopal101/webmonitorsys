import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Send, CreditCard, Eye, EyeOff, Search, Home, Image, Upload } from "lucide-react";

// Helper hook to fetch and save site settings
function useSiteSettings(keys: string[]) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings", ...keys],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("setting_key", keys);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((row: any) => { map[row.setting_key] = row.setting_value; });
      return map;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      for (const [key, value] of Object.entries(values)) {
        const { error } = await supabase
          .from("site_settings")
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq("setting_key", key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { data: data || {}, isLoading, save: saveMutation.mutate, isSaving: saveMutation.isPending };
}

// ─── SEO Tab ───
function SeoTab() {
  const keys = ["seo_title", "seo_description", "seo_keywords", "og_image"];
  const { data, isLoading, save, isSaving } = useSiteSettings(keys);
  const [form, setForm] = useState<Record<string, string>>({});
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (!isLoading && Object.keys(data).length && !init) {
      setForm(data);
      setInit(true);
    }
  }, [data, isLoading, init]);

  return (
    <div className="max-w-lg rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">SEO Settings</p>
          <p className="text-xs text-muted-foreground">Manage meta tags and Open Graph data</p>
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); save(form); }} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Page Title <span className="text-xs text-muted-foreground">(max 60 chars)</span></Label>
          <Input value={form.seo_title || ""} maxLength={60} onChange={(e) => setForm(f => ({ ...f, seo_title: e.target.value }))} className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Meta Description <span className="text-xs text-muted-foreground">(max 160 chars)</span></Label>
          <Textarea value={form.seo_description || ""} maxLength={160} rows={3} onChange={(e) => setForm(f => ({ ...f, seo_description: e.target.value }))} className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Keywords <span className="text-xs text-muted-foreground">(comma separated)</span></Label>
          <Input value={form.seo_keywords || ""} onChange={(e) => setForm(f => ({ ...f, seo_keywords: e.target.value }))} placeholder="keyword1, keyword2, keyword3" className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">OG Image URL</Label>
          <Input value={form.og_image || ""} onChange={(e) => setForm(f => ({ ...f, og_image: e.target.value }))} placeholder="https://example.com/og-image.png" className="bg-background border-border" />
          {form.og_image && (
            <img src={form.og_image} alt="OG Preview" className="mt-2 h-32 rounded-lg border border-border object-cover" />
          )}
        </div>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save SEO Settings"}</Button>
      </form>
    </div>
  );
}

// ─── Home Page Tab ───
function HomePageTab() {
  const keys = ["homepage_hero_title", "homepage_hero_subtitle", "homepage_cta_text", "homepage_cta_link"];
  const { data, isLoading, save, isSaving } = useSiteSettings(keys);
  const [form, setForm] = useState<Record<string, string>>({});
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (!isLoading && Object.keys(data).length && !init) {
      setForm(data);
      setInit(true);
    }
  }, [data, isLoading, init]);

  return (
    <div className="max-w-lg rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Home Page Settings</p>
          <p className="text-xs text-muted-foreground">Customize the landing page hero section</p>
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); save(form); }} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Hero Title</Label>
          <Input value={form.homepage_hero_title || ""} onChange={(e) => setForm(f => ({ ...f, homepage_hero_title: e.target.value }))} className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Hero Subtitle</Label>
          <Textarea value={form.homepage_hero_subtitle || ""} rows={3} onChange={(e) => setForm(f => ({ ...f, homepage_hero_subtitle: e.target.value }))} className="bg-background border-border" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">CTA Button Text</Label>
            <Input value={form.homepage_cta_text || ""} onChange={(e) => setForm(f => ({ ...f, homepage_cta_text: e.target.value }))} className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">CTA Button Link</Label>
            <Input value={form.homepage_cta_link || ""} onChange={(e) => setForm(f => ({ ...f, homepage_cta_link: e.target.value }))} placeholder="/signup" className="bg-background border-border" />
          </div>
        </div>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Home Settings"}</Button>
      </form>
    </div>
  );
}

// ─── Logo & Icons Tab ───
function LogoIconsTab() {
  const keys = ["logo_url", "favicon_url", "logo_alt_text"];
  const { data, isLoading, save, isSaving } = useSiteSettings(keys);
  const [form, setForm] = useState<Record<string, string>>({});
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (!isLoading && Object.keys(data).length && !init) {
      setForm(data);
      setInit(true);
    }
  }, [data, isLoading, init]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${settingKey}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("email-assets")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage.from("email-assets").getPublicUrl(filePath);
    setForm(f => ({ ...f, [settingKey]: urlData.publicUrl }));
    toast.success("File uploaded successfully");
  };

  return (
    <div className="max-w-lg rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Image className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Logo & Icons</p>
          <p className="text-xs text-muted-foreground">Upload or set URLs for your site logo and favicon</p>
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); save(form); }} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Logo URL</Label>
          <div className="flex gap-2">
            <Input value={form.logo_url || ""} onChange={(e) => setForm(f => ({ ...f, logo_url: e.target.value }))} className="bg-background border-border flex-1" />
            <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background px-3 hover:bg-accent transition-colors">
              <Upload className="h-4 w-4" />
            </Label>
            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "logo_url")} />
          </div>
          {form.logo_url && (
            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center">
              <img src={form.logo_url} alt="Logo preview" className="max-h-16 object-contain" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Favicon URL</Label>
          <div className="flex gap-2">
            <Input value={form.favicon_url || ""} onChange={(e) => setForm(f => ({ ...f, favicon_url: e.target.value }))} className="bg-background border-border flex-1" />
            <Label htmlFor="favicon-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background px-3 hover:bg-accent transition-colors">
              <Upload className="h-4 w-4" />
            </Label>
            <input id="favicon-upload" type="file" accept="image/*,.ico" className="hidden" onChange={(e) => handleFileUpload(e, "favicon_url")} />
          </div>
          {form.favicon_url && (
            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center">
              <img src={form.favicon_url} alt="Favicon preview" className="h-8 w-8 object-contain" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Logo Alt Text</Label>
          <Input value={form.logo_alt_text || ""} onChange={(e) => setForm(f => ({ ...f, logo_alt_text: e.target.value }))} placeholder="Your brand name" className="bg-background border-border" />
        </div>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Logo & Icons"}</Button>
      </form>
    </div>
  );
}

// ─── SMTP Tab ───
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

  const [form, setForm] = useState({ host: "smtp.gmail.com", port: 587, email: "", password: "", encryption: "tls" });
  const [initialized, setInitialized] = useState(false);
  if (settings && !initialized) {
    setForm({ host: settings.host, port: settings.port, email: settings.email, password: settings.password, encryption: settings.encryption });
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["smtp-settings"] }); toast.success("SMTP settings saved"); },
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
            <Input value={form.host} onChange={(e) => setForm(f => ({ ...f, host: e.target.value }))} className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">SMTP Port</Label>
            <Input type="number" value={form.port} onChange={(e) => setForm(f => ({ ...f, port: parseInt(e.target.value) }))} className="bg-background border-border" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">SMTP Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">SMTP Password / App Password</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Encryption</Label>
          <Select value={form.encryption} onValueChange={(v) => setForm(f => ({ ...f, encryption: v }))}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tls">TLS</SelectItem>
              <SelectItem value="ssl">SSL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saveSettings.isPending}>{saveSettings.isPending ? "Saving..." : "Save Settings"}</Button>
          <Button type="button" variant="outline" onClick={() => toast.info("SMTP test functionality will be available via edge function")}>
            <Send className="mr-2 h-4 w-4" /> Test SMTP
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── PayPal Tab ───
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

  const [form, setForm] = useState({ client_id: "", client_secret: "", mode: "sandbox" });
  const [initialized, setInitialized] = useState(false);
  if (settings && !initialized) {
    setForm({ client_id: settings.client_id, client_secret: settings.client_secret, mode: settings.mode });
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["paypal-settings"] }); toast.success("PayPal settings saved"); },
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
          <Input value={form.client_id} onChange={(e) => setForm(f => ({ ...f, client_id: e.target.value }))} placeholder="Enter your PayPal Client ID" className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">PayPal Secret Key</Label>
          <div className="relative">
            <Input type={showSecret ? "text" : "password"} value={form.client_secret} onChange={(e) => setForm(f => ({ ...f, client_secret: e.target.value }))} placeholder="Enter your PayPal Secret Key" className="bg-background border-border pr-10" />
            <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Environment</Label>
          <Select value={form.mode} onValueChange={(v) => setForm(f => ({ ...f, mode: v }))}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
              <SelectItem value="live">Live (Production)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {form.mode === "sandbox" ? "Use sandbox mode for testing. No real payments will be processed." : "⚠️ Live mode will process real payments. Make sure your credentials are correct."}
          </p>
        </div>
        <Button type="submit" disabled={saveSettings.isPending}>{saveSettings.isPending ? "Saving..." : "Save Settings"}</Button>
      </form>
    </div>
  );
}

// ─── Main Settings Page ───
export default function SmtpSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage SEO, home page, branding, SMTP and payment settings</p>
      </div>

      <Tabs defaultValue="seo" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" /> SEO
          </TabsTrigger>
          <TabsTrigger value="homepage" className="gap-2">
            <Home className="h-4 w-4" /> Home Page
          </TabsTrigger>
          <TabsTrigger value="logo" className="gap-2">
            <Image className="h-4 w-4" /> Logo & Icons
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-2">
            <Mail className="h-4 w-4" /> SMTP
          </TabsTrigger>
          <TabsTrigger value="paypal" className="gap-2">
            <CreditCard className="h-4 w-4" /> PayPal
          </TabsTrigger>
        </TabsList>
        <TabsContent value="seo" className="mt-6"><SeoTab /></TabsContent>
        <TabsContent value="homepage" className="mt-6"><HomePageTab /></TabsContent>
        <TabsContent value="logo" className="mt-6"><LogoIconsTab /></TabsContent>
        <TabsContent value="smtp" className="mt-6"><SmtpTab /></TabsContent>
        <TabsContent value="paypal" className="mt-6"><PayPalTab /></TabsContent>
      </Tabs>
    </div>
  );
}
