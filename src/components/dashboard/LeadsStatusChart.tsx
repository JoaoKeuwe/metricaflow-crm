import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, Tooltip } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PieChartIcon, BarChart3 } from "lucide-react";

interface LeadsStatusChartProps {
  data: Array<{ status: string; count: number; color: string }>;
}

const LeadsStatusChart = ({ data }: LeadsStatusChartProps) => {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  const chartConfig = data.reduce((acc, item) => {
    acc[item.status] = {
      label: item.status,
      color: item.color,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card className="bg-card border-primary/20 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center justify-between relative z-10">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Leads por Status
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={chartType === "pie" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("pie")}
          >
            <PieChartIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar")}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          {chartType === "pie" ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const data = payload[0];
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-sm mb-1">{data.name}</p>
                        <p className="text-lg font-bold text-primary">{data.value} leads</p>
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
                  nameKey="status"
                  cx="50%"
                  cy="45%"
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
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const data = payload[0];
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-sm mb-1">{data.payload.status}</p>
                        <p className="text-lg font-bold text-primary">{data.value} leads</p>
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
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                  label={{ position: 'top', fontSize: 12, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default LeadsStatusChart;
