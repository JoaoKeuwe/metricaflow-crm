-- Criar tabela de tokens de API para integrações externas
CREATE TABLE public.api_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_api_tokens_company_id ON public.api_tokens(company_id);
CREATE INDEX idx_api_tokens_token ON public.api_tokens(token) WHERE active = true;

-- Habilitar RLS
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: apenas gestores e owners podem gerenciar tokens da empresa
CREATE POLICY "Gestores e owners podem ver tokens da empresa"
ON public.api_tokens
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

CREATE POLICY "Gestores e owners podem criar tokens"
ON public.api_tokens
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

CREATE POLICY "Gestores e owners podem atualizar tokens"
ON public.api_tokens
FOR UPDATE
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

CREATE POLICY "Gestores e owners podem deletar tokens"
ON public.api_tokens
FOR DELETE
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Criar tabela de logs de integrações
CREATE TABLE public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  api_token_id UUID REFERENCES public.api_tokens(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'api',
  payload JSONB,
  status TEXT NOT NULL,
  error_message TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_integration_logs_company_id ON public.integration_logs(company_id);
CREATE INDEX idx_integration_logs_created_at ON public.integration_logs(created_at DESC);
CREATE INDEX idx_integration_logs_token_id ON public.integration_logs(api_token_id);

-- Habilitar RLS
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: apenas gestores e owners podem ver logs da empresa
CREATE POLICY "Gestores e owners podem ver logs da empresa"
ON public.integration_logs
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Função para auto-limpeza de logs antigos (30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_integration_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.integration_logs
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;

-- Função para gerar token seguro
CREATE OR REPLACE FUNCTION public.generate_api_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_prefix TEXT := 'tok_';
  random_part TEXT;
BEGIN
  random_part := encode(gen_random_bytes(32), 'hex');
  RETURN token_prefix || random_part;
END;
$$;