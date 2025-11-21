-- Fix SECURITY DEFINER functions with proper access validation

-- 1. Update has_role() to validate caller permissions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validação: usuário só pode verificar seu próprio role ou owner pode verificar qualquer role
  IF auth.uid() != _user_id AND NOT is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Não autorizado a verificar roles de outros usuários';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- 2. Update get_user_role() overload with validation
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validação: usuário só pode verificar seu próprio role ou owner pode verificar qualquer role
  IF auth.uid() != _user_id AND NOT is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Não autorizado a verificar roles de outros usuários';
  END IF;

  RETURN (
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
  );
END;
$$;