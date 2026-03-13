
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Seed default settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('seo_title', 'Is It Online or Not? - Free Website Status Checker & Uptime Monitor'),
  ('seo_description', 'Check if any website is online or down instantly. Free website status checker and uptime monitoring tool.'),
  ('seo_keywords', 'website monitor, uptime checker, site status'),
  ('og_image', ''),
  ('homepage_hero_title', 'Is Your Website Online Right Now?'),
  ('homepage_hero_subtitle', 'Check if any website is online or down instantly with our free monitoring tool.'),
  ('homepage_cta_text', 'Start Monitoring Free'),
  ('homepage_cta_link', '/signup'),
  ('logo_url', '/images/logo-ns.svg'),
  ('favicon_url', '/favicon.ico'),
  ('logo_alt_text', 'Is It Online or Not');
