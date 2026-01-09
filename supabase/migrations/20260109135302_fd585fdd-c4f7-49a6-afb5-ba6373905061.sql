-- Fix permissive RLS policies detected by security linter

-- 1. Fix gamification_events INSERT policy
DROP POLICY IF EXISTS "System can insert events" ON public.gamification_events;
CREATE POLICY "System can insert events" ON public.gamification_events
FOR INSERT WITH CHECK (
  user_id IN (
    SELECT id FROM profiles WHERE company_id = get_user_company_id()
  )
);

-- 2. Fix meeting_notifications INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.meeting_notifications;
CREATE POLICY "System can create notifications" ON public.meeting_notifications
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM meetings m 
    WHERE m.id = meeting_id 
    AND m.company_id = get_user_company_id()
    AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  )
);

-- 3. Fix seller_kpi_monthly UPDATE policy (Sistema pode atualizar KPIs)
DROP POLICY IF EXISTS "Sistema pode atualizar KPIs" ON public.seller_kpi_monthly;
CREATE POLICY "Sistema pode atualizar KPIs" ON public.seller_kpi_monthly
FOR UPDATE USING (
  company_id = get_user_company_id()
  AND (
    is_owner(auth.uid()) 
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'gestor_owner'::app_role)
  )
) WITH CHECK (
  company_id = get_user_company_id()
  AND (
    is_owner(auth.uid()) 
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'gestor_owner'::app_role)
  )
);