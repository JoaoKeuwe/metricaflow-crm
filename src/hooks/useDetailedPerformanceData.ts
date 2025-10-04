import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DateRange {
  start: string;
  end: string;
}

export const useDetailedPerformanceData = (
  dateRange: DateRange,
  profileRole?: string
) => {
  return useQuery({
    queryKey: ["sales-performance-detailed", dateRange, profileRole],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      if (profileRole === "vendedor") {
        return [];
      }

      // Buscar leads com informações do vendedor
      const { data: leads } = await supabase
        .from("leads")
        .select("id, assigned_to, status, profiles(name), created_at, updated_at")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      // Buscar observações de todos os leads
      const leadIds = leads?.map((l) => l.id) || [];
      const { data: observations } = await supabase
        .from("lead_observations")
        .select("lead_id, user_id")
        .in("lead_id", leadIds);

      const salesStats: Record<
        string,
        {
          leads: number;
          convertidos: number;
          name: string;
          observacoes: number;
          tempoTotal: number;
          countFechados: number;
        }
      > = {};

      leads?.forEach((lead: any) => {
        const vendedorId = lead.assigned_to;
        if (!vendedorId) return;

        if (!salesStats[vendedorId]) {
          salesStats[vendedorId] = {
            leads: 0,
            convertidos: 0,
            name: lead.profiles?.name || "Sem vendedor",
            observacoes: 0,
            tempoTotal: 0,
            countFechados: 0,
          };
        }

        salesStats[vendedorId].leads += 1;

        if (lead.status === "ganho") {
          salesStats[vendedorId].convertidos += 1;
          // Calcular tempo de fechamento (criação até atualização)
          const createdAt = new Date(lead.created_at);
          const updatedAt = new Date(lead.updated_at);
          const diffInDays = Math.ceil(
            (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          salesStats[vendedorId].tempoTotal += diffInDays;
          salesStats[vendedorId].countFechados += 1;
        }
      });

      // Contar observações por vendedor
      observations?.forEach((obs: any) => {
        const vendedorId = obs.user_id;
        if (salesStats[vendedorId]) {
          salesStats[vendedorId].observacoes += 1;
        }
      });

      return Object.values(salesStats).map((stats) => ({
        vendedor: stats.name,
        leads: stats.leads,
        convertidos: stats.convertidos,
        taxa:
          stats.leads > 0
            ? Number(((stats.convertidos / stats.leads) * 100).toFixed(1))
            : 0,
        observacoes: stats.observacoes,
        tempoMedio:
          stats.countFechados > 0
            ? Math.ceil(stats.tempoTotal / stats.countFechados)
            : 0,
      }));
    },
    enabled: profileRole !== "vendedor",
  });
};
