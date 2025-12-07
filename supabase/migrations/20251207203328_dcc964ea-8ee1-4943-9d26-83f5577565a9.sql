-- Tabela para códigos OTP do admin
CREATE TABLE public.admin_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode gerenciar (via edge function)
CREATE POLICY "Service role manages OTP codes"
ON public.admin_otp_codes
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Função para limpar códigos expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_otp_codes
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;