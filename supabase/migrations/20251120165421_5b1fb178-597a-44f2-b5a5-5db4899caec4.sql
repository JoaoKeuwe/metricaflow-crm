-- Drop the old policy that causes recursion
DROP POLICY IF EXISTS "Usuários podem ver perfis da mesma empresa" ON public.profiles;

-- Create new policy that breaks the recursion by checking own profile first
CREATE POLICY "Usuários podem ver perfis da mesma empresa"
ON public.profiles
FOR SELECT
USING (id = auth.uid() OR company_id = get_user_company_id());