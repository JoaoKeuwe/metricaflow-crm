-- Adicionar campo qualificado na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS qualificado BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.leads.qualificado IS 'Indica se o lead foi qualificado como SQL';

-- Adicionar campo motivo_perda na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS motivo_perda TEXT;

COMMENT ON COLUMN public.leads.motivo_perda IS 'Motivo da perda do lead quando status = perdido';

-- Criar índice para melhorar performance de queries por qualificado
CREATE INDEX IF NOT EXISTS idx_leads_qualificado ON public.leads(qualificado) WHERE qualificado = true;

-- Criar índice para melhorar performance de queries por motivo_perda
CREATE INDEX IF NOT EXISTS idx_leads_motivo_perda ON public.leads(motivo_perda) WHERE motivo_perda IS NOT NULL;