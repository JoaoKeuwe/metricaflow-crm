import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export interface GamificationEvent {
  id: string;
  user_id: string;
  event_type: string;
  points: number;
  lead_id: string | null;
  created_at: string;
  metadata: {
    lead_name?: string;
    estimated_value?: number;
    observation_count?: number;
  } | null;
}

export function useGamificationEvents() {
  const [latestSale, setLatestSale] = useState<GamificationEvent | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("🎮 Iniciando listener de eventos de gamificação");

    const channel = supabase
      .channel("gamification-events-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gamification_events",
          filter: "event_type=eq.sale_closed",
        },
        (payload) => {
          console.log("🎉 Nova venda detectada!", payload);
          setLatestSale(payload.new as GamificationEvent);

          // Invalidar queries para atualizar ranking
          queryClient.invalidateQueries({ queryKey: ["gamification-leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["gamification-events"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gamification_events",
        },
        (payload) => {
          console.log("📊 Novo evento de gamificação:", payload);

          // Invalidar queries para atualizar estatísticas
          queryClient.invalidateQueries({ queryKey: ["gamification-leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["gamification-events"] });
        }
      )
      .subscribe();

    return () => {
      console.log("🔌 Desconectando listener de gamificação");
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const clearLatestSale = () => {
    setLatestSale(null);
  };

  return { latestSale, clearLatestSale };
}
