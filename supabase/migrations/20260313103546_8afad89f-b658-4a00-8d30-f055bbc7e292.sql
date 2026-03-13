
CREATE TABLE public.paypal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL DEFAULT '',
  client_secret text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'sandbox',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.paypal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage paypal settings"
  ON public.paypal_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view paypal settings"
  ON public.paypal_settings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_paypal_settings_updated_at
  BEFORE UPDATE ON public.paypal_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
