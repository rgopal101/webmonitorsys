
-- Create payments table for tracking all transactions
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text NOT NULL CHECK (payment_method IN ('razorpay', 'paypal')),
  transaction_id text,
  order_id text,
  status text NOT NULL DEFAULT 'pending',
  plan text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Create razorpay_settings table
CREATE TABLE public.razorpay_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id text NOT NULL DEFAULT '',
  key_secret text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'test',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.razorpay_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage razorpay settings" ON public.razorpay_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view razorpay settings" ON public.razorpay_settings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger for both tables
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_razorpay_settings_updated_at BEFORE UPDATE ON public.razorpay_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
