-- Create rate_limit_log table for API rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_endpoint_time 
  ON public.rate_limit_log (identifier, endpoint, created_at DESC);

-- Enable RLS (no policies needed - managed by edge functions with service role)
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Add cleanup function to remove old rate limit logs (keeps last 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - INTERVAL '24 hours';
END;
$$;

-- Comment explaining the table
COMMENT ON TABLE public.rate_limit_log IS 'Logs API requests for rate limiting. Automatically cleaned up after 24 hours.';