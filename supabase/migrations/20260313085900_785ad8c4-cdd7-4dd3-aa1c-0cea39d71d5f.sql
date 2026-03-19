ALTER TABLE public.websites
  ADD COLUMN IF NOT EXISTS http_status_code integer,
  ADD COLUMN IF NOT EXISTS last_error text;