-- Fix password_reset_tokens RLS policy to be more restrictive
-- Remove the permissive SELECT policy that could expose user_id

DROP POLICY IF EXISTS "Anyone can validate reset tokens" ON public.password_reset_tokens;

-- Create a more restrictive policy that only allows checking if a token exists
-- Edge function uses service role, so this policy is mainly for additional security
CREATE POLICY "Tokens can only be validated via edge function" 
ON public.password_reset_tokens 
FOR SELECT 
USING (false);

-- Note: The reset-user-password edge function uses service_role key which bypasses RLS
-- This policy ensures no direct client access to token data