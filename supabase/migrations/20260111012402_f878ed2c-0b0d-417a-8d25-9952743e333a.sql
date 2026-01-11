-- Trigger para criar report_settings padrão quando uma empresa é criada
CREATE OR REPLACE FUNCTION public.create_default_report_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.report_settings (
    company_id,
    daily_reports_enabled,
    daily_report_time,
    weekly_reports_enabled,
    weekly_report_day,
    weekly_report_time,
    ai_analysis_level,
    include_predictions,
    include_swot
  )
  VALUES (
    NEW.id,
    true,
    '18:00',
    true,
    5, -- Sexta-feira
    '18:00',
    'basic',
    false,
    false
  )
  ON CONFLICT (company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela companies
DROP TRIGGER IF EXISTS trigger_create_default_report_settings ON public.companies;
CREATE TRIGGER trigger_create_default_report_settings
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_report_settings();

-- Inserir configurações padrão para empresas existentes que não têm
INSERT INTO public.report_settings (
  company_id,
  daily_reports_enabled,
  daily_report_time,
  weekly_reports_enabled,
  weekly_report_day,
  weekly_report_time,
  ai_analysis_level,
  include_predictions,
  include_swot
)
SELECT 
  c.id,
  true,
  '18:00',
  true,
  5,
  '18:00',
  'basic',
  false,
  false
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.report_settings rs WHERE rs.company_id = c.id
);