-- Add new fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(10,2);

-- Add note_type to lead_observations
ALTER TABLE public.lead_observations 
ADD COLUMN IF NOT EXISTS note_type TEXT NOT NULL DEFAULT 'Contato feito';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lead_observations_lead_id ON public.lead_observations(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);