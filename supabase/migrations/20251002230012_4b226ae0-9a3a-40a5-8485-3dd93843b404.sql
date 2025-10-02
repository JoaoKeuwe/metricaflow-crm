-- ============================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- ============================================

-- 1.1 Add INSERT Policy to companies table
CREATE POLICY "Only authenticated users creating their first company via trigger"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.companies WHERE owner_id = auth.uid()
  )
);

-- 1.2 Lead Assignment Validation Function
CREATE OR REPLACE FUNCTION public.validate_lead_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure assigned_to user is in the same company
  IF NEW.assigned_to IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = NEW.assigned_to 
      AND company_id = NEW.company_id
      AND active = true
    ) THEN
      RAISE EXCEPTION 'Cannot assign lead to user from different company or inactive user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger for lead assignment validation
DROP TRIGGER IF EXISTS validate_lead_assignment_trigger ON public.leads;
CREATE TRIGGER validate_lead_assignment_trigger
BEFORE INSERT OR UPDATE OF assigned_to ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.validate_lead_assignment();

-- 1.3 Lead Access Audit Logging
CREATE TABLE IF NOT EXISTS public.lead_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'update', 'export', 'delete', 'reassign')),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lead_access_log_lead_id ON public.lead_access_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_access_log_user_id ON public.lead_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_access_log_accessed_at ON public.lead_access_log(accessed_at DESC);

-- Enable RLS
ALTER TABLE public.lead_access_log ENABLE ROW LEVEL SECURITY;

-- Only owners and gestores can view audit logs
CREATE POLICY "Owners and gestores can view audit logs"
ON public.lead_access_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE l.id = lead_access_log.lead_id
    AND l.company_id = p.company_id
    AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.lead_access_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());