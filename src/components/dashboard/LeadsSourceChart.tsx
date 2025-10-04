import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface LeadsSourceChartProps {
  data: Array<{ source: string; count: number; color: string }>;
}

const LeadsSourceChart = ({ data }: LeadsSourceChartProps) => {
  const chartConfig = data.reduce((acc, item) => {
    acc[item.source] = {
      label: item.source,
      color: item.color,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card className="bg-card border-primary/20 hover:shadow-2xl hover:shadow-accent/20 transition-all duration-500 group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          Leads por Origem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip 
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const data = payload[0];
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-sm mb-1">Origem: {data.name}</p>
                      <p className="text-lg font-bold text-accent">{data.value} leads</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((data.value as number / data.payload.total) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                  );
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
              />
              <Pie
                data={data.map(item => ({ ...item, total: data.reduce((sum, d) => sum + d.count, 0) }))}
                dataKey="count"
                nameKey="source"
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                label={({ count, percent }) => `${count} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default LeadsSourceChart;
