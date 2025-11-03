import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ReminderStatsProps {
  reminders: any[];
}

export function ReminderStats({ reminders }: ReminderStatsProps) {
  const total = reminders.length;
  const pending = reminders.filter((r) => !r.completed).length;
  const completed = reminders.filter((r) => r.completed).length;
  const overdue = reminders.filter(
    (r) => !r.completed && new Date(r.reminder_date) < new Date()
  ).length;

  const stats = [
    {
      title: "Total",
      value: total,
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Pendentes",
      value: pending,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Concluídos",
      value: completed,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Vencidos",
      value: overdue,
      icon: AlertCircle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
