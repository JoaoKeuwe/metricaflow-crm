-- Remover trigger antigo
DROP TRIGGER IF EXISTS trigger_create_meeting_notifications ON public.meetings;

-- Criar trigger nos participantes em vez de na reunião
CREATE OR REPLACE FUNCTION public.create_participant_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar notificação para o participante quando ele é adicionado
  INSERT INTO public.meeting_notifications (meeting_id, user_id, notification_type)
  VALUES (NEW.meeting_id, NEW.user_id, 'invited')
  ON CONFLICT (meeting_id, user_id, notification_type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar notificações quando participante é adicionado
CREATE TRIGGER trigger_create_participant_notification
AFTER INSERT ON public.meeting_participants
FOR EACH ROW
EXECUTE FUNCTION public.create_participant_notification();