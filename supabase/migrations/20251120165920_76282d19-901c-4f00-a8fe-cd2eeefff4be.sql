-- Create helper function to create API tokens safely
CREATE OR REPLACE FUNCTION public.create_api_token(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_token text;
BEGIN
  -- Validar nome
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Nome do token é obrigatório';
  END IF;

  -- Verificar permissão (apenas gestores e owners)
  IF NOT (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role)) THEN
    RAISE EXCEPTION 'Você não tem permissão para criar tokens de API';
  END IF;

  -- Obter empresa do usuário logado
  v_company_id := get_user_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível identificar a empresa do usuário';
  END IF;

  -- Gerar token utilizando função segura existente
  v_token := generate_api_token();

  -- Inserir token associado à empresa do usuário
  INSERT INTO public.api_tokens (company_id, token, name)
  VALUES (v_company_id, v_token, p_name);

  RETURN v_token;
END;
$$;