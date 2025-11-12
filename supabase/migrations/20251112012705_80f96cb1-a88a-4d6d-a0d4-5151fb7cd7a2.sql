-- Criar tabela de metas de vendas
CREATE TABLE IF NOT EXISTS public.sales_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Metas
  leads_goal INTEGER DEFAULT 0,
  conversions_goal INTEGER DEFAULT 0,
  revenue_goal DECIMAL DEFAULT 0,
  observations_goal INTEGER DEFAULT 0,
  tasks_goal INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  
  UNIQUE(user_id, period_type, start_date)
);

-- Habilitar RLS
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sales_goals
CREATE POLICY "Gestores e owners podem ver metas da empresa"
  ON public.sales_goals FOR SELECT
  USING (
    company_id = get_user_company_id() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Vendedores podem ver suas próprias metas"
  ON public.sales_goals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Gestores e owners podem criar metas"
  ON public.sales_goals FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id() AND
    created_by = auth.uid() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Gestores e owners podem atualizar metas"
  ON public.sales_goals FOR UPDATE
  USING (
    company_id = get_user_company_id() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Gestores e owners podem deletar metas"
  ON public.sales_goals FOR DELETE
  USING (
    company_id = get_user_company_id() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

-- Criar tabela de cache de insights da IA
CREATE TABLE IF NOT EXISTS public.ai_report_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  report_date DATE NOT NULL,
  
  -- Dados gerados pela IA
  summary TEXT,
  highlights JSONB,
  attention_points JSONB,
  suggested_actions JSONB,
  motivation TEXT,
  strategic_analysis TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, report_type, report_date)
);

-- Habilitar RLS
ALTER TABLE public.ai_report_insights ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ai_report_insights
CREATE POLICY "Gestores e owners podem ver insights da empresa"
  ON public.ai_report_insights FOR SELECT
  USING (
    company_id = get_user_company_id() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Vendedores podem ver seus próprios insights"
  ON public.ai_report_insights FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sistema pode criar insights"
  ON public.ai_report_insights FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

-- Índices para performance
CREATE INDEX idx_sales_goals_user_period ON public.sales_goals(user_id, period_type, start_date);
CREATE INDEX idx_sales_goals_company ON public.sales_goals(company_id);
CREATE INDEX idx_ai_insights_user_date ON public.ai_report_insights(user_id, report_date);
CREATE INDEX idx_ai_insights_company ON public.ai_report_insights(company_id);

-- Criar tabela de configuração de relatórios
CREATE TABLE IF NOT EXISTS public.report_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Configurações de envio
  daily_reports_enabled BOOLEAN DEFAULT true,
  daily_report_time TIME DEFAULT '19:00:00',
  weekly_reports_enabled BOOLEAN DEFAULT true,
  weekly_report_day INTEGER DEFAULT 1 CHECK (weekly_report_day BETWEEN 0 AND 6), -- 0 = domingo
  weekly_report_time TIME DEFAULT '09:00:00',
  
  -- Destinatários extras (além dos gestores)
  extra_recipients TEXT[],
  
  -- Configurações da IA
  ai_analysis_level TEXT DEFAULT 'detailed' CHECK (ai_analysis_level IN ('basic', 'detailed')),
  include_swot BOOLEAN DEFAULT true,
  include_predictions BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Habilitar RLS
ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para report_settings
CREATE POLICY "Gestores e owners podem ver configurações"
  ON public.report_settings FOR SELECT
  USING (
    company_id = get_user_company_id() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

CREATE POLICY "Gestores e owners podem atualizar configurações"
  ON public.report_settings FOR ALL
  USING (
    company_id = get_user_company_id() AND
    (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_report_settings_updated_at
  BEFORE UPDATE ON public.report_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();