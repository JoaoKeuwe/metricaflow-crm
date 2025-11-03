-- Atualizar função de log de eventos de gamificação para usar configurações customizadas
CREATE OR REPLACE FUNCTION public.log_gamification_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  points_earned integer;
  event_type_text text;
  observation_count integer;
  company_id_var uuid;
BEGIN
  -- Eventos de leads
  IF TG_TABLE_NAME = 'leads' THEN
    company_id_var := NEW.company_id;
    
    IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
      event_type_text := 'lead_created';
      points_earned := get_gamification_points(company_id_var, event_type_text);
      
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
        -- Pontos base + 1 ponto por cada R$ 1.000
        points_earned := get_gamification_points(company_id_var, event_type_text) + 
                        COALESCE(FLOOR(COALESCE(NEW.estimated_value, 0) / 1000), 0);
        
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
        points_earned := get_gamification_points(company_id_var, event_type_text);
        
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
    -- Buscar company_id do lead
    SELECT l.company_id INTO company_id_var
    FROM public.leads l
    WHERE l.id = NEW.lead_id;
    
    -- Contar observações do usuário neste lead nas últimas 24h
    SELECT COUNT(*) INTO observation_count
    FROM public.lead_observations
    WHERE user_id = NEW.user_id
      AND lead_id = NEW.lead_id
      AND created_at > now() - INTERVAL '24 hours';
    
    -- Apenas dar pontos se tiver menos de 5 observações nas últimas 24h
    IF observation_count <= 5 THEN
      event_type_text := 'observation_added';
      points_earned := get_gamification_points(company_id_var, event_type_text);
      
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
$function$;