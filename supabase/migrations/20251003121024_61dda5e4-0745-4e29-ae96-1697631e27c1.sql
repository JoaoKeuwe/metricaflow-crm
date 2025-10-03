-- Habilitar extensão pgcrypto caso não esteja ativa
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recriar função de geração de token com pgcrypto
CREATE OR REPLACE FUNCTION public.generate_api_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  token_prefix TEXT := 'tok_';
  random_part TEXT;
BEGIN
  random_part := encode(gen_random_bytes(32), 'hex');
  RETURN token_prefix || random_part;
END;
$$;