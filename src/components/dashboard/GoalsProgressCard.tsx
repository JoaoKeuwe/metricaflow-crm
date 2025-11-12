import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export const GoalsProgressCard = () => {
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

  const { data: dailyGoal, isLoading } = useQuery({
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

  const { data: progress } = useQuery({
    queryKey: ["daily-progress", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const today = new Date().toISOString().split('T')[0];

      const { data: leads } = await supabase
        .from("leads")
        .select("id, status")
        .eq("assigned_to", profile.id)
        .gte("created_at", today);

      return {
        leads: leads?.length || 0,
        conversions: leads?.filter(l => l.status === "ganho").length || 0,
      };
    },
    enabled: !!profile?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!dailyGoal) {
    return null;
  }

  const leadsProgress = dailyGoal.leads_goal ? ((progress?.leads || 0) / dailyGoal.leads_goal) * 100 : 0;
  const conversionsProgress = dailyGoal.conversions_goal ? ((progress?.conversions || 0) / dailyGoal.conversions_goal) * 100 : 0;

  const isLeadsGoalMet = progress && progress.leads >= dailyGoal.leads_goal;
  const isConversionsGoalMet = progress && progress.conversions >= dailyGoal.conversions_goal;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Metas de Hoje
        </CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Leads Criados</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">
                {progress?.leads || 0} / {dailyGoal.leads_goal}
              </span>
              {isLeadsGoalMet && (
                <Badge variant="default" className="h-5">
                  ✓
                </Badge>
              )}
            </div>
          </div>
          <Progress value={Math.min(leadsProgress, 100)} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Conversões</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">
                {progress?.conversions || 0} / {dailyGoal.conversions_goal}
              </span>
              {isConversionsGoalMet && (
                <Badge variant="default" className="h-5">
                  ✓
                </Badge>
              )}
            </div>
          </div>
          <Progress value={Math.min(conversionsProgress, 100)} className="h-2" />
        </div>

        {isLeadsGoalMet && isConversionsGoalMet && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                🎉 Parabéns! Você bateu sua meta de hoje!
              </span>
            </div>
          </div>
        )}

        <Link to="/goals">
          <div className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            Ver todas as metas →
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};
