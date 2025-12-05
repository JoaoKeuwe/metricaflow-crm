-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'inactive',
  user_limit INTEGER NOT NULL DEFAULT 1,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT subscriptions_company_id_unique UNIQUE (company_id)
);

-- Índices para melhor performance
CREATE INDEX idx_subscriptions_company_id ON public.subscriptions(company_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Habilitar RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem a assinatura da sua empresa
CREATE POLICY "Users can view their company subscription"
ON public.subscriptions
FOR SELECT
USING (company_id = get_user_company_id());

-- Política para sistema criar/atualizar assinaturas (via service role)
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();