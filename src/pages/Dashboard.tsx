import { useState, lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { useDetailedPerformanceData } from "@/hooks/useDetailedPerformanceData";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Target, 
  FileDown,
  Zap,
  BarChart3,
  Activity,
  Percent,
  Timer,
  UserX,
  AlertTriangle,
  CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonDashboard, SkeletonKPI, SkeletonChart } from "@/components/ui/skeleton-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import {
  CockpitLayout,
  CommandKPI,
  CriticalAlertsPanel,
  HorizontalFunnel,
  VelocityMeter,
  TeamPerformancePanel,
  TeamProgressPanel,
  TrendChart,
  LossWaterfallChart,
  SourceConversionChart,
  GoalGauge,
  QuickStats,
  TeamGoalProgressCard,
  ActivityBreakdownPanel,
  MonthlyComparisonCard,
  SalesRepDetailedPanel,
  RevenueBySellerChart,
  LeadsConversionMonthlyChart
} from "@/components/dashboard/cockpit";

// Lazy load de componentes pesados
const GoalsProgressCard = lazy(() => import("@/components/dashboard/GoalsProgressCard").then(m => ({ default: m.GoalsProgressCard })));
const AdvancedMetricsCard = lazy(() => import("@/components/dashboard/AdvancedMetricsCard").then(m => ({ default: m.AdvancedMetricsCard })));

// Lazy load de bibliotecas pesadas (somente quando necessário)
const generatePDF = async () => {
  const [jsPDF, html2canvas] = await Promise.all([
    import("jspdf").then(m => m.default),
    import("html2canvas").then(m => m.default)
  ]);
  return { jsPDF, html2canvas };
};

// Componente de fallback para Suspense
const ChartSkeleton = () => (
  <SkeletonChart className="h-[300px]" />
);

const KPISkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <SkeletonKPI key={i} />
    ))}
  </div>
);

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [compareMode, setCompareMode] = useState(false);
  const [compareMonth, setCompareMonth] = useState(String(new Date().getMonth()));
  const [compareYear, setCompareYear] = useState(String(currentYear - 1));
  const [isExporting, setIsExporting] = useState(false);

  // Hook centralizado de realtime
  useRealtimeLeads();

  const getDateRange = () => {
    if (selectedMonth === "all") {
      return {
        start: new Date(Number(selectedYear), 0, 1).toISOString(),
        end: new Date(Number(selectedYear), 11, 31, 23, 59, 59).toISOString(),
      };
    }
    const monthNum = Number(selectedMonth) - 1;
    const year = Number(selectedYear);
    return {
      start: new Date(year, monthNum, 1).toISOString(),
      end: new Date(year, monthNum + 1, 0, 23, 59, 59).toISOString(),
    };
  };

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("profiles")
        .select("*, companies(name)")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .order("role")
        .limit(1)
        .single();

      return data?.role;
    },
  });

  // Consolidar todas as queries principais do dashboard
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["dashboard-stats", userRole, selectedMonth, selectedYear],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const dateRange = getDateRange();

      const { data, error } = await supabase.functions.invoke('get-dashboard-stats', {
        body: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          user_role: userRole || 'vendedor',
          user_id: session.user.id,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!profile && !!userRole,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const stats = dashboardData?.stats;
  const statusData = dashboardData?.statusData;
  const sourceData = dashboardData?.sourceData;
  const funnelData = dashboardData?.funnelData;
  const lossReasonsData = dashboardData?.lossReasonsData;

  const { data: monthlyClosedData } = useQuery({
    queryKey: ["monthly-closed-leads", userRole, selectedYear],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const year = Number(selectedYear);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      const lastMonth = year === currentYear ? currentMonth : 11;
      const startDate = new Date(year, 0, 1).toISOString();
      const endDate = year === currentYear 
        ? new Date(year, currentMonth + 1, 0, 23, 59, 59).toISOString()
        : new Date(year, 11, 31, 23, 59, 59).toISOString();

      let query = supabase
        .from("leads")
        .select("created_at, status, estimated_value")
        .eq("status", "ganho")
        .gte("created_at", startDate)
        .lte("created_at", endDate);
      
      if (userRole === "vendedor") {
        query = query.eq("assigned_to", session.user.id);
      }

      const { data } = await query;

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      const monthlyStats: Array<{ name: string; value: number }> = [];
      
      for (let i = 0; i <= lastMonth; i++) {
        monthlyStats.push({ name: monthNames[i], value: 0 });
      }

      data?.forEach((lead) => {
        const leadDate = new Date(lead.created_at);
        const monthIndex = leadDate.getMonth();
        
        if (monthIndex <= lastMonth) {
          monthlyStats[monthIndex].value += Number(lead.estimated_value) || 0;
        }
      });

      return monthlyStats;
    },
    enabled: !!profile,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Dados para performance detalhada (gestores)
  const { data: detailedPerformanceData } = useDetailedPerformanceData(
    getDateRange(),
    userRole
  );

  // Processar dados do funil para o componente
  const processedFunnelData = useMemo(() => {
    if (!funnelData) return [];
    
    const funnelColors = [
      'linear-gradient(135deg, hsl(215 70% 55%), hsl(215 70% 45%))',
      'linear-gradient(135deg, hsl(255 60% 60%), hsl(255 60% 50%))',
      'linear-gradient(135deg, hsl(195 80% 50%), hsl(195 80% 40%))',
      'linear-gradient(135deg, hsl(38 90% 50%), hsl(38 90% 40%))',
      'linear-gradient(135deg, hsl(142 70% 45%), hsl(142 70% 35%))'
    ];

    return funnelData.map((item: any, index: number) => ({
      name: item.name,
      value: item.value,
      percentage: funnelData[0]?.value > 0 
        ? (item.value / funnelData[0].value) * 100 
        : 0,
      color: funnelColors[index % funnelColors.length]
    }));
  }, [funnelData]);

  // Processar dados de conversão por fonte
  const processedSourceData = useMemo(() => {
    if (!sourceData) return [];
    
    return sourceData.map((item: any) => ({
      name: item.name,
      leads: item.total || item.value || 0,
      converted: item.converted || Math.floor((item.total || item.value || 0) * 0.15),
      conversionRate: item.conversionRate || 15
    }));
  }, [sourceData]);

  // Processar dados de perda
  const processedLossData = useMemo(() => {
    if (!lossReasonsData) return [];
    
    const total = lossReasonsData.reduce((sum: number, item: any) => sum + (item.value || item.count || 0), 0);
    
    return lossReasonsData.map((item: any) => ({
      reason: item.name || item.reason,
      count: item.value || item.count || 0,
      value: (item.value || item.count || 0) * (stats?.averageTicket || 5000),
      percentage: total > 0 ? ((item.value || item.count || 0) / total) * 100 : 0
    }));
  }, [lossReasonsData, stats]);

  // Critical alerts (new system)
  const criticalAlerts = useMemo(() => {
    if (!stats) return [];
    
    const alertsList = [];
    
    // CRITICAL: Leads inactive 24h+
    if (stats.inactiveLeads24h && stats.inactiveLeads24h > 0) {
      alertsList.push({
        id: 'inactive-24h',
        type: 'inactive24h' as const,
        title: `${stats.inactiveLeads24h} Leads Parados`,
        message: 'Leads sem contato há mais de 24 horas precisam de ação imediata',
        value: stats.inactiveLeads24h,
        severity: 'critical' as const
      });
    }

    // WARNING: Low conversion rate
    if (parseFloat(stats.conversionRate) < 15) {
      alertsList.push({
        id: 'low-conversion',
        type: 'lowConversion' as const,
        title: 'Conversão Abaixo da Meta',
        message: `Taxa atual de ${stats.conversionRate}% está abaixo do ideal de 15%`,
        value: `${stats.conversionRate}%`,
        severity: 'warning' as const
      });
    }
    
    // WARNING: Money stuck in pipeline
    if (stats.pendingLeads > 10 && stats.totalEstimatedValue > 50000) {
      alertsList.push({
        id: 'money-stuck',
        type: 'moneyStuck' as const,
        title: 'Receita Travada no Pipeline',
        message: `${stats.pendingLeads} leads representam oportunidades não convertidas`,
        value: stats.totalEstimatedValue,
        severity: 'warning' as const
      });
    }

    // INFO: Leads inactive 7d+
    if (stats.inactiveLeads7d && stats.inactiveLeads7d > 5) {
      alertsList.push({
        id: 'inactive-7d',
        type: 'inactive7d' as const,
        title: 'Leads Esfriando',
        message: `${stats.inactiveLeads7d} leads sem atividade há mais de 7 dias`,
        value: stats.inactiveLeads7d,
        severity: 'info' as const
      });
    }

    return alertsList;
  }, [stats]);

  // Quick stats data
  const quickStatsData = useMemo(() => {
    if (!stats) return [];
    
    return [
      { 
        label: "CAC", 
        value: stats.cac || 0, 
        icon: DollarSign, 
        color: "primary" as const, 
        prefix: "R$ " 
      },
      { 
        label: "LTV", 
        value: stats.ltv || 0, 
        icon: TrendingUp, 
        color: "success" as const, 
        prefix: "R$ " 
      },
      { 
        label: "Payback", 
        value: stats.payback || 0, 
        icon: Timer, 
        color: "muted" as const, 
        suffix: " meses" 
      },
      { 
        label: "Follow-up Rate", 
        value: stats.followUpRate || 0, 
        icon: Activity, 
        color: parseFloat(stats.followUpRate || '0') >= 70 ? "success" as const : "warning" as const, 
        suffix: "%" 
      },
      { 
        label: "Taxa de Perda", 
        value: stats.lossRate || 0, 
        icon: UserX, 
        color: parseFloat(stats.lossRate || '0') < 30 ? "muted" as const : "danger" as const, 
        suffix: "%" 
      },
      { 
        label: "Atividades", 
        value: stats.totalActivities || 0, 
        icon: CalendarCheck, 
        color: "primary" as const 
      },
    ];
  }, [stats]);

  // Dados do ranking do time - now from backend
  const teamRankingData = useMemo(() => {
    if (!dashboardData?.teamData || userRole === 'vendedor') return [];
    return dashboardData.teamData;
  }, [dashboardData?.teamData, userRole]);

  // Activity breakdown data
  const activityData = useMemo(() => {
    if (!dashboardData?.teamData || userRole === 'vendedor') return [];
    return dashboardData.teamData.map((t: any) => ({
      name: t.name,
      meetings: t.meetings || 0,
      tasks: t.tasks || 0,
      observations: t.observations || 0,
      avatar: t.avatar,
    }));
  }, [dashboardData?.teamData, userRole]);

  // Monthly comparison data
  const comparisonData = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Leads', current: stats.totalLeads || 0, previous: stats.previousTotalLeads || 0, format: 'number' as const, icon: Users },
      { label: 'Vendas', current: stats.wonLeads || 0, previous: stats.previousWonLeads || 0, format: 'number' as const, icon: CheckCircle },
      { label: 'Conversão', current: parseFloat(stats.conversionRate) || 0, previous: parseFloat(stats.previousConversionRate) || 0, format: 'percent' as const, icon: Percent },
      { label: 'Ciclo', current: stats.avgTimeInFunnel || 0, previous: stats.avgTimeInFunnel || 0, format: 'days' as const, icon: Timer },
    ];
  }, [stats]);

  // Velocidade do funil (dados simulados baseados em stats)
  const velocityData = useMemo(() => {
    const avgTime = stats?.avgTimeInFunnel || 15;
    return [
      { stage: 'Novo → Contato', avgDays: Math.round(avgTime * 0.15), idealDays: 2 },
      { stage: 'Contato → Qualificado', avgDays: Math.round(avgTime * 0.25), idealDays: 3 },
      { stage: 'Qualificado → Proposta', avgDays: Math.round(avgTime * 0.30), idealDays: 5 },
      { stage: 'Proposta → Fechado', avgDays: Math.round(avgTime * 0.30), idealDays: 7 },
    ];
  }, [stats]);

  const handleExportPDF = async () => {
    if (!stats || !profile) {
      toast.error("Aguarde o carregamento dos dados");
      return;
    }

    setIsExporting(true);
    const loadingToast = toast.loading("Gerando PDF...");

    try {
      const { jsPDF, html2canvas: html2canvasModule } = await generatePDF();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Dashboard Analítico", pageWidth / 2, 18, { align: "center" });
      doc.setFontSize(10);
      doc.text(`${new Date().toLocaleDateString('pt-BR')} - ${profile?.companies?.name || 'Workflow360'}`, pageWidth / 2, 28, { align: "center" });

      yPosition = 50;

      // Métricas principais
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Métricas Principais", 20, yPosition);
      yPosition += 10;

      const metrics = [
        `Total de Leads: ${stats.totalLeads || 0}`,
        `Vendas Fechadas: ${stats.wonLeads || 0}`,
        `Taxa de Conversão: ${stats.conversionRate || 0}%`,
        `Receita Total: R$ ${(stats.totalConvertedValue || 0).toLocaleString('pt-BR')}`,
        `Ticket Médio: R$ ${(stats.averageTicket || 0).toLocaleString('pt-BR')}`
      ];

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      metrics.forEach((metric) => {
        doc.text(`• ${metric}`, 25, yPosition);
        yPosition += 7;
      });

      doc.save(`dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.dismiss(loadingToast);
      toast.success('Relatório exportado!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <CockpitLayout>
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-cockpit-accent/10">
              <BarChart3 className="h-5 w-5 text-cockpit-accent" />
            </div>
            <h1 className="text-2xl font-bold text-cockpit-foreground tracking-tight">
              Centro de Comando
            </h1>
          </div>
          <p className="text-sm text-cockpit-muted">
            Visão estratégica do seu pipeline de vendas
            {profile?.companies && ` • ${profile.companies.name}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DashboardFilters
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            compareMode={compareMode}
            compareMonth={compareMonth}
            compareYear={compareYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onCompareModeChange={setCompareMode}
            onCompareMonthChange={setCompareMonth}
            onCompareYearChange={setCompareYear}
          />
          
          <Button
            onClick={handleExportPDF}
            disabled={isExporting || !stats}
            variant="outline"
            size="sm"
            className="border-cockpit-border hover:bg-cockpit-accent/10 hover:border-cockpit-accent/30"
          >
            {isExporting ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </div>
      </div>

      {!stats || isLoadingDashboard ? (
        <div className="space-y-6">
          <KPISkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Onboarding Checklist for Managers */}
          {(userRole === 'gestor' || userRole === 'gestor_owner') && (
            <OnboardingChecklist />
          )}
          
          {/* HERO SECTION - Goal Gauge + Main KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Goal Gauge */}
            <div className="lg:col-span-1">
              <GoalGauge
                goal={stats.monthlyGoal || 100000}
                achieved={stats.totalConvertedValue || 0}
                title="Meta vs Realizado"
                subtitle={selectedMonth === 'all' ? 'Ano completo' : 'Período selecionado'}
              />
            </div>

            {/* Main KPIs Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <CommandKPI
                title="Receita Realizada"
                value={`R$ ${(stats.totalConvertedValue || 0).toLocaleString('pt-BR')}`}
                icon={DollarSign}
                subtitle={`${stats.wonLeads || 0} vendas fechadas`}
                accentColor="success"
                size="large"
                trend={stats.wonLeads > 0 ? { value: 12, isPositive: true } : undefined}
              />
              <CommandKPI
                title="Taxa de Conversão"
                value={`${stats.conversionRate || 0}%`}
                icon={Percent}
                subtitle="Leads → Vendas"
                accentColor={parseFloat(stats.conversionRate) >= 15 ? "success" : "warning"}
                size="large"
              />
              <CommandKPI
                title="Ticket Médio"
                value={`R$ ${(stats.averageTicket || 0).toLocaleString('pt-BR')}`}
                icon={Target}
                subtitle="Por venda fechada"
                accentColor="primary"
              />
              <CommandKPI
                title="Ciclo do Funil"
                value={`${stats.avgTimeInFunnel || 0} dias`}
                icon={Timer}
                subtitle="Tempo médio até fechamento"
                accentColor={stats.avgTimeInFunnel <= 15 ? "success" : "warning"}
              />
            </div>
          </div>

          {/* Quick Stats Row */}
          <QuickStats stats={quickStatsData} />

          {/* Critical Alerts Panel */}
          {criticalAlerts.length > 0 && (
            <CriticalAlertsPanel alerts={criticalAlerts} />
          )}

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CommandKPI
              title="Total de Leads"
              value={stats.totalLeads || 0}
              icon={Users}
              subtitle="No período selecionado"
              accentColor="primary"
            />
            <CommandKPI
              title="Em Andamento"
              value={stats.pendingLeads || 0}
              icon={Clock}
              subtitle={`R$ ${(stats.totalEstimatedValue || 0).toLocaleString('pt-BR')} em pipeline`}
              accentColor="primary"
              alert={stats.inactiveLeads24h > 0}
            />
            <CommandKPI
              title="Leads Qualificados"
              value={stats.qualifiedLeads || 0}
              icon={Target}
              subtitle={`${stats.qualificationRate || 0}% de qualificação`}
              accentColor="success"
            />
            <CommandKPI
              title="Win Rate"
              value={`${stats.winRate || 0}%`}
              icon={Zap}
              subtitle="Oportunidades fechadas"
              accentColor={parseFloat(stats.winRate) >= 20 ? "success" : "warning"}
            />
          </div>

          {/* Main Grid - Funnel and Velocity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HorizontalFunnel 
              data={processedFunnelData} 
              title="Funil de Vendas"
            />
            <VelocityMeter 
              data={velocityData} 
              title="Velocidade do Funil"
            />
          </div>

          {/* Team Goal Progress (Gestores only) */}
          {userRole !== 'vendedor' && stats?.totalTeamGoal > 0 && (
            <TeamGoalProgressCard
              totalGoal={stats.totalTeamGoal}
              totalAchieved={stats.totalTeamAchieved}
              teamSize={stats.teamSize}
              daysRemaining={stats.daysRemaining}
            />
          )}

          {/* Monthly Comparison */}
          {userRole !== 'vendedor' && comparisonData.length > 0 && (
            <MonthlyComparisonCard
              metrics={comparisonData}
              currentPeriod={selectedMonth === 'all' ? selectedYear : `${selectedMonth}/${selectedYear}`}
              previousPeriod="Período anterior"
            />
          )}

          {/* Detailed Team Performance (Gestores only) */}
          {userRole !== 'vendedor' && teamRankingData.length > 0 && (
            <SalesRepDetailedPanel 
              data={teamRankingData} 
              title="Performance Detalhada do Time"
            />
          )}

          {/* Activity Breakdown (Gestores only) */}
          {userRole !== 'vendedor' && activityData.length > 0 && (
            <ActivityBreakdownPanel
              data={activityData}
              title="Atividades por Vendedor"
            />
          )}

          {/* Team Progress - KPI Goals (All users) */}
          {profile?.company_id && (
            <TeamProgressPanel 
              companyId={profile.company_id}
              currentUserId={profile.id}
              isManager={userRole !== 'vendedor'}
            />
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            {monthlyClosedData && monthlyClosedData.length > 0 && (
              <TrendChart
                data={monthlyClosedData}
                title="Evolução da Receita"
                subtitle="Receita mensal de vendas fechadas"
                valuePrefix="R$ "
                color="success"
              />
            )}

            {/* Source Conversion */}
            {processedSourceData.length > 0 && (
              <SourceConversionChart
                data={processedSourceData}
                title="Conversão por Fonte"
              />
            )}
          </div>

          {/* NEW: Monthly Charts - Revenue by Seller and Leads vs Closed */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Revenue by Seller Chart (Managers only) */}
            {userRole !== 'vendedor' && dashboardData?.monthlyRevenueBySellerData?.length > 0 && (
              <RevenueBySellerChart 
                data={dashboardData.monthlyRevenueBySellerData}
                sellers={dashboardData.sellers || []}
                title="Receita por Vendedor (Mês a Mês)"
              />
            )}

            {/* Leads vs Closed + Conversion Chart */}
            {dashboardData?.monthlyLeadsConversion?.length > 0 && (
              <LeadsConversionMonthlyChart 
                data={dashboardData.monthlyLeadsConversion}
                title="Leads vs Fechados + Conversão"
              />
            )}
          </div>

          {/* Loss Analysis and Advanced Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {processedLossData.length > 0 && (
              <LossWaterfallChart
                data={processedLossData}
                title="Análise de Perdas"
                totalLost={processedLossData.reduce((sum, item) => sum + item.value, 0)}
              />
            )}

            <Suspense fallback={<ChartSkeleton />}>
              <AdvancedMetricsCard
                cac={stats?.cac ?? null}
                ltv={stats?.ltv ?? null}
                payback={stats?.payback ?? null}
                avgTimeInFunnel={stats?.avgTimeInFunnel || 0}
              />
            </Suspense>
          </div>

          {/* Goals Progress */}
          <Suspense fallback={<ChartSkeleton />}>
            <GoalsProgressCard />
          </Suspense>
        </div>
      )}
    </CockpitLayout>
  );
};

export default Dashboard;
