import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, MessageSquare, Calendar, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalespersonActivity {
  name: string;
  meetings: number;
  tasks: number;
  observations: number;
  avatar?: string;
}

interface ActivityBreakdownPanelProps {
  data: SalespersonActivity[];
  title?: string;
}

export const ActivityBreakdownPanel = ({ 
  data, 
  title = "Atividades por Vendedor" 
}: ActivityBreakdownPanelProps) => {
  const totalMeetings = data.reduce((sum, d) => sum + d.meetings, 0);
  const totalTasks = data.reduce((sum, d) => sum + d.tasks, 0);
  const totalObservations = data.reduce((sum, d) => sum + d.observations, 0);
  const totalActivities = totalMeetings + totalTasks + totalObservations;

  const chartData = data.map(d => ({
    name: d.name.split(' ')[0], // First name only for chart
    Reuniões: d.meetings,
    Tarefas: d.tasks,
    Observações: d.observations,
    total: d.meetings + d.tasks + d.observations
  })).sort((a, b) => b.total - a.total);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-sm">Nenhum dado de atividades disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-wide">
            {title}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {totalActivities} atividades totais
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 px-5 py-4 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-chart-1/10">
            <Calendar className="h-4 w-4 text-chart-1" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reuniões</p>
            <p className="text-lg font-bold text-foreground">{totalMeetings}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-chart-2/10">
            <CheckSquare className="h-4 w-4 text-chart-2" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tarefas</p>
            <p className="text-lg font-bold text-foreground">{totalTasks}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-chart-3/10">
            <MessageSquare className="h-4 w-4 text-chart-3" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Observações</p>
            <p className="text-lg font-bold text-foreground">{totalObservations}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              type="number" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={80}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '16px' }}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <Bar dataKey="Reuniões" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Tarefas" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Observações" stackId="a" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
