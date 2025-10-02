-- Corrigir política de INSERT na tabela lead_observations
DROP POLICY IF EXISTS "Usuários podem criar observações em leads que têm acesso" ON public.lead_observations;

-- Criar nova política mais simples e funcional
CREATE POLICY "Usuários podem criar observações em leads acessíveis"
ON public.lead_observations
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 
    FROM public.leads l
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE l.id = lead_observations.lead_id
    AND l.company_id = p.company_id
    AND (
      -- Gestor ou owner pode adicionar nota em qualquer lead da empresa
      p.role IN ('gestor', 'gestor_owner')
      OR 
      -- Vendedor pode adicionar nota apenas em seus leads
      (p.role = 'vendedor' AND l.assigned_to = auth.uid())
    )
  )
);
