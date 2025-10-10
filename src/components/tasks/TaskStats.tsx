import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { isPast } from "date-fns";

interface TaskStatsProps {
  tasks: any[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const openTasks = tasks.filter((t) => t.status === "aberta" || t.status === "em_andamento");
  const overdueTasks = tasks.filter(
    (t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "concluida"
  );
  const completedThisWeek = tasks.filter((t) => {
    if (t.status !== "concluida") return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(t.updated_at) >= weekAgo;
  });

  const completedTotal = tasks.filter((t) => t.status === "concluida").length;
  const completionRate = tasks.length > 0 ? (completedTotal / tasks.length) * 100 : 0;

  const stats = [
    {
      title: "Tarefas Abertas",
      value: openTasks.length,
      icon: Clock,
      color: "text-blue-500",
    },
    {
      title: "Tarefas Atrasadas",
      value: overdueTasks.length,
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: "Concluídas (7 dias)",
      value: completedThisWeek.length,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: "Taxa de Conclusão",
      value: `${completionRate.toFixed(0)}%`,
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
