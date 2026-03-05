
-- Fix overly permissive activity_logs INSERT policy
DROP POLICY "System can insert logs" ON public.activity_logs;
CREATE POLICY "Admins and managers can insert logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
