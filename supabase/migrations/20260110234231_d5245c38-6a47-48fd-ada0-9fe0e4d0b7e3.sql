-- 1. Popular task_assignments com tarefas individuais existentes
INSERT INTO task_assignments (task_id, user_id, company_id, status, created_at)
SELECT 
  id as task_id,
  assigned_to as user_id,
  company_id,
  CASE WHEN status = 'concluida' THEN 'concluida' ELSE 'pendente' END as status,
  created_at
FROM tasks
WHERE assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM task_assignments ta WHERE ta.task_id = tasks.id AND ta.user_id = tasks.assigned_to
  );

-- 2. Atualizar total_assigned para tarefas individuais
UPDATE tasks 
SET total_assigned = 1 
WHERE assignment_type = 'individual' 
  AND (total_assigned IS NULL OR total_assigned = 0);

-- 3. Criar função trigger para auto-criar assignments
CREATE OR REPLACE FUNCTION public.create_task_assignment_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignment_type = 'individual' AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO task_assignments (task_id, user_id, company_id, status)
    VALUES (NEW.id, NEW.assigned_to, NEW.company_id, 'pendente')
    ON CONFLICT DO NOTHING;
    
    NEW.total_assigned := 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Criar trigger
DROP TRIGGER IF EXISTS trigger_create_task_assignment ON tasks;
CREATE TRIGGER trigger_create_task_assignment
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_task_assignment_on_insert();

-- 5. Adicionar policy para vendedores criarem atribuições para si mesmos
CREATE POLICY "Vendedores criam atribuições para si"
  ON task_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND company_id = get_user_company_id()
    AND get_user_role() = 'vendedor'::app_role
  );