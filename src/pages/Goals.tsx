import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, TrendingUp, Calendar, DollarSign, Phone, Users } from "lucide-react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Goals = () => {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: dailyGoal, isLoading: loadingDaily } = useQuery({
    queryKey: ["daily-goal", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("sales_goals")
        .select("*")
        .eq("user_id", profile.id)
        .eq("period_type", "daily")
        .lte("start_date", today)
        .gte("end_date", today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: weeklyGoal, isLoading: loadingWeekly } = useQuery({
    queryKey: ["weekly-goal", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("sales_goals")
        .select("*")
        .eq("user_id", profile.id)
        .eq("period_type", "weekly")
        .lte("start_date", today)
        .gte("end_date", today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Buscar metas mensais do seller_kpi_monthly
  const currentMonth = format(new Date(), 'yyyy-MM-01');
  const { data: monthlyKPI, isLoading: loadingMonthlyKPI } = useQuery({
    queryKey: ["monthly-kpi", profile?.id, currentMonth],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from("seller_kpi_monthly")
        .select("*")
        .eq("user_id", profile.id)
        .eq("month", currentMonth)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: dailyProgress, isLoading: loadingProgress } = useQuery({
    queryKey: ["daily-progress", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const today = new Date().toISOString().split('T')[0];

      const { data: leads } = await supabase
        .from("leads")
        .select("id, status, estimated_value")
        .eq("assigned_to", profile.id)
        .gte("created_at", today);

      const { data: observations } = await supabase
        .from("lead_observations")
        .select("id")
        .eq("user_id", profile.id)
        .gte("created_at", today);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("assigned_to", profile.id)
        .eq("status", "concluida")
        .gte("updated_at", today);

      return {
        leads: leads?.length || 0,
        conversions: leads?.filter(l => l.status === "ganho").length || 0,
        observations: observations?.length || 0,
        tasks: tasks?.length || 0,
        revenue: leads?.filter(l => l.status === "ganho").reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0) || 0,
      };
    },
    enabled: !!profile?.id,
  });

  // Progresso semanal
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const { data: weeklyProgress, isLoading: loadingWeeklyProgress } = useQuery({
    queryKey: ["weekly-progress", profile?.id, weekStart.toISOString()],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data: leads } = await supabase
        .from("leads")
        .select("id, status, estimated_value")
        .eq("assigned_to", profile.id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      const { data: observations } = await supabase
        .from("lead_observations")
        .select("id")
        .eq("user_id", profile.id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      const { data: meetings } = await supabase
        .from("meeting_participants")
        .select("meeting:meetings!inner(id, start_time, status)")
        .eq("user_id", profile.id)
        .gte("meeting.start_time", weekStart.toISOString())
        .lte("meeting.start_time", weekEnd.toISOString());

      const { data: tasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("assigned_to", profile.id)
        .eq("status", "concluida")
        .gte("updated_at", weekStart.toISOString())
        .lte("updated_at", weekEnd.toISOString());

      return {
        leads: leads?.length || 0,
        conversions: leads?.filter(l => l.status === "ganho").length || 0,
        observations: observations?.length || 0,
        meetings: meetings?.length || 0,
        tasks: tasks?.length || 0,
        revenue: leads?.filter(l => l.status === "ganho").reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0) || 0,
      };
    },
    enabled: !!profile?.id,
  });

  // Progresso mensal
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  
  const { data: monthlyProgress, isLoading: loadingMonthlyProgress } = useQuery({
    queryKey: ["monthly-progress", profile?.id, monthStart.toISOString()],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data: leads } = await supabase
        .from("leads")
        .select("id, status, estimated_value")
        .eq("assigned_to", profile.id)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      const { data: leadValues } = await supabase
        .from("lead_values")
        .select("amount, lead:leads!inner(id, status, assigned_to)")
        .eq("lead.assigned_to", profile.id)
        .eq("lead.status", "ganho")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      const { data: meetings } = await supabase
        .from("meeting_participants")
        .select("meeting:meetings!inner(id, start_time, status)")
        .eq("user_id", profile.id)
        .gte("meeting.start_time", monthStart.toISOString())
        .lte("meeting.start_time", monthEnd.toISOString());

      const { data: observations } = await supabase
        .from("lead_observations")
        .select("id, note_type")
        .eq("user_id", profile.id)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      // Contar ligações (observações do tipo ligação/call)
      const calls = observations?.filter(o => 
        o.note_type?.toLowerCase().includes('ligação') || 
        o.note_type?.toLowerCase().includes('call') ||
        o.note_type?.toLowerCase().includes('telefone')
      ).length || 0;

      // Calcular receita total de lead_values ou estimated_value
      const revenueFromValues = leadValues?.reduce((sum, lv) => sum + (Number(lv.amount) || 0), 0) || 0;
      const revenueFromEstimated = leads?.filter(l => l.status === "ganho").reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0) || 0;

      return {
        leads: leads?.length || 0,
        deals: leads?.filter(l => l.status === "ganho").length || 0,
        meetings: meetings?.length || 0,
        calls: calls,
        revenue: revenueFromValues > 0 ? revenueFromValues : revenueFromEstimated,
      };
    },
    enabled: !!profile?.id,
  });

  if (loadingDaily || loadingWeekly || loadingProgress || loadingWeeklyProgress || loadingMonthlyProgress || loadingMonthlyKPI) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const calculateProgress = (current: number, goal: number | null | undefined) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="w-8 h-8" />
          Minhas Metas
        </h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso diário, semanal e mensal
        </p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="daily">Diário</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4 mt-6">
          {!dailyGoal ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhuma meta diária configurada. Peça ao seu gestor para criar suas metas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Leads Criados
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dailyProgress?.leads || 0} / {dailyGoal.leads_goal}
                    </div>
                    <Progress
                      value={calculateProgress(dailyProgress?.leads || 0, dailyGoal.leads_goal)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(dailyProgress?.leads || 0, dailyGoal.leads_goal).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Conversões
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dailyProgress?.conversions || 0} / {dailyGoal.conversions_goal}
                    </div>
                    <Progress
                      value={calculateProgress(dailyProgress?.conversions || 0, dailyGoal.conversions_goal)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(dailyProgress?.conversions || 0, dailyGoal.conversions_goal).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dailyProgress?.observations || 0} / {dailyGoal.observations_goal}
                    </div>
                    <Progress
                      value={calculateProgress(dailyProgress?.observations || 0, dailyGoal.observations_goal)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(dailyProgress?.observations || 0, dailyGoal.observations_goal).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dailyProgress?.tasks || 0} / {dailyGoal.tasks_goal || 0}
                    </div>
                    <Progress
                      value={calculateProgress(dailyProgress?.tasks || 0, dailyGoal.tasks_goal || 0)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(dailyProgress?.tasks || 0, dailyGoal.tasks_goal || 0).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Dia</CardTitle>
                  <CardDescription>
                    Seu desempenho de hoje ({new Date().toLocaleDateString('pt-BR')})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status Geral</span>
                      {dailyProgress && dailyGoal && (
                        <Badge
                          variant={
                            dailyProgress.leads >= (dailyGoal.leads_goal || 0) &&
                            dailyProgress.conversions >= (dailyGoal.conversions_goal || 0)
                              ? "default"
                              : "secondary"
                          }
                        >
                          {dailyProgress.leads >= (dailyGoal.leads_goal || 0) &&
                          dailyProgress.conversions >= (dailyGoal.conversions_goal || 0)
                            ? "Meta Atingida 🎉"
                            : "Em Progresso"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Receita do Dia</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(dailyProgress?.revenue || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-6">
          {!weeklyGoal ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Nenhuma meta semanal configurada. Veja seu progresso atual:
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Leads Criados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{weeklyProgress?.leads || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Esta semana
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Conversões
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{weeklyProgress?.conversions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vendas fechadas
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Reuniões
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{weeklyProgress?.meetings || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Agendadas
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Receita
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(weeklyProgress?.revenue || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vendas da semana
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Leads Criados
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {weeklyProgress?.leads || 0} / {weeklyGoal.leads_goal || 0}
                    </div>
                    <Progress
                      value={calculateProgress(weeklyProgress?.leads || 0, weeklyGoal.leads_goal)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(weeklyProgress?.leads || 0, weeklyGoal.leads_goal).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Conversões
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {weeklyProgress?.conversions || 0} / {weeklyGoal.conversions_goal || 0}
                    </div>
                    <Progress
                      value={calculateProgress(weeklyProgress?.conversions || 0, weeklyGoal.conversions_goal)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(weeklyProgress?.conversions || 0, weeklyGoal.conversions_goal).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Observações
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {weeklyProgress?.observations || 0} / {weeklyGoal.observations_goal || 0}
                    </div>
                    <Progress
                      value={calculateProgress(weeklyProgress?.observations || 0, weeklyGoal.observations_goal)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(weeklyProgress?.observations || 0, weeklyGoal.observations_goal).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Receita
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(weeklyProgress?.revenue || 0)}
                    </div>
                    <Progress
                      value={calculateProgress(weeklyProgress?.revenue || 0, weeklyGoal.revenue_goal)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Meta: {formatCurrency(weeklyGoal.revenue_goal || 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo da Semana</CardTitle>
                  <CardDescription>
                    {format(weekStart, "dd/MM", { locale: ptBR })} - {format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status Geral</span>
                      <Badge
                        variant={
                          (weeklyProgress?.conversions || 0) >= (weeklyGoal.conversions_goal || 0)
                            ? "default"
                            : "secondary"
                        }
                      >
                        {(weeklyProgress?.conversions || 0) >= (weeklyGoal.conversions_goal || 0)
                          ? "Meta Atingida 🎉"
                          : "Em Progresso"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total de Reuniões</span>
                      <span className="text-lg font-bold">{weeklyProgress?.meetings || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4 mt-6">
          {!monthlyKPI ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Nenhuma meta mensal configurada. Veja seu progresso atual:
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Receita
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(monthlyProgress?.revenue || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(), "MMMM yyyy", { locale: ptBR })}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Vendas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{monthlyProgress?.deals || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Negócios fechados
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Reuniões
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{monthlyProgress?.meetings || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Realizadas
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Ligações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{monthlyProgress?.calls || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Registradas
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-4">
                    Peça ao seu gestor para definir suas metas mensais em <strong>Desempenho & KPI</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Receita
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(monthlyKPI.actual_revenue || monthlyProgress?.revenue || 0)}
                    </div>
                    <Progress
                      value={calculateProgress(monthlyKPI.actual_revenue || monthlyProgress?.revenue || 0, monthlyKPI.target_revenue)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Meta: {formatCurrency(monthlyKPI.target_revenue || 0)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Vendas
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {monthlyKPI.actual_deals || monthlyProgress?.deals || 0} / {monthlyKPI.target_deals || 0}
                    </div>
                    <Progress
                      value={calculateProgress(monthlyKPI.actual_deals || monthlyProgress?.deals || 0, monthlyKPI.target_deals)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(monthlyKPI.actual_deals || monthlyProgress?.deals || 0, monthlyKPI.target_deals).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Reuniões
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {monthlyKPI.actual_meetings || monthlyProgress?.meetings || 0} / {monthlyKPI.target_meetings || 0}
                    </div>
                    <Progress
                      value={calculateProgress(monthlyKPI.actual_meetings || monthlyProgress?.meetings || 0, monthlyKPI.target_meetings)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(monthlyKPI.actual_meetings || monthlyProgress?.meetings || 0, monthlyKPI.target_meetings).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Ligações
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {monthlyKPI.actual_calls || monthlyProgress?.calls || 0} / {monthlyKPI.target_calls || 0}
                    </div>
                    <Progress
                      value={calculateProgress(monthlyKPI.actual_calls || monthlyProgress?.calls || 0, monthlyKPI.target_calls)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {calculateProgress(monthlyKPI.actual_calls || monthlyProgress?.calls || 0, monthlyKPI.target_calls).toFixed(0)}% da meta
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Mês</CardTitle>
                  <CardDescription>
                    {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status Geral</span>
                      <Badge
                        variant={
                          calculateProgress(monthlyKPI.actual_revenue || 0, monthlyKPI.target_revenue) >= 100
                            ? "default"
                            : "secondary"
                        }
                      >
                        {calculateProgress(monthlyKPI.actual_revenue || 0, monthlyKPI.target_revenue) >= 100
                          ? "Meta Atingida 🎉"
                          : "Em Progresso"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progresso de Receita</span>
                      <span className="text-lg font-bold">
                        {calculateProgress(monthlyKPI.actual_revenue || 0, monthlyKPI.target_revenue).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Dias Restantes</span>
                      <span className="text-lg font-bold">
                        {Math.ceil((monthEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Goals;