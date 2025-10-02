-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(_user_id, 'gestor_owner')
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE role
      WHEN 'gestor_owner' THEN 1
      WHEN 'gestor' THEN 2
      WHEN 'vendedor' THEN 3
    END
  LIMIT 1
$$;

-- Update handle_new_user function to create owner on first signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
  v_role public.app_role;
BEGIN
  -- Check if this is a new company owner or an invited user
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'gestor_owner');
  
  -- If no company_id, create new company (first signup = owner)
  IF v_company_id IS NULL THEN
    v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa');
    
    INSERT INTO public.companies (name, owner_id)
    VALUES (v_company_name, NEW.id)
    RETURNING id INTO v_company_id;
    
    v_role := 'gestor_owner';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, company_id, name, role)
  VALUES (
    NEW.id,
    v_company_id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    v_role
  );
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role);
  
  RETURN NEW;
END;
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Owners can view all roles in company"
ON public.user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = user_roles.user_id
    )
    AND is_owner(auth.uid())
  )
);

CREATE POLICY "Owners can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owners can update roles"
ON public.user_roles FOR UPDATE
USING (is_owner(auth.uid()));

CREATE POLICY "Owners can delete roles (except their own)"
ON public.user_roles FOR DELETE
USING (is_owner(auth.uid()) AND user_id != auth.uid());

-- RLS Policies for invites
CREATE POLICY "Owners and gestores can view invites"
ON public.invites FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'))
);

CREATE POLICY "Owners and gestores can create invites"
ON public.invites FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'))
);

CREATE POLICY "Owners can delete invites"
ON public.invites FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND is_owner(auth.uid())
);

-- RLS Policies for ownership_transfers
CREATE POLICY "Owners can view transfers"
ON public.ownership_transfers FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND is_owner(auth.uid())
);

CREATE POLICY "Owners can create transfers"
ON public.ownership_transfers FOR INSERT
WITH CHECK (is_owner(auth.uid()));

-- Update existing RLS policies for leads to use new role system
DROP POLICY IF EXISTS "Gestores veem todos os leads da empresa" ON public.leads;
DROP POLICY IF EXISTS "Vendedores veem apenas seus leads" ON public.leads;
DROP POLICY IF EXISTS "Gestores podem atualizar leads da empresa" ON public.leads;
DROP POLICY IF EXISTS "Vendedores podem atualizar seus próprios leads" ON public.leads;
DROP POLICY IF EXISTS "Gestores podem criar leads" ON public.leads;

CREATE POLICY "Owners and gestores can view all company leads"
ON public.leads FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'))
);

CREATE POLICY "Vendedores can view their assigned leads"
ON public.leads FOR SELECT
USING (
  assigned_to = auth.uid() AND has_role(auth.uid(), 'vendedor')
);

CREATE POLICY "Owners and gestores can update company leads"
ON public.leads FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'))
);

CREATE POLICY "Vendedores can update their assigned leads"
ON public.leads FOR UPDATE
USING (
  assigned_to = auth.uid() AND has_role(auth.uid(), 'vendedor')
);

CREATE POLICY "Owners and gestores can create leads"
ON public.leads FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'))
);

-- Update companies RLS
DROP POLICY IF EXISTS "Usuários podem ver sua própria empresa" ON public.companies;

CREATE POLICY "Users can view their company"
ON public.companies FOR SELECT
USING (
  id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Owners can update their company"
ON public.companies FOR UPDATE
USING (owner_id = auth.uid());