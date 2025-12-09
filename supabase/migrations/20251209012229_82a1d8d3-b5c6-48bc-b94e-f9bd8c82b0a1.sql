
-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Recreate super admin policy using the existing secure function
-- The is_super_admin() function already uses SECURITY DEFINER to avoid recursion
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_super_admin());

-- Also fix the user update policy that has a recursive subquery
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
