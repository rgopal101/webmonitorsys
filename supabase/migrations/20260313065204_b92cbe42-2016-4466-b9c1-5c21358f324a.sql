
-- Add user_id to websites table for per-user ownership
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  max_domains integer NOT NULL DEFAULT 5,
  max_emails integer NOT NULL DEFAULT 2,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Service role / triggers can insert
CREATE POLICY "System can insert subscriptions" ON public.user_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy so users can see their own websites
CREATE POLICY "Users can view own websites" ON public.websites
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Users can insert their own websites
CREATE POLICY "Users can insert own websites" ON public.websites
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Users can update their own websites
CREATE POLICY "Users can update own websites" ON public.websites
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Users can delete their own websites
CREATE POLICY "Users can delete own websites" ON public.websites
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Auto-create subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, max_domains, max_emails)
  VALUES (NEW.id, 'free', 5, 2);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Enable realtime for user_subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
