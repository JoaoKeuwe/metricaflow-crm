-- Criar tabela de valores múltiplos para leads
CREATE TABLE IF NOT EXISTS public.lead_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('unico', 'recorrente')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_values_lead_id ON public.lead_values(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_values_company_id ON public.lead_values(company_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_lead_values_updated_at
  BEFORE UPDATE ON public.lead_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.lead_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies para SELECT
CREATE POLICY "Gestores e owners veem valores da empresa"
  ON public.lead_values FOR SELECT
  USING (
    company_id = get_user_company_id() 
    AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Vendedores veem valores de seus leads"
  ON public.lead_values FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE assigned_to = auth.uid()
    )
  );

-- RLS Policies para INSERT
CREATE POLICY "Gestores e owners criam valores"
  ON public.lead_values FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id() 
    AND created_by = auth.uid()
    AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Vendedores criam valores em seus leads"
  ON public.lead_values FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND lead_id IN (
      SELECT id FROM public.leads 
      WHERE assigned_to = auth.uid()
    )
  );

-- RLS Policies para UPDATE
CREATE POLICY "Gestores e owners atualizam valores"
  ON public.lead_values FOR UPDATE
  USING (
    company_id = get_user_company_id() 
    AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Vendedores atualizam valores de seus leads"
  ON public.lead_values FOR UPDATE
  USING (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE assigned_to = auth.uid()
    )
  );

-- RLS Policies para DELETE
CREATE POLICY "Gestores e owners deletam valores"
  ON public.lead_values FOR DELETE
  USING (
    company_id = get_user_company_id() 
    AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Vendedores deletam valores de seus leads"
  ON public.lead_values FOR DELETE
  USING (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE assigned_to = auth.uid()
    )
  );

-- Migrar dados existentes de estimated_value para lead_values
INSERT INTO public.lead_values (lead_id, company_id, name, value_type, amount, created_by)
SELECT 
  l.id,
  l.company_id,
  'Valor Estimado' as name,
  'unico' as value_type,
  l.estimated_value,
  l.assigned_to
FROM public.leads l
WHERE l.estimated_value IS NOT NULL
  AND l.estimated_value > 0
ON CONFLICT DO NOTHING;

-- Adicionar comentário explicando que estimated_value está deprecated
COMMENT ON COLUMN public.leads.estimated_value IS 'Deprecated - use lead_values table instead. Kept for backward compatibility.';