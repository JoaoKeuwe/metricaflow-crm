import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "@/components/dashboard/MetricCard";
import LeadsStatusChart from "@/components/dashboard/LeadsStatusChart";
import FinancialMetricsChart from "@/components/dashboard/FinancialMetricsChart";
import MonthlyClosedLeadsChart from "@/components/dashboard/MonthlyClosedLeadsChart";
import SalesPerformanceDetailedChart from "@/components/dashboard/SalesPerformanceDetailedChart";
import LeadsSourceChart from "@/components/dashboard/LeadsSourceChart";
import { ImprovedConversionFunnelChart } from "@/components/dashboard/ImprovedConversionFunnelChart";
import { ActivityMetricsCard } from "@/components/dashboard/ActivityMetricsCard";
import { LossReasonsChart } from "@/components/dashboard/LossReasonsChart";
import { ForecastCard } from "@/components/dashboard/ForecastCard";
import { AdvancedMetricsCard } from "@/components/dashboard/AdvancedMetricsCard";
import { ProductivityRankingCard } from "@/components/dashboard/ProductivityRankingCard";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { GoalsProgressCard } from "@/components/dashboard/GoalsProgressCard";
import { useDetailedPerformanceData } from "@/hooks/useDetailedPerformanceData";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";
import { Users, CheckCircle, Clock, TrendingUp, DollarSign, Target, FileDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1);
  
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

  const getCompareDateRange = () => {
    const monthNum = Number(compareMonth) - 1;
    const year = Number(compareYear);
    return {
      start: new Date(year, monthNum, 1).toISOString(),
      end: new Date(year, monthNum + 1, 0, 23, 59, 59).toISOString(),
    };
  };

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

  /**
   * UI-ONLY CHECK - Does not provide security!
   * Backend validation via RLS policies is required.
   */
  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  // Consolidar todas as queries principais do dashboard em uma única chamada
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["dashboard-stats", userRole, selectedMonth, selectedYear],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
    staleTime: 3 * 60 * 1000, // Cache de 3 minutos para Dashboard
  });

  const stats = dashboardData?.stats;
  const statusData = dashboardData?.statusData;
  const sourceData = dashboardData?.sourceData;
  const funnelData = dashboardData?.funnelData;
  const lossReasonsData = dashboardData?.lossReasonsData;
  const conversionByStage = dashboardData?.conversionByStage;

  const { data: monthlyClosedData } = useQuery({
    queryKey: ["monthly-closed-leads", userRole, selectedMonth, selectedYear],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const year = Number(selectedYear);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth(); // 0-11
      
      // Determine the last month to show
      const lastMonth = year === currentYear ? currentMonth : 11;

      // Query for the entire year up to current month
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

      // Initialize all months from January to current/December
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      const monthlyStats: Array<{ month: string; count: number; value: number }> = [];
      
      for (let i = 0; i <= lastMonth; i++) {
        monthlyStats.push({
          month: monthNames[i],
          count: 0,
          value: 0
        });
      }

      // Populate with actual data
      data?.forEach((lead) => {
        const leadDate = new Date(lead.created_at);
        const monthIndex = leadDate.getMonth();
        
        if (monthIndex <= lastMonth) {
          monthlyStats[monthIndex].count += 1;
          monthlyStats[monthIndex].value += Number(lead.estimated_value) || 0;
        }
      });

      return monthlyStats;
    },
    enabled: !!profile,
  });

  const { data: financialData } = useQuery({
    queryKey: ["financial-metrics", userRole, selectedMonth, selectedYear],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const dateRange = getDateRange();

      let query = supabase
        .from("leads")
        .select("created_at, status, estimated_value")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);
      
      if (userRole === "vendedor") {
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


  // Buscar dados detalhados para gestores
  const { data: detailedPerformanceData } = useDetailedPerformanceData(
    getDateRange(),
    userRole
  );

  const handleExportPDF = async () => {
    console.log("Botão de exportar PDF clicado");

    if (!stats || !profile) {
      toast.error("Aguarde o carregamento dos dados");
      return;
    }

    setIsExporting(true);
    const loadingToast = toast.loading("Gerando PDF com gráficos...");

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Header
      doc.setFillColor(255, 31, 78);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório do Dashboard CRM", pageWidth / 2, 20, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 30, { align: "center" });

      yPosition = 50;

      // Informações
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      if (profile.companies) {
        doc.text(`Empresa: ${profile.companies.name}`, 20, yPosition);
        yPosition += 10;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Usuário: ${profile.name}`, 20, yPosition);
      yPosition += 15;

      // Métricas principais
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 31, 78);
      doc.text("📊 Métricas Principais", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      
      const metrics = [
        `Total de Leads: ${stats.totalLeads || 0}`,
        `Vendas Fechadas: ${stats.wonLeads || 0}`,
        `Em Andamento: ${stats.pendingLeads || 0}`,
        `Taxa de Conversão: ${stats.conversionRate || 0}%`,
        `Valor Estimado: R$ ${(stats.totalEstimatedValue || 0).toLocaleString('pt-BR')}`,
        `Ticket Médio: R$ ${(stats.averageTicket || 0).toLocaleString('pt-BR')}`
      ];

      metrics.forEach((metric) => {
        doc.text(`• ${metric}`, 30, yPosition);
        yPosition += 7;
      });

      yPosition += 10;

      // Capturar e adicionar gráficos
      const chartIds = [
        'metrics-cards',
        'status-source-charts',
        'monthly-closed-chart',
        'financial-funnel-charts',
        'detailed-performance-chart'
      ];

      for (const chartId of chartIds) {
        const chartElement = document.getElementById(chartId);
        if (!chartElement) continue;

        try {
          const canvas = await html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yPosition + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        } catch (error) {
          console.error(`Erro ao capturar gráfico ${chartId}:`, error);
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${pageCount} | Gerado pelo CRM - ${new Date().toLocaleDateString('pt-BR')}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Salvar
      const fileName = `relatorio-dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
      const isIframe = window.top !== window.self;

      toast.dismiss(loadingToast);

      if (isIframe) {
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
        toast.success('Relatório aberto em nova aba');
      } else {
        doc.save(fileName);
        toast.success('Relatório exportado com sucesso!');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Erro ao gerar PDF:", error);
      toast.error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Animated gradient background - sutilizado */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-background via-background to-background">
        {/* Orbs de cor sutis */}
        <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-primary/15 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse" />
        <div className="absolute top-40 -right-40 w-[400px] h-[400px] bg-accent/15 rounded-full mix-blend-screen filter blur-[70px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] bg-[hsl(210,100%,60%)]/12 rounded-full mix-blend-screen filter blur-[75px] opacity-18 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 pointer-events-auto">
        {/* Filtros de Período */}
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

        <div className="relative z-20 pointer-events-auto flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-in slide-in-from-left duration-500" style={{ animation: 'gradient-shift 6s ease infinite' }}>
              Dashboard Analítico
            </h1>
            <p className="text-muted-foreground mt-2 text-lg animate-in slide-in-from-left duration-700 delay-100">
              Análise completa do seu CRM
              {profile?.companies && ` - ${profile.companies.name}`}
            </p>
            <div className="absolute -bottom-2 left-0 h-1 w-32 bg-gradient-to-r from-primary to-accent rounded-full animate-in slide-in-from-left duration-700 delay-200" />
          </div>
          
          {/* Botão de Exportar PDF */}
          <Button
            onClick={handleExportPDF}
            disabled={isExporting || !stats}
            className="relative z-30 pointer-events-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isExporting ? (
              <>
                <LoadingSpinner className="mr-2 h-5 w-5" />
                Gerando PDF...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                Exportar Relatório PDF
              </>
            )}
          </Button>
        </div>

        {!stats || isLoadingDashboard ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-[400px] rounded-lg" />
              <Skeleton className="h-[400px] rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            {/* Visão Geral */}
            <Collapsible defaultOpen className="space-y-4">
              <CollapsibleTrigger className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/80 transition-colors">
                <Layers className="h-5 w-5" />
                📊 Visão Geral
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div id="metrics-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
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

                {/* Goals Progress Card */}
                <GoalsProgressCard />
              </CollapsibleContent>
            </Collapsible>

            {/* Qualificação e Funil */}
            <Collapsible defaultOpen className="space-y-4">
              <CollapsibleTrigger className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/80 transition-colors">
                <Layers className="h-5 w-5" />
                🎯 Qualificação e Funil
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <MetricCard
                    title="Leads Qualificados"
                    value={stats?.qualifiedLeads || 0}
                    icon={Target}
                    description="SQLs gerados no período"
                  />
                  <MetricCard
                    title="Taxa de Qualificação"
                    value={`${stats?.qualificationRate || 0}%`}
                    icon={TrendingUp}
                    description="Leads → SQL"
                  />
                  <MetricCard
                    title="Win Rate"
                    value={`${stats?.winRate || 0}%`}
                    icon={CheckCircle}
                    description="Oportunidades fechadas"
                  />
                </div>

                <div id="funnel-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {funnelData && <ImprovedConversionFunnelChart data={funnelData} conversionRates={conversionByStage} />}
                  {statusData && <LeadsStatusChart data={statusData} />}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Atividades e Produtividade */}
            <Collapsible defaultOpen className="space-y-4">
              <CollapsibleTrigger className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/80 transition-colors">
                <Layers className="h-5 w-5" />
                💼 Atividades e Produtividade
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 gap-6">
                  <ActivityMetricsCard
                    scheduledMeetings={stats?.scheduledMeetings || 0}
                    completedMeetings={stats?.completedMeetings || 0}
                    totalActivities={stats?.totalActivities || 0}
                    qualifiedLeads={stats?.qualifiedLeads || 0}
                  />

                  {userRole !== "vendedor" && detailedPerformanceData && detailedPerformanceData.length > 0 && (
                    <ProductivityRankingCard vendedores={detailedPerformanceData} />
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Financeiro e Forecast */}
            <Collapsible defaultOpen className="space-y-4">
              <CollapsibleTrigger className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/80 transition-colors">
                <Layers className="h-5 w-5" />
                💰 Financeiro e Forecast
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-6">
                  <ForecastCard
                    forecastValue={stats?.forecast || 0}
                    currentRevenue={stats?.totalConvertedValue || 0}
                  />

                  <div id="financial-source-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {financialData && <FinancialMetricsChart data={financialData} />}
                    {sourceData && <LeadsSourceChart data={sourceData} />}
                  </div>

                  <div id="monthly-closed-chart">
                    {monthlyClosedData && <MonthlyClosedLeadsChart data={monthlyClosedData} />}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Análises Avançadas */}
            <Collapsible defaultOpen className="space-y-4">
              <CollapsibleTrigger className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/80 transition-colors">
                <Layers className="h-5 w-5" />
                📈 Análises Avançadas
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AdvancedMetricsCard
                    cac={stats?.cac ?? null}
                    ltv={stats?.ltv ?? null}
                    payback={stats?.payback ?? null}
                    avgTimeInFunnel={stats?.avgTimeInFunnel || 0}
                  />
                  {lossReasonsData && lossReasonsData.length > 0 && (
                    <LossReasonsChart data={lossReasonsData} />
                  )}
                </div>

                {userRole !== "vendedor" && detailedPerformanceData && detailedPerformanceData.length > 0 && (
                  <div id="detailed-performance-chart" className="mt-6">
                    <SalesPerformanceDetailedChart data={detailedPerformanceData} />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
