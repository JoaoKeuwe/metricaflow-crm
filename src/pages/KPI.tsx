import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BarChart3, Target, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import Sidebar from "@/components/layout/Sidebar";
import { KPIGoalCard, KPISummaryCard, KPIFeedbackTabs, KPIGoalEditor, KPIFeedbackForm } from "@/components/kpi";

const KPI = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Get current user and role
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*, company:companies(*)")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      return data?.role;
    },
    enabled: !!session?.user?.id,
  });

  const isManager = userRole === 'gestor_owner' || userRole === 'gestor';

  // Get team members (only for managers)
  const { data: teamMembers } = useQuery({
    queryKey: ["team-members", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .eq("company_id", profile.company_id)
        .eq("active", true);
      return data || [];
    },
    enabled: !!profile?.company_id && isManager,
  });

  // Effective user ID (selected user for managers, own ID for sellers)
  const effectiveUserId = isManager && selectedUserId ? selectedUserId : session?.user?.id;
  const effectiveUser = isManager && selectedUserId 
    ? teamMembers?.find(m => m.id === selectedUserId) 
    : { id: session?.user?.id, name: profile?.name, avatar_url: profile?.avatar_url };

  // Get KPI data for selected user and month
  const { data: kpiData, isLoading: loadingKPI } = useQuery({
    queryKey: ["kpi-monthly", effectiveUserId, selectedMonth.toISOString()],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      const monthStr = format(selectedMonth, 'yyyy-MM-dd');
      const { data } = await supabase
        .from("seller_kpi_monthly")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("month", monthStr)
        .maybeSingle();
      return data;
    },
    enabled: !!effectiveUserId,
  });

  // Get feedback for selected user and month
  const { data: feedbacks, isLoading: loadingFeedback } = useQuery({
    queryKey: ["kpi-feedback", effectiveUserId, selectedMonth.toISOString()],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      const monthStr = format(selectedMonth, 'yyyy-MM-dd');
      const { data } = await supabase
        .from("seller_kpi_feedback")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("month", monthStr)
        .order("created_at", { ascending: false });
      
      if (!data) return [];
      
      // Get creator names separately
      const creatorIds = [...new Set(data.map(f => f.created_by).filter(Boolean))];
      const { data: creators } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", creatorIds);
      
      return data.map(f => ({
        ...f,
        feedback_type: f.feedback_type as 'positivo' | 'negativo' | 'advertencia',
        created_by_name: creators?.find(c => c.id === f.created_by)?.name || undefined
      }));
    },
    enabled: !!effectiveUserId,
  });

  const lastFeedback = feedbacks && feedbacks.length > 0 ? {
    type: feedbacks[0].feedback_type as 'positivo' | 'negativo' | 'advertencia',
    title: feedbacks[0].title,
    date: feedbacks[0].created_at
  } : null;

  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pt-16">
        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                Desempenho & KPI
              </h1>
              <p className="text-muted-foreground">
                {isManager ? "Gerencie metas e feedbacks da equipe" : "Acompanhe suas metas e feedbacks"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Month Selector */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 font-medium min-w-[140px] text-center">
                  {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* User Selector (managers only) */}
              {isManager && teamMembers && teamMembers.length > 0 && (
                <Select value={selectedUserId || ''} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecionar vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Manager Actions */}
          {isManager && effectiveUserId && (
            <div className="flex gap-3">
              <Button onClick={() => setShowGoalEditor(true)} variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Definir Metas
              </Button>
              <Button onClick={() => setShowFeedbackForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Lançar Feedback
              </Button>
            </div>
          )}

          {loadingKPI || loadingFeedback ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !effectiveUserId ? (
            <Card className="premium-card">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {isManager ? "Selecione um vendedor para visualizar os KPIs" : "Carregando..."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Card */}
              <KPISummaryCard
                userName={effectiveUser?.name || 'Usuário'}
                avatarUrl={effectiveUser?.avatar_url}
                targetRevenue={kpiData?.target_revenue || 0}
                actualRevenue={kpiData?.actual_revenue || 0}
                lastFeedback={lastFeedback}
              />

              {/* KPI Goal Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPIGoalCard
                  title="Faturamento"
                  target={kpiData?.target_revenue || 0}
                  actual={kpiData?.actual_revenue || 0}
                  type="revenue"
                  formatAsCurrency
                />
                <KPIGoalCard
                  title="Vendas"
                  target={kpiData?.target_deals || 0}
                  actual={kpiData?.actual_deals || 0}
                  type="deals"
                />
                <KPIGoalCard
                  title="Ligações"
                  target={kpiData?.target_calls || 0}
                  actual={kpiData?.actual_calls || 0}
                  type="calls"
                />
                <KPIGoalCard
                  title="Reuniões"
                  target={kpiData?.target_meetings || 0}
                  actual={kpiData?.actual_meetings || 0}
                  type="meetings"
                />
              </div>

              {/* Feedback Section */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">Feedbacks do Mês</CardTitle>
                  <CardDescription>
                    Feedbacks recebidos em {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <KPIFeedbackTabs feedbacks={feedbacks || []} />
                </CardContent>
              </Card>
            </>
          )}

          {/* Modals */}
          {isManager && effectiveUserId && profile?.company_id && (
            <>
              <KPIGoalEditor
                open={showGoalEditor}
                onOpenChange={setShowGoalEditor}
                userId={effectiveUserId}
                userName={effectiveUser?.name || 'Usuário'}
                companyId={profile.company_id}
                month={selectedMonth}
                currentGoals={kpiData ? {
                  target_revenue: kpiData.target_revenue || 0,
                  target_deals: kpiData.target_deals || 0,
                  target_calls: kpiData.target_calls || 0,
                  target_meetings: kpiData.target_meetings || 0
                } : undefined}
              />
              <KPIFeedbackForm
                open={showFeedbackForm}
                onOpenChange={setShowFeedbackForm}
                userId={effectiveUserId}
                userName={effectiveUser?.name || 'Usuário'}
                companyId={profile.company_id}
                month={selectedMonth}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default KPI;
