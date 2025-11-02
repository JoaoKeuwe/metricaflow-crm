-- Fase 1: Adicionar avatar_url à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Fase 2: Criar tabela de eventos de gamificação
CREATE TABLE IF NOT EXISTS public.gamification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  points integer NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb
);

-- Habilitar RLS
ALTER TABLE public.gamification_events ENABLE ROW LEVEL SECURITY;

-- Policy para visualização (usuários da mesma empresa)
CREATE POLICY "Users can view events from their company"
ON public.gamification_events FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles 
    WHERE company_id = get_user_company_id()
  )
);

-- Policy para inserção (sistema)
CREATE POLICY "System can insert events"
ON public.gamification_events FOR INSERT
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_gamification_events_user_id ON public.gamification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_events_created_at ON public.gamification_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_events_event_type ON public.gamification_events(event_type);

-- Fase 3: Função para registrar eventos de gamificação
CREATE OR REPLACE FUNCTION public.log_gamification_event()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  points_earned integer;
  event_type_text text;
  observation_count integer;
BEGIN
  -- Eventos de leads
  IF TG_TABLE_NAME = 'leads' THEN
    IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
      event_type_text := 'lead_created';
      points_earned := 10;
      
      INSERT INTO public.gamification_events (user_id, event_type, points, lead_id, metadata)
      VALUES (
        NEW.assigned_to,
        event_type_text,
        points_earned,
        NEW.id,
        jsonb_build_object('lead_name', NEW.name)
      );
      
    ELSIF TG_OP = 'UPDATE' AND NEW.assigned_to IS NOT NULL THEN
      -- Venda fechada (apenas na primeira transição)
      IF NEW.status = 'ganho' AND OLD.status != 'ganho' THEN
        event_type_text := 'sale_closed';
        points_earned := 100 + COALESCE(FLOOR(COALESCE(NEW.estimated_value, 0) / 1000), 0);
        
        INSERT INTO public.gamification_events (user_id, event_type, points, lead_id, metadata)
        VALUES (
          NEW.assigned_to,
          event_type_text,
          points_earned,
          NEW.id,
          jsonb_build_object(
            'lead_name', NEW.name, 
            'estimated_value', COALESCE(NEW.estimated_value, 0)
          )
        );
        
      -- Proposta enviada (apenas na primeira transição)
      ELSIF NEW.status = 'proposta' AND OLD.status != 'proposta' THEN
        event_type_text := 'proposal_sent';
        points_earned := 25;
        
        INSERT INTO public.gamification_events (user_id, event_type, points, lead_id, metadata)
        VALUES (
          NEW.assigned_to,
          event_type_text,
          points_earned,
          NEW.id,
          jsonb_build_object('lead_name', NEW.name)
        );
      END IF;
    END IF;
    
  -- Eventos de observações (com limite anti-spam)
  ELSIF TG_TABLE_NAME = 'lead_observations' THEN
    -- Contar observações do usuário neste lead nas últimas 24h
    SELECT COUNT(*) INTO observation_count
    FROM public.lead_observations
    WHERE user_id = NEW.user_id
      AND lead_id = NEW.lead_id
      AND created_at > now() - INTERVAL '24 hours';
    
    -- Apenas dar pontos se tiver menos de 5 observações nas últimas 24h
    IF observation_count <= 5 THEN
      event_type_text := 'observation_added';
      points_earned := 3;
      
      INSERT INTO public.gamification_events (user_id, event_type, points, lead_id, metadata)
      VALUES (
        NEW.user_id,
        event_type_text,
        points_earned,
        NEW.lead_id,
        jsonb_build_object('observation_count', observation_count)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para leads
DROP TRIGGER IF EXISTS gamification_on_lead_change ON public.leads;
CREATE TRIGGER gamification_on_lead_change
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.log_gamification_event();

-- Trigger para observações
DROP TRIGGER IF EXISTS gamification_on_observation ON public.lead_observations;
CREATE TRIGGER gamification_on_observation
AFTER INSERT ON public.lead_observations
FOR EACH ROW
EXECUTE FUNCTION public.log_gamification_event();

-- Fase 4: Configurar Storage bucket para avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para avatares
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Habilitar realtime para gamification_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.gamification_events;