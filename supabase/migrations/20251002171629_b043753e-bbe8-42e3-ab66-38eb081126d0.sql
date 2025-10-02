-- Fix update_updated_at_column function to include search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add missing DELETE policies

-- Leads: Only owners and gestores can delete
CREATE POLICY "Owners and gestores can delete leads"
ON public.leads FOR DELETE
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'))
);

-- Profiles: Only owners can delete (cannot delete own profile)
CREATE POLICY "Owners can delete profiles"
ON public.profiles FOR DELETE
USING (
  is_owner(auth.uid()) 
  AND company_id = get_user_company_id()
  AND id != auth.uid()
);

-- Companies: Prevent deletion entirely (protect data integrity)
CREATE POLICY "Companies cannot be deleted"
ON public.companies FOR DELETE
USING (false);

-- Tasks: Gestores and creators can delete
CREATE POLICY "Gestores and creators can delete tasks"
ON public.tasks FOR DELETE
USING (
  (company_id = get_user_company_id() AND get_user_role() = 'gestor')
  OR created_by = auth.uid()
);

-- Reminders: Only creator can delete
CREATE POLICY "Users can delete their own reminders"
ON public.reminders FOR DELETE
USING (user_id = auth.uid());

-- Lead Observations: Make immutable (audit trail)
CREATE POLICY "Lead observations are immutable"
ON public.lead_observations FOR DELETE
USING (false);

-- Add missing UPDATE policies

-- Invites: Only owners can update
CREATE POLICY "Owners can update invites"
ON public.invites FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND is_owner(auth.uid())
);

-- Lead Observations: Make immutable
CREATE POLICY "Lead observations are immutable for updates"
ON public.lead_observations FOR UPDATE
USING (false);

-- Ownership Transfers: Make immutable (audit trail)
CREATE POLICY "Ownership transfers are immutable for updates"
ON public.ownership_transfers FOR UPDATE
USING (false);