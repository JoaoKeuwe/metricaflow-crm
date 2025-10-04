import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "@/components/dashboard/MetricCard";
import LeadsStatusChart from "@/components/dashboard/LeadsStatusChart";
import LeadsTimelineChart from "@/components/dashboard/LeadsTimelineChart";
import FinancialMetricsChart from "@/components/dashboard/FinancialMetricsChart";
import SalesPerformanceChart from "@/components/dashboard/SalesPerformanceChart";
import SalesPerformanceDetailedChart from "@/components/dashboard/SalesPerformanceDetailedChart";
import LeadsSourceChart from "@/components/dashboard/LeadsSourceChart";
import ConversionFunnelChart from "@/components/dashboard/ConversionFunnelChart";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { useDetailedPerformanceData } from "@/hooks/useDetailedPerformanceData";
import { Users, CheckCircle, Clock, TrendingUp, DollarSign, Target, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";

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

  const { data: timelineData } = useQuery({
    queryKey: ["leads-timeline", profile?.role, selectedMonth, selectedYear],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const dateRange = getDateRange();

      let query = supabase
        .from("leads")
        .select("created_at, status")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);
      
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

      return Object.entries(dailyStats).map(([date, stats]) => ({ date, ...stats }));
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

  const { data: performanceData } = useQuery({
    queryKey: ["sales-performance", profile?.role, selectedMonth, selectedYear],
    queryFn: async () => {
      const dateRange = getDateRange();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      if (profile?.role === "vendedor") {
        return [];
      }

      const { data: leads } = await supabase
        .from("leads")
        .select("assigned_to, status, profiles(name), created_at")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

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

  const handleExportPDF = () => {
    console.log("Botão de exportar PDF clicado");
    console.log("Stats:", stats);
    console.log("Profile:", profile);

    if (!stats || !profile) {
      console.error("Dados não disponíveis - Stats:", stats, "Profile:", profile);
      toast.error("Aguarde o carregamento dos dados");
      return;
    }

    try {
      console.log("Iniciando geração do PDF...");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Header com gradiente simulado
      doc.setFillColor(255, 31, 78); // Rosa da marca
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório do Dashboard CRM", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 30, { align: "center" });

      yPosition = 50;

      // Informações da empresa
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

      // Linha separadora
      doc.setDrawColor(255, 31, 78);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 15;

      // Título das métricas principais
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 31, 78);
      doc.text("📊 Métricas Principais", 20, yPosition);
      yPosition += 10;

      // Box com métricas
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(20, yPosition, pageWidth - 40, 70, 3, 3, 'FD');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      
      yPosition += 10;
      const col1X = 30;
      const col2X = pageWidth / 2 + 10;

      // Coluna 1
      doc.text("Total de Leads:", col1X, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(String(stats.totalLeads || 0), col1X + 50, yPosition);
      
      yPosition += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Vendas Fechadas:", col1X, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(String(stats.wonLeads || 0), col1X + 50, yPosition);
      
      yPosition += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Em Andamento:", col1X, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(String(stats.pendingLeads || 0), col1X + 50, yPosition);

      // Coluna 2
      yPosition -= 20;
      doc.setFont("helvetica", "bold");
      doc.text("Taxa de Conversão:", col2X, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(`${stats.conversionRate || 0}%`, col2X + 60, yPosition);
      
      yPosition += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Valor Estimado:", col2X, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(`R$ ${(stats.totalEstimatedValue || 0).toLocaleString('pt-BR')}`, col2X + 60, yPosition);
      
      yPosition += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Ticket Médio:", col2X, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(`R$ ${(stats.averageTicket || 0).toLocaleString('pt-BR')}`, col2X + 60, yPosition);

      yPosition += 20;

      // Leads por Status
      if (statusData && statusData.length > 0) {
        yPosition += 10;
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 31, 78);
        doc.text("📈 Leads por Status", 20, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");

        statusData.forEach((item) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${item.status}: ${item.count}`, 30, yPosition);
          yPosition += 8;
        });
      }

      // Leads por Origem
      if (sourceData && sourceData.length > 0) {
        yPosition += 10;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 31, 78);
        doc.text("🎯 Leads por Origem", 20, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");

        sourceData.forEach((item) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${item.source}: ${item.count}`, 30, yPosition);
          yPosition += 8;
        });
      }

      // Desempenho por Vendedor (apenas se não for vendedor)
      if (performanceData && performanceData.length > 0 && profile.role !== "vendedor") {
        yPosition += 10;
        
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 31, 78);
        doc.text("👥 Desempenho por Vendedor", 20, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        performanceData.forEach((item) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.setFont("helvetica", "bold");
          doc.text(`${item.vendedor}:`, 30, yPosition);
          doc.setFont("helvetica", "normal");
          doc.text(`${item.leads} leads | ${item.convertidos} convertidos | ${item.taxa}% taxa`, 80, yPosition);
          yPosition += 8;
        });
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
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Salvar o PDF (com fallback para ambientes em iframe)
      const fileName = `relatorio-dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
      const isIframe = window.top !== window.self;

      try {
        if (isIframe) {
          // Em iframes, abrir em nova aba aumenta a compatibilidade
          const blobUrl = doc.output('bloburl');
          window.open(blobUrl, '_blank');
          console.log('PDF aberto em nova aba (iframe mode)');
          toast.success('Relatório aberto em nova aba como PDF');
        } else {
          doc.save(fileName);
          console.log('PDF baixado:', fileName);
          toast.success('Relatório exportado com sucesso!');
        }
      } catch (e) {
        console.warn('Falha no método principal, aplicando fallback de download...', e);
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Relatório exportado (fallback)!');
      }
    } catch (error) {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        {statusData && <LeadsStatusChart data={statusData} />}
        {sourceData && <LeadsSourceChart data={sourceData} />}
      </div>

      <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
        {timelineData && <LeadsTimelineChart data={timelineData} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
        {financialData && <FinancialMetricsChart data={financialData} />}
        {funnelData && <ConversionFunnelChart data={funnelData} />}
      </div>

      {profile?.role !== "vendedor" && performanceData && performanceData.length > 0 && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-800">
          <SalesPerformanceChart data={performanceData} />
        </div>
      )}

      {profile?.role !== "vendedor" && detailedPerformanceData && detailedPerformanceData.length > 0 && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-900">
          <SalesPerformanceDetailedChart data={detailedPerformanceData} />
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
