-- FASE 1: Corrigir estrutura de lembretes e tarefas

-- 1. Permitir lembretes sem lead vinculado (tornar lead_id nullable)
ALTER TABLE public.reminders 
ALTER COLUMN lead_id DROP NOT NULL;

-- 2. Adicionar trigger para atualizar updated_at em tasks
CREATE TRIGGER update_tasks_updated_at 
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();