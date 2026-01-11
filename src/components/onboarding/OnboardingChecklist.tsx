import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Users, 
  Target, 
  Mail, 
  Palette, 
  BookOpen,
  ArrowRight,
  Rocket
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action: () => void;
  actionLabel: string;
}

const OnboardingChecklist = () => {
  const navigate = useNavigate();

  // Verificar se há vendedores convidados
  const { data: invitesCount } = useQuery({
    queryKey: ["onboarding-invites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) return 0;

      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .neq("id", user.id);

      return count || 0;
    },
  });

  // Verificar se há metas configuradas
  const { data: kpiCount } = useQuery({
    queryKey: ["onboarding-kpi"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) return 0;

      const { count } = await supabase
        .from("seller_kpi_monthly")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id);

      return count || 0;
    },
  });

  // Verificar se relatórios estão configurados
  const { data: reportSettings } = useQuery({
    queryKey: ["onboarding-reports"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) return null;

      const { data } = await supabase
        .from("report_settings")
        .select("*")
        .eq("company_id", profile.company_id)
        .maybeSingle();

      return data;
    },
  });

  // Verificar se há guias de pipeline
  const { data: pipelineGuides } = useQuery({
    queryKey: ["onboarding-guides"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) return 0;

      const { count } = await supabase
        .from("pipeline_stage_guides")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id);

      return count || 0;
    },
  });

  // Verificar personalização da empresa
  const { data: companySettings } = useQuery({
    queryKey: ["onboarding-company"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company:companies(*)")
        .eq("id", user.id)
        .single();

      return profile?.company;
    },
  });

  const checklistItems: ChecklistItem[] = [
    {
      id: "team",
      title: "Convidar equipe de vendas",
      description: "Adicione vendedores para começar a usar o sistema",
      icon: Users,
      completed: (invitesCount || 0) > 0,
      action: () => navigate("/users"),
      actionLabel: "Convidar",
    },
    {
      id: "goals",
      title: "Definir metas mensais",
      description: "Configure metas de vendas para sua equipe",
      icon: Target,
      completed: (kpiCount || 0) > 0,
      action: () => navigate("/kpi"),
      actionLabel: "Definir metas",
    },
    {
      id: "reports",
      title: "Configurar relatórios",
      description: "Ative relatórios diários e semanais por email",
      icon: Mail,
      completed: reportSettings?.daily_reports_enabled === true || reportSettings?.weekly_reports_enabled === true,
      action: () => navigate("/settings/reports"),
      actionLabel: "Configurar",
    },
    {
      id: "branding",
      title: "Personalizar empresa",
      description: "Adicione logo e nome do sistema",
      icon: Palette,
      completed: !!companySettings?.logo_url || !!companySettings?.system_name,
      action: () => navigate("/settings"),
      actionLabel: "Personalizar",
    },
    {
      id: "manual",
      title: "Criar manual de vendas",
      description: "Configure scripts e guias para cada etapa do funil",
      icon: BookOpen,
      completed: (pipelineGuides || 0) > 0,
      action: () => navigate("/settings?tab=manual"),
      actionLabel: "Criar manual",
    },
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const progress = (completedCount / checklistItems.length) * 100;
  const isComplete = completedCount === checklistItems.length;

  if (isComplete) {
    return null; // Não mostrar se tudo estiver completo
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Configure seu CRM</CardTitle>
              <CardDescription>
                Complete estas etapas para aproveitar ao máximo
              </CardDescription>
            </div>
          </div>
          <Badge variant={isComplete ? "default" : "secondary"}>
            {completedCount}/{checklistItems.length}
          </Badge>
        </div>
        <Progress value={progress} className="mt-4 h-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                item.completed 
                  ? "bg-muted/30" 
                  : "bg-card border border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium text-sm ${item.completed ? "text-muted-foreground line-through" : ""}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              {!item.completed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={item.action}
                  className="gap-1 text-primary hover:text-primary"
                >
                  {item.actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;