-- Adicionar campo de data de retorno agendado nas observações
ALTER TABLE public.lead_observations 
ADD COLUMN return_scheduled_date timestamp with time zone;

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX idx_lead_observations_return_date 
ON public.lead_observations(return_scheduled_date) 
WHERE return_scheduled_date IS NOT NULL;