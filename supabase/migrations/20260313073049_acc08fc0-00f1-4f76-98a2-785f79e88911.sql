ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS paypal_subscription_id text,
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'none';

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, max_domains, max_emails, status, current_period_start, current_period_end)
  VALUES (NEW.id, 'free', 1, 1, 'trialing', now(), now() + interval '15 days');
  RETURN NEW;
END;
$function$;