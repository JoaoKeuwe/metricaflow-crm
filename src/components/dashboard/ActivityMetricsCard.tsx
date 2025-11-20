import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, CalendarClock, Activity, Target } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface ActivityMetricsCardProps {
  scheduledMeetings: number;
  completedMeetings: number;
  totalActivities: number;
  qualifiedLeads: number;
}

export const ActivityMetricsCard = ({
  scheduledMeetings,
  completedMeetings,
  totalActivities,
  qualifiedLeads,
}: ActivityMetricsCardProps) => {
  const completionRate = scheduledMeetings > 0 
    ? ((completedMeetings / scheduledMeetings) * 100).toFixed(1) 
    : '0.0';

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Métricas de Atividade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="space-y-1 cursor-help p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-chart-2" />
                  <p className="text-sm text-muted-foreground">Reuniões Agendadas</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{scheduledMeetings}</p>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm">Total de reuniões agendadas no período (excluindo canceladas)</p>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="space-y-1 cursor-help p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-chart-5" />
                  <p className="text-sm text-muted-foreground">Reuniões Realizadas</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{completedMeetings}</p>
                <p className="text-xs text-muted-foreground">{completionRate}% concluídas</p>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm">Reuniões com status "realizada"</p>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="space-y-1 cursor-help p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-chart-3" />
                  <p className="text-sm text-muted-foreground">Atividades Totais</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalActivities}</p>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm">Soma de reuniões, tarefas e observações registradas</p>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="space-y-1 cursor-help p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-chart-4" />
                  <p className="text-sm text-muted-foreground">Leads Qualificados</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{qualifiedLeads}</p>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm">Leads marcados como qualificados (SQL) no período</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </CardContent>
    </Card>
  );
};
