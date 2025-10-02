import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "@/components/dashboard/MetricCard";
import LeadsStatusChart from "@/components/dashboard/LeadsStatusChart";
import LeadsTimelineChart from "@/components/dashboard/LeadsTimelineChart";
import FinancialMetricsChart from "@/components/dashboard/FinancialMetricsChart";
import SalesPerformanceChart from "@/components/dashboard/SalesPerformanceChart";
import LeadsSourceChart from "@/components/dashboard/LeadsSourceChart";
import ConversionFunnelChart from "@/components/dashboard/ConversionFunnelChart";
import { Users, CheckCircle, Clock, TrendingUp, DollarSign, Target } from "lucide-react";

const Dashboard = () => {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada. Por favor, faça login novamente.");

      const { data, error } = await supabase
        .from("profiles")
        .select("*, companies(name)")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", profile?.role],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada. Por favor, faça login novamente.");

      let leadsQuery = supabase.from("leads").select("*", { count: "exact" });

      if (profile?.role === "vendedor") {
        leadsQuery = leadsQuery.eq("assigned_to", session.user.id);
      }

      const { count: totalLeads } = await leadsQuery;

      let wonQuery = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .eq("status", "ganho");

      if (profile?.role === "vendedor") {
        wonQuery = wonQuery.eq("assigned_to", session.user.id);
      }

      const { count: wonLeads } = await wonQuery;

      let pendingQuery = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .in("status", ["novo", "contato_feito", "proposta", "negociacao"]);

      if (profile?.role === "vendedor") {
        pendingQuery = pendingQuery.eq("assigned_to", session.user.id);
      }

      const { count: pendingLeads } = await pendingQuery;

      const conversionRate =
        totalLeads && totalLeads > 0
          ? ((wonLeads || 0) / totalLeads) * 100
          : 0;

      // Valor total estimado
      let estimatedValueQuery = supabase
        .from("leads")
        .select("estimated_value");
      
      if (profile?.role === "vendedor") {
        estimatedValueQuery = estimatedValueQuery.eq("assigned_to", session.user.id);
      }

      const { data: estimatedData } = await estimatedValueQuery;
      const totalEstimatedValue = estimatedData?.reduce((sum, lead) => 
        sum + (Number(lead.estimated_value) || 0), 0) || 0;

      // Valor convertido
      let convertedValueQuery = supabase
        .from("leads")
        .select("estimated_value")
        .eq("status", "ganho");
      
      if (profile?.role === "vendedor") {
        convertedValueQuery = convertedValueQuery.eq("assigned_to", session.user.id);
      }

      const { data: convertedData } = await convertedValueQuery;
      const totalConvertedValue = convertedData?.reduce((sum, lead) => 
        sum + (Number(lead.estimated_value) || 0), 0) || 0;

      // Ticket médio
      const averageTicket = wonLeads && wonLeads > 0 
        ? totalConvertedValue / wonLeads 
        : 0;

      return {
        totalLeads: totalLeads || 0,
        wonLeads: wonLeads || 0,
        pendingLeads: pendingLeads || 0,
        conversionRate: conversionRate.toFixed(1),
        totalEstimatedValue,
        totalConvertedValue,
        averageTicket,
      };
    },
    enabled: !!profile,
  });

  const { data: statusData } = useQuery({
    queryKey: ["leads-status", profile?.role],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      let query = supabase.from("leads").select("status");
      
      if (profile?.role === "vendedor") {
        query = query.eq("assigned_to", session.user.id);
      }

      const { data } = await query;
      
      const statusCounts = data?.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const colors: Record<string, string> = {
        novo: "hsl(var(--chart-1))",
        contato_feito: "hsl(var(--chart-2))",
        proposta: "hsl(var(--chart-3))",
        negociacao: "hsl(var(--chart-4))",
        ganho: "hsl(var(--chart-5))",
        perdido: "hsl(var(--chart-6))",
      };

      return Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        color: colors[status] || "hsl(var(--chart-1))",
      }));
    },
    enabled: !!profile,
  });

  const { data: timelineData } = useQuery({
    queryKey: ["leads-timeline", profile?.role],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from("leads")
        .select("created_at, status")
        .gte("created_at", thirtyDaysAgo.toISOString());
      
      if (profile?.role === "vendedor") {
        query = query.eq("assigned_to", session.user.id);
      }

      const { data } = await query;

      const dailyStats: Record<string, { novos: number; convertidos: number; perdidos: number }> = {};

      data?.forEach((lead) => {
        const date = new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        if (!dailyStats[date]) {
          dailyStats[date] = { novos: 0, convertidos: 0, perdidos: 0 };
        }
        dailyStats[date].novos += 1;
        if (lead.status === "ganho") dailyStats[date].convertidos += 1;
        if (lead.status === "perdido") dailyStats[date].perdidos += 1;
      });

      return Object.entries(dailyStats)
        .map(([date, stats]) => ({ date, ...stats }))
        .slice(-30);
    },
    enabled: !!profile,
  });

  const { data: financialData } = useQuery({
    queryKey: ["financial-metrics", profile?.role],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let query = supabase
        .from("leads")
        .select("created_at, status, estimated_value")
        .gte("created_at", sixMonthsAgo.toISOString());
      
      if (profile?.role === "vendedor") {
        query = query.eq("assigned_to", session.user.id);
      }

      const { data } = await query;

      const monthlyStats: Record<string, { valorEstimado: number; valorConvertido: number }> = {};

      data?.forEach((lead) => {
        const month = new Date(lead.created_at).toLocaleDateString("pt-BR", { month: "short" });
        if (!monthlyStats[month]) {
          monthlyStats[month] = { valorEstimado: 0, valorConvertido: 0 };
        }
        monthlyStats[month].valorEstimado += Number(lead.estimated_value) || 0;
        if (lead.status === "ganho") {
          monthlyStats[month].valorConvertido += Number(lead.estimated_value) || 0;
        }
      });

      return Object.entries(monthlyStats).map(([month, stats]) => ({ month, ...stats }));
    },
    enabled: !!profile,
  });

  const { data: performanceData } = useQuery({
    queryKey: ["sales-performance", profile?.role],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      if (profile?.role === "vendedor") {
        return [];
      }

      const { data: leads } = await supabase
        .from("leads")
        .select("assigned_to, status, profiles(name)");

      const salesStats: Record<string, { leads: number; convertidos: number; name: string }> = {};

      leads?.forEach((lead: any) => {
        const vendedorId = lead.assigned_to;
        if (!vendedorId) return;

        if (!salesStats[vendedorId]) {
          salesStats[vendedorId] = {
            leads: 0,
            convertidos: 0,
            name: lead.profiles?.name || "Sem vendedor",
          };
        }
        salesStats[vendedorId].leads += 1;
        if (lead.status === "ganho") {
          salesStats[vendedorId].convertidos += 1;
        }
      });

      return Object.values(salesStats).map((stats) => ({
        vendedor: stats.name,
        leads: stats.leads,
        convertidos: stats.convertidos,
        taxa: stats.leads > 0 ? Number(((stats.convertidos / stats.leads) * 100).toFixed(1)) : 0,
      }));
    },
    enabled: !!profile && profile?.role !== "vendedor",
  });

  const { data: sourceData } = useQuery({
    queryKey: ["leads-source", profile?.role],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      let query = supabase.from("leads").select("source");
      
      if (profile?.role === "vendedor") {
        query = query.eq("assigned_to", session.user.id);
      }

      const { data } = await query;
      
      const sourceCounts = data?.reduce((acc, lead) => {
        const source = lead.source || "Não informado";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const colors = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
      ];

      return Object.entries(sourceCounts).map(([source, count], index) => ({
        source,
        count,
        color: colors[index % colors.length],
      }));
    },
    enabled: !!profile,
  });

  const { data: funnelData } = useQuery({
    queryKey: ["conversion-funnel", profile?.role],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      let query = supabase.from("leads").select("status");
      
      if (profile?.role === "vendedor") {
        query = query.eq("assigned_to", session.user.id);
      }

      const { data } = await query;

      const stages = [
        { stage: "Novos", status: "novo", color: "hsl(var(--chart-1))" },
        { stage: "Contato Feito", status: "contato_feito", color: "hsl(var(--chart-2))" },
        { stage: "Proposta", status: "proposta", color: "hsl(var(--chart-3))" },
        { stage: "Negociação", status: "negociacao", color: "hsl(var(--chart-4))" },
        { stage: "Ganho", status: "ganho", color: "hsl(var(--chart-5))" },
      ];

      return stages.map((stage) => ({
        stage: stage.stage,
        count: data?.filter((lead) => lead.status === stage.status).length || 0,
        color: stage.color,
      }));
    },
    enabled: !!profile,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Analítico</h1>
        <p className="text-muted-foreground mt-1">
          Análise completa do seu CRM
          {profile?.companies && ` - ${profile.companies.name}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <MetricCard
          title="Total de Leads"
          value={stats?.totalLeads || 0}
          icon={Users}
          description="Leads cadastrados"
        />
        <MetricCard
          title="Vendas Fechadas"
          value={stats?.wonLeads || 0}
          icon={CheckCircle}
          description="Leads convertidos"
        />
        <MetricCard
          title="Em Andamento"
          value={stats?.pendingLeads || 0}
          icon={Clock}
          description="Leads ativos"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${stats?.conversionRate || 0}%`}
          icon={TrendingUp}
          description="Efetividade de vendas"
        />
        <MetricCard
          title="Valor Estimado"
          value={`R$ ${(stats?.totalEstimatedValue || 0).toLocaleString('pt-BR')}`}
          icon={DollarSign}
          description="Valor total em pipeline"
        />
        <MetricCard
          title="Ticket Médio"
          value={`R$ ${(stats?.averageTicket || 0).toLocaleString('pt-BR')}`}
          icon={Target}
          description="Valor médio por venda"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statusData && <LeadsStatusChart data={statusData} />}
        {sourceData && <LeadsSourceChart data={sourceData} />}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {timelineData && <LeadsTimelineChart data={timelineData} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {financialData && <FinancialMetricsChart data={financialData} />}
        {funnelData && <ConversionFunnelChart data={funnelData} />}
      </div>

      {profile?.role !== "vendedor" && performanceData && performanceData.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <SalesPerformanceChart data={performanceData} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
