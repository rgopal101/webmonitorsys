INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('script_head', ''),
  ('script_body', ''),
  ('script_footer', '')
ON CONFLICT (setting_key) DO NOTHING;