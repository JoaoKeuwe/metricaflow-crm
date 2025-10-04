import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "@/components/dashboard/MetricCard";
import LeadsStatusChart from "@/components/dashboard/LeadsStatusChart";
import FinancialMetricsChart from "@/components/dashboard/FinancialMetricsChart";
import MonthlyClosedLeadsChart from "@/components/dashboard/MonthlyClosedLeadsChart";
import SalesPerformanceDetailedChart from "@/components/dashboard/SalesPerformanceDetailedChart";
import LeadsSourceChart from "@/components/dashboard/LeadsSourceChart";
import ConversionFunnelChart from "@/components/dashboard/ConversionFunnelChart";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { useDetailedPerformanceData } from "@/hooks/useDetailedPerformanceData";
import { Users, CheckCircle, Clock, TrendingUp, DollarSign, Target, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", profile?.role, selectedMonth, selectedYear],
    queryFn: async () => {
      const dateRange = getDateRange();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada. Por favor, faça login novamente.");

      let leadsQuery = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      if (profile?.role === "vendedor") {
        leadsQuery = leadsQuery.eq("assigned_to", session.user.id);
      }

      const { count: totalLeads } = await leadsQuery;

      let wonQuery = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .eq("status", "ganho")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      if (profile?.role === "vendedor") {
        wonQuery = wonQuery.eq("assigned_to", session.user.id);
      }

      const { count: wonLeads } = await wonQuery;

      let pendingQuery = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .in("status", ["novo", "contato_feito", "proposta", "negociacao"])
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

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
        .select("estimated_value")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);
      
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
        .eq("status", "ganho")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);
      
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
    queryKey: ["leads-status", profile?.role, selectedMonth, selectedYear],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const dateRange = getDateRange();

      let query = supabase
        .from("leads")
        .select("status")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);
      
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

  const { data: monthlyClosedData } = useQuery({
    queryKey: ["monthly-closed-leads", profile?.role, selectedMonth, selectedYear],
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
      
      if (profile?.role === "vendedor") {
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
    queryKey: ["financial-metrics", profile?.role, selectedMonth, selectedYear],
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


  // Buscar dados detalhados para gestores
  const { data: detailedPerformanceData } = useDetailedPerformanceData(
    getDateRange(),
    profile?.role
  );

  const { data: sourceData } = useQuery({
    queryKey: ["leads-source", profile?.role, selectedMonth, selectedYear],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const dateRange = getDateRange();

      let query = supabase.from("leads")
        .select("source")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);
      
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
    queryKey: ["conversion-funnel", profile?.role, selectedMonth, selectedYear],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const dateRange = getDateRange();

      let query = supabase.from("leads")
        .select("status")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);
      
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

  const handleExportPDF = async () => {
    console.log("Botão de exportar PDF clicado");

    if (!stats || !profile) {
      toast.error("Aguarde o carregamento dos dados");
      return;
    }

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
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Animated gradient background - mais vibrante e dinâmico */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-background via-background to-background">
        {/* Orbs de cor animados e maiores */}
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-primary/30 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-accent/30 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[550px] h-[550px] bg-[hsl(210,100%,60%)]/25 rounded-full mix-blend-screen filter blur-[110px] opacity-35 animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-[hsl(158,100%,65%)]/20 rounded-full mix-blend-screen filter blur-[90px] opacity-30 animate-pulse" style={{ animationDelay: '6s' }} />
        
        {/* Grid sutil para profundidade */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,31,78,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,31,78,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
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
            className="relative z-30 pointer-events-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
            size="lg"
          >
            <FileDown className="mr-2 h-5 w-5 group-hover:animate-bounce" />
            Exportar Relatório PDF
          </Button>
        </div>

        <div id="metrics-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
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

      <div id="status-source-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        {statusData && <LeadsStatusChart data={statusData} />}
        {sourceData && <LeadsSourceChart data={sourceData} />}
      </div>

      <div id="monthly-closed-chart" className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
        {monthlyClosedData && <MonthlyClosedLeadsChart data={monthlyClosedData} />}
      </div>

      <div id="financial-funnel-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
        {financialData && <FinancialMetricsChart data={financialData} />}
        {funnelData && <ConversionFunnelChart data={funnelData} />}
      </div>

      {profile?.role !== "vendedor" && detailedPerformanceData && detailedPerformanceData.length > 0 && (
        <div id="detailed-performance-chart" className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-900">
          <SalesPerformanceDetailedChart data={detailedPerformanceData} />
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
