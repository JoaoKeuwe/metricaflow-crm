-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.meeting_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'invited', 'reminder', 'updated', 'cancelled'
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id, notification_type)
);

-- Habilitar RLS
ALTER TABLE public.meeting_notifications ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias notificações
CREATE POLICY "Users can view their own notifications"
ON public.meeting_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Política para criar notificações (sistema)
CREATE POLICY "System can create notifications"
ON public.meeting_notifications
FOR INSERT
WITH CHECK (true);

-- Política para marcar como lida
CREATE POLICY "Users can update their own notifications"
ON public.meeting_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_meeting_notifications_user_id ON public.meeting_notifications(user_id);
CREATE INDEX idx_meeting_notifications_meeting_id ON public.meeting_notifications(meeting_id);
CREATE INDEX idx_meeting_notifications_read ON public.meeting_notifications(read) WHERE read = false;

-- Função para criar notificações quando uma reunião é criada
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar notificações automaticamente
CREATE TRIGGER trigger_create_meeting_notifications
AFTER INSERT ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.create_meeting_notifications();