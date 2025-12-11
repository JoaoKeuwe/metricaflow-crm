-- Create seller_kpi_monthly table for monthly goals and actuals
CREATE TABLE public.seller_kpi_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month (e.g., 2025-01-01)
  
  -- Targets
  target_revenue NUMERIC DEFAULT 0,
  target_deals INTEGER DEFAULT 0,
  target_calls INTEGER DEFAULT 0,
  target_meetings INTEGER DEFAULT 0,
  
  -- Actuals (updated automatically)
  actual_revenue NUMERIC DEFAULT 0,
  actual_deals INTEGER DEFAULT 0,
  actual_calls INTEGER DEFAULT 0,
  actual_meetings INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, user_id, month)
);

-- Create seller_kpi_feedback table
CREATE TABLE public.seller_kpi_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positivo', 'negativo', 'advertencia')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  month DATE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.seller_kpi_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_kpi_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_kpi_monthly
-- Managers/Owners can view all KPIs in their company
CREATE POLICY "Gestores e owners veem todos os KPIs da empresa"
ON public.seller_kpi_monthly
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Sellers can view only their own KPIs
CREATE POLICY "Vendedores veem apenas seus próprios KPIs"
ON public.seller_kpi_monthly
FOR SELECT
USING (
  user_id = auth.uid() 
  AND has_role(auth.uid(), 'vendedor'::app_role)
);

-- Managers/Owners can create KPIs
CREATE POLICY "Gestores e owners podem criar KPIs"
ON public.seller_kpi_monthly
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Managers/Owners can update KPIs
CREATE POLICY "Gestores e owners podem atualizar KPIs"
ON public.seller_kpi_monthly
FOR UPDATE
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Managers/Owners can delete KPIs
CREATE POLICY "Gestores e owners podem deletar KPIs"
ON public.seller_kpi_monthly
FOR DELETE
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- System can update KPIs (for triggers)
CREATE POLICY "Sistema pode atualizar KPIs"
ON public.seller_kpi_monthly
FOR UPDATE
USING (true)
WITH CHECK (true);

-- RLS Policies for seller_kpi_feedback
-- Managers/Owners can view all feedback in their company
CREATE POLICY "Gestores e owners veem todos os feedbacks da empresa"
ON public.seller_kpi_feedback
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Sellers can view only their own feedback
CREATE POLICY "Vendedores veem apenas seus próprios feedbacks"
ON public.seller_kpi_feedback
FOR SELECT
USING (
  user_id = auth.uid() 
  AND has_role(auth.uid(), 'vendedor'::app_role)
);

-- Managers/Owners can create feedback
CREATE POLICY "Gestores e owners podem criar feedbacks"
ON public.seller_kpi_feedback
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND created_by = auth.uid()
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Managers/Owners can update feedback
CREATE POLICY "Gestores e owners podem atualizar feedbacks"
ON public.seller_kpi_feedback
FOR UPDATE
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Managers/Owners can delete feedback
CREATE POLICY "Gestores e owners podem deletar feedbacks"
ON public.seller_kpi_feedback
FOR DELETE
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- Function to update KPI actuals when a lead is won
CREATE OR REPLACE FUNCTION public.update_kpi_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month DATE;
  v_company_id UUID;
  v_user_id UUID;
  v_value NUMERIC;
BEGIN
  -- Only trigger when status changes to 'ganho'
  IF NEW.status = 'ganho' AND (OLD.status IS NULL OR OLD.status != 'ganho') THEN
    v_month := date_trunc('month', now())::DATE;
    v_company_id := NEW.company_id;
    v_user_id := NEW.assigned_to;
    
    -- Get total value from lead_values
    SELECT COALESCE(SUM(amount), 0) INTO v_value
    FROM public.lead_values
    WHERE lead_id = NEW.id;
    
    -- If no lead_values, use estimated_value
    IF v_value = 0 THEN
      v_value := COALESCE(NEW.estimated_value, 0);
    END IF;
    
    -- Upsert KPI record
    INSERT INTO public.seller_kpi_monthly (company_id, user_id, month, actual_revenue, actual_deals)
    VALUES (v_company_id, v_user_id, v_month, v_value, 1)
    ON CONFLICT (company_id, user_id, month)
    DO UPDATE SET
      actual_revenue = seller_kpi_monthly.actual_revenue + v_value,
      actual_deals = seller_kpi_monthly.actual_deals + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for sales
CREATE TRIGGER trigger_update_kpi_on_sale
AFTER UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_kpi_on_sale();

-- Function to update KPI meetings when a meeting is created
CREATE OR REPLACE FUNCTION public.update_kpi_on_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month DATE;
BEGIN
  v_month := date_trunc('month', NEW.start_time)::DATE;
  
  -- Update for all participants
  INSERT INTO public.seller_kpi_monthly (company_id, user_id, month, actual_meetings)
  SELECT 
    NEW.company_id,
    mp.user_id,
    v_month,
    1
  FROM public.meeting_participants mp
  WHERE mp.meeting_id = NEW.id
  ON CONFLICT (company_id, user_id, month)
  DO UPDATE SET
    actual_meetings = seller_kpi_monthly.actual_meetings + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for meetings
CREATE TRIGGER trigger_update_kpi_on_meeting
AFTER INSERT ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_kpi_on_meeting();

-- Add indexes for performance
CREATE INDEX idx_seller_kpi_monthly_company_month ON public.seller_kpi_monthly(company_id, month);
CREATE INDEX idx_seller_kpi_monthly_user_month ON public.seller_kpi_monthly(user_id, month);
CREATE INDEX idx_seller_kpi_feedback_company_month ON public.seller_kpi_feedback(company_id, month);
CREATE INDEX idx_seller_kpi_feedback_user ON public.seller_kpi_feedback(user_id);