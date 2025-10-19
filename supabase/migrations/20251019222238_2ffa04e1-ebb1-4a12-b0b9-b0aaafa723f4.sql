-- Criar função otimizada para buscar leads com atividades futuras agregadas
CREATE OR REPLACE FUNCTION get_leads_with_future_activities(
  p_company_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  assigned_to UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  estimated_value NUMERIC,
  name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  company TEXT,
  source TEXT,
  profile_name TEXT,
  future_activities_count BIGINT,
  has_future_activity BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.company_id,
    l.assigned_to,
    l.created_at,
    l.updated_at,
    l.estimated_value,
    l.name,
    l.email,
    l.phone,
    l.status,
    l.company,
    l.source,
    p.name as profile_name,
    COALESCE(
      (SELECT COUNT(*) FROM meetings m 
       WHERE m.lead_id = l.id 
       AND m.start_time > p_start_date 
       AND m.start_time < p_end_date
       AND m.status != 'cancelada'),
      0
    ) + COALESCE(
      (SELECT COUNT(*) FROM reminders r 
       WHERE r.lead_id = l.id 
       AND r.reminder_date > p_start_date 
       AND r.reminder_date < p_end_date
       AND r.completed = false),
      0
    ) + COALESCE(
      (SELECT COUNT(*) FROM tasks t 
       WHERE t.lead_id = l.id 
       AND t.due_date > p_start_date 
       AND t.due_date < p_end_date
       AND t.status != 'concluida'),
      0
    ) as future_activities_count,
    (
      EXISTS (SELECT 1 FROM meetings m 
              WHERE m.lead_id = l.id 
              AND m.start_time > p_start_date 
              AND m.start_time < p_end_date
              AND m.status != 'cancelada')
      OR EXISTS (SELECT 1 FROM reminders r 
                 WHERE r.lead_id = l.id 
                 AND r.reminder_date > p_start_date 
                 AND r.reminder_date < p_end_date
                 AND r.completed = false)
      OR EXISTS (SELECT 1 FROM tasks t 
                 WHERE t.lead_id = l.id 
                 AND t.due_date > p_start_date 
                 AND t.due_date < p_end_date
                 AND t.status != 'concluida')
    ) as has_future_activity
  FROM leads l
  LEFT JOIN profiles p ON l.assigned_to = p.id
  WHERE l.company_id = p_company_id
  ORDER BY l.created_at DESC;
END;
$$;

-- Criar índices compostos para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_meetings_lead_future 
ON meetings(lead_id, start_time) 
WHERE status != 'cancelada';

CREATE INDEX IF NOT EXISTS idx_reminders_lead_future 
ON reminders(lead_id, reminder_date) 
WHERE completed = false;

CREATE INDEX IF NOT EXISTS idx_tasks_lead_future 
ON tasks(lead_id, due_date) 
WHERE status != 'concluida';

CREATE INDEX IF NOT EXISTS idx_leads_company_status 
ON leads(company_id, status, updated_at);