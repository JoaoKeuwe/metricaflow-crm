-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Gestores e owners podem criar custos" ON public.marketing_costs;

-- Create new INSERT policy that includes gestor_owner role
CREATE POLICY "Gestores e owners podem criar custos" ON public.marketing_costs
FOR INSERT WITH CHECK (
  company_id = get_user_company_id() 
  AND created_by = auth.uid() 
  AND (
    is_owner(auth.uid()) 
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'gestor_owner'::app_role)
  )
);

-- Also fix UPDATE policy to include gestor_owner
DROP POLICY IF EXISTS "Gestores e owners podem atualizar custos" ON public.marketing_costs;

CREATE POLICY "Gestores e owners podem atualizar custos" ON public.marketing_costs
FOR UPDATE USING (
  company_id = get_user_company_id() 
  AND (
    is_owner(auth.uid()) 
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'gestor_owner'::app_role)
  )
);

-- Fix SELECT policy to include gestor_owner
DROP POLICY IF EXISTS "Gestores e owners podem ver custos da empresa" ON public.marketing_costs;

CREATE POLICY "Gestores e owners podem ver custos da empresa" ON public.marketing_costs
FOR SELECT USING (
  company_id = get_user_company_id() 
  AND (
    is_owner(auth.uid()) 
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'gestor_owner'::app_role)
  )
);

-- Fix DELETE policy to include gestor_owner
DROP POLICY IF EXISTS "Owners podem deletar custos" ON public.marketing_costs;

CREATE POLICY "Owners podem deletar custos" ON public.marketing_costs
FOR DELETE USING (
  company_id = get_user_company_id() 
  AND (
    is_owner(auth.uid())
    OR has_role(auth.uid(), 'gestor_owner'::app_role)
  )
);