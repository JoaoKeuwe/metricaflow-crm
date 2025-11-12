import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, TrendingUp, Calendar } from "lucide-react";

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

  if (loadingDaily || loadingWeekly || loadingProgress) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const calculateProgress = (current: number, goal: number) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 70) return "bg-yellow-500";
    return "bg-red-500";
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
                            dailyProgress.leads >= dailyGoal.leads_goal &&
                            dailyProgress.conversions >= dailyGoal.conversions_goal
                              ? "default"
                              : "secondary"
                          }
                        >
                          {dailyProgress.leads >= dailyGoal.leads_goal &&
                          dailyProgress.conversions >= dailyGoal.conversions_goal
                            ? "Meta Atingida 🎉"
                            : "Em Progresso"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Receita do Dia</span>
                      <span className="text-lg font-bold">
                        R$ {(dailyProgress?.revenue || 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Metas semanais em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Metas mensais em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Goals;
