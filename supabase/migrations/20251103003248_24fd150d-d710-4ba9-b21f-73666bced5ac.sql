-- Criar tabela de configurações de gamificação
CREATE TABLE IF NOT EXISTS public.gamification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, event_type)
);

-- Enable RLS
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

-- Gestores e owners podem ver configurações da empresa
CREATE POLICY "Gestores e owners podem ver configurações"
ON public.gamification_settings
FOR SELECT
USING (
  company_id = get_user_company_id() AND
  (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Gestores e owners podem criar configurações
CREATE POLICY "Gestores e owners podem criar configurações"
ON public.gamification_settings
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() AND
  updated_by = auth.uid() AND
  (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Gestores e owners podem atualizar configurações
CREATE POLICY "Gestores e owners podem atualizar configurações"
ON public.gamification_settings
FOR UPDATE
USING (
  company_id = get_user_company_id() AND
  (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
)
WITH CHECK (
  company_id = get_user_company_id() AND
  updated_by = auth.uid() AND
  (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Inserir valores padrão para todas as empresas existentes
INSERT INTO public.gamification_settings (company_id, event_type, points)
SELECT DISTINCT c.id, 'lead_created', 10
FROM public.companies c
ON CONFLICT (company_id, event_type) DO NOTHING;

INSERT INTO public.gamification_settings (company_id, event_type, points)
SELECT DISTINCT c.id, 'lead_qualified', 15
FROM public.companies c
ON CONFLICT (company_id, event_type) DO NOTHING;

INSERT INTO public.gamification_settings (company_id, event_type, points)
SELECT DISTINCT c.id, 'proposal_sent', 25
FROM public.companies c
ON CONFLICT (company_id, event_type) DO NOTHING;

INSERT INTO public.gamification_settings (company_id, event_type, points)
SELECT DISTINCT c.id, 'sale_closed', 100
FROM public.companies c
ON CONFLICT (company_id, event_type) DO NOTHING;

INSERT INTO public.gamification_settings (company_id, event_type, points)
SELECT DISTINCT c.id, 'meeting_scheduled', 20
FROM public.companies c
ON CONFLICT (company_id, event_type) DO NOTHING;

INSERT INTO public.gamification_settings (company_id, event_type, points)
SELECT DISTINCT c.id, 'observation_added', 3
FROM public.companies c
ON CONFLICT (company_id, event_type) DO NOTHING;

-- Criar função para buscar pontos configurados
CREATE OR REPLACE FUNCTION public.get_gamification_points(
  _company_id UUID,
  _event_type TEXT
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT points FROM public.gamification_settings 
     WHERE company_id = _company_id AND event_type = _event_type),
    CASE _event_type
      WHEN 'lead_created' THEN 10
      WHEN 'lead_qualified' THEN 15
      WHEN 'proposal_sent' THEN 25
      WHEN 'sale_closed' THEN 100
      WHEN 'meeting_scheduled' THEN 20
      WHEN 'observation_added' THEN 3
      ELSE 0
    END
  );
$$;