-- Corrigir search_path na função
CREATE OR REPLACE FUNCTION public.create_meeting_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar notificação para todos os participantes
  INSERT INTO public.meeting_notifications (meeting_id, user_id, notification_type)
  SELECT 
    NEW.id,
    mp.user_id,
    'invited'
  FROM public.meeting_participants mp
  WHERE mp.meeting_id = NEW.id
  ON CONFLICT (meeting_id, user_id, notification_type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;