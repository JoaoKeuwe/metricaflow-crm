-- Create task_assignments table for multiple assignments
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Add new fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN assignment_type TEXT NOT NULL DEFAULT 'individual' CHECK (assignment_type IN ('individual', 'todos')),
ADD COLUMN total_assigned INTEGER DEFAULT 1,
ADD COLUMN total_completed INTEGER DEFAULT 0;

-- Enable RLS on task_assignments
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_assignments

-- Vendedores veem apenas suas atribuições
CREATE POLICY "Vendedores veem suas atribuições"
ON public.task_assignments
FOR SELECT
USING (
  user_id = auth.uid() 
  AND get_user_role() = 'vendedor'::app_role
);

-- Gestores e owners veem todas as atribuições da empresa
CREATE POLICY "Gestores veem todas atribuições da empresa"
ON public.task_assignments
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND (get_user_role() = 'gestor'::app_role OR get_user_role() = 'gestor_owner'::app_role)
);

-- Vendedores podem atualizar apenas seu status
CREATE POLICY "Vendedores atualizam seu status"
ON public.task_assignments
FOR UPDATE
USING (
  user_id = auth.uid() 
  AND get_user_role() = 'vendedor'::app_role
)
WITH CHECK (
  user_id = auth.uid() 
  AND get_user_role() = 'vendedor'::app_role
);

-- Gestores podem atualizar qualquer atribuição da empresa
CREATE POLICY "Gestores atualizam atribuições"
ON public.task_assignments
FOR UPDATE
USING (
  company_id = get_user_company_id() 
  AND (get_user_role() = 'gestor'::app_role OR get_user_role() = 'gestor_owner'::app_role)
);

-- Apenas gestores podem criar atribuições
CREATE POLICY "Gestores criam atribuições"
ON public.task_assignments
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND (get_user_role() = 'gestor'::app_role OR get_user_role() = 'gestor_owner'::app_role)
);

-- Apenas gestores podem deletar atribuições
CREATE POLICY "Gestores deletam atribuições"
ON public.task_assignments
FOR DELETE
USING (
  company_id = get_user_company_id() 
  AND (get_user_role() = 'gestor'::app_role OR get_user_role() = 'gestor_owner'::app_role)
);

-- Trigger function to update task progress when assignment is completed
CREATE OR REPLACE FUNCTION public.update_task_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_completed count
  UPDATE public.tasks
  SET total_completed = (
    SELECT COUNT(*) 
    FROM public.task_assignments 
    WHERE task_id = NEW.task_id AND status = 'concluida'
  )
  WHERE id = NEW.task_id;
  
  -- If all assignments are completed, update task status
  UPDATE public.tasks
  SET status = 'concluida'
  WHERE id = NEW.task_id 
  AND total_assigned = total_completed
  AND status != 'concluida';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER task_assignment_completed
AFTER UPDATE OF status ON public.task_assignments
FOR EACH ROW
WHEN (NEW.status = 'concluida' AND OLD.status != 'concluida')
EXECUTE FUNCTION public.update_task_progress();

-- Create index for better performance
CREATE INDEX idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON public.task_assignments(user_id);
CREATE INDEX idx_task_assignments_company_id ON public.task_assignments(company_id);