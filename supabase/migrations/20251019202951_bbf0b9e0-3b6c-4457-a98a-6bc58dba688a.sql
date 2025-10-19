-- Criar tabela de mensagens do WhatsApp
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  evolution_message_id TEXT
);

-- Índices para performance
CREATE INDEX idx_whatsapp_messages_company ON public.whatsapp_messages(company_id);
CREATE INDEX idx_whatsapp_messages_lead ON public.whatsapp_messages(lead_id);
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_messages
CREATE POLICY "Owners e gestores veem mensagens da empresa"
  ON public.whatsapp_messages FOR SELECT
  USING (
    company_id = get_user_company_id() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Vendedores veem mensagens de seus leads"
  ON public.whatsapp_messages FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE assigned_to = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar mensagens"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id() AND
    created_by = auth.uid()
  );

CREATE POLICY "Sistema pode atualizar status de mensagens"
  ON public.whatsapp_messages FOR UPDATE
  USING (company_id = get_user_company_id());

-- Criar tabela de campanhas do WhatsApp
CREATE TABLE public.whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'paused', 'completed', 'cancelled')),
  leads_processed INTEGER DEFAULT 0,
  leads_total INTEGER NOT NULL,
  leads_responded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  delay_seconds INTEGER DEFAULT 15
);

-- Índices para performance
CREATE INDEX idx_whatsapp_campaigns_company ON public.whatsapp_campaigns(company_id);
CREATE INDEX idx_whatsapp_campaigns_status ON public.whatsapp_campaigns(status);

-- Habilitar RLS
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_campaigns
CREATE POLICY "Owners e gestores veem campanhas da empresa"
  ON public.whatsapp_campaigns FOR SELECT
  USING (
    company_id = get_user_company_id() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Owners e gestores criam campanhas"
  ON public.whatsapp_campaigns FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id() AND
    created_by = auth.uid() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Owners e gestores atualizam campanhas"
  ON public.whatsapp_campaigns FOR UPDATE
  USING (
    company_id = get_user_company_id() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

-- Criar tabela de mensagens das campanhas
CREATE TABLE public.whatsapp_campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  whatsapp_message_id UUID REFERENCES public.whatsapp_messages(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'skipped')),
  error_message TEXT
);

-- Índices para performance
CREATE INDEX idx_whatsapp_campaign_messages_campaign ON public.whatsapp_campaign_messages(campaign_id);
CREATE INDEX idx_whatsapp_campaign_messages_status ON public.whatsapp_campaign_messages(status);
CREATE INDEX idx_whatsapp_campaign_messages_scheduled ON public.whatsapp_campaign_messages(scheduled_at);

-- Habilitar RLS
ALTER TABLE public.whatsapp_campaign_messages ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_campaign_messages
CREATE POLICY "Owners e gestores veem mensagens de campanhas"
  ON public.whatsapp_campaign_messages FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.whatsapp_campaigns 
      WHERE company_id = get_user_company_id()
    )
  );

-- Trigger para atualizar contadores da campanha
CREATE OR REPLACE FUNCTION public.update_campaign_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Atualizar leads_processed
    IF NEW.status IN ('sent', 'delivered', 'read', 'failed') THEN
      UPDATE public.whatsapp_campaigns
      SET leads_processed = (
        SELECT COUNT(*) FROM public.whatsapp_campaign_messages
        WHERE campaign_id = NEW.campaign_id
        AND status IN ('sent', 'delivered', 'read', 'failed')
      )
      WHERE id = NEW.campaign_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_campaign_counters_trigger
AFTER UPDATE ON public.whatsapp_campaign_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_counters();

-- Função para obter estatísticas da campanha
CREATE OR REPLACE FUNCTION public.get_campaign_stats(_campaign_id UUID)
RETURNS TABLE (
  total INTEGER,
  pending INTEGER,
  sent INTEGER,
  delivered INTEGER,
  read INTEGER,
  failed INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending,
    COUNT(*) FILTER (WHERE status = 'sent')::INTEGER as sent,
    COUNT(*) FILTER (WHERE status = 'delivered')::INTEGER as delivered,
    COUNT(*) FILTER (WHERE status = 'read')::INTEGER as read,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed
  FROM public.whatsapp_campaign_messages
  WHERE campaign_id = _campaign_id;
$$;