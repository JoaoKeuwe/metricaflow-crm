import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, Legend, CartesianGrid } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChartIcon } from "lucide-react";

interface FinancialMetricsChartProps {
  data: Array<{ month: string; valorEstimado: number; valorConvertido: number }>;
}

const FinancialMetricsChart = ({ data }: FinancialMetricsChartProps) => {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const chartConfig = {
    valorEstimado: { label: "Valor Estimado", color: "hsl(var(--chart-1))" },
    valorConvertido: { label: "Valor Convertido", color: "hsl(var(--chart-2))" },
  };

  return (
    <Card className="bg-card border-primary/20 hover:shadow-2xl hover:shadow-warning/20 transition-all duration-500 group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center justify-between relative z-10">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-warning to-primary bg-clip-text text-transparent">
          Desempenho Financeiro
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar")}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
          >
            <LineChartIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          {chartType === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-sm mb-2">{payload[0]?.payload.month}</p>
                        {payload.map((item, index) => (
                          <div key={index} className="flex items-center justify-between gap-3 mb-1">
                            <span className="text-xs font-medium">{item.name === 'valorEstimado' ? 'Estimado' : 'Convertido'}:</span>
                            <span className="text-sm font-bold" style={{ color: item.color }}>
                              R$ {Number(item.value).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="square"
                  wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
                  formatter={(value) => value === 'valorEstimado' ? 'Valor Estimado' : 'Valor Convertido'}
                />
                <Bar 
                  dataKey="valorEstimado" 
                  fill="hsl(var(--chart-1))" 
                  radius={[8, 8, 0, 0]}
                  label={{ position: 'top', fontSize: 11, fontWeight: 600, fill: 'hsl(var(--foreground))', formatter: (val: number) => `R$ ${(val / 1000).toFixed(0)}k` }}
                />
                <Bar 
                  dataKey="valorConvertido" 
                  fill="hsl(var(--chart-2))" 
                  radius={[8, 8, 0, 0]}
                  label={{ position: 'top', fontSize: 11, fontWeight: 600, fill: 'hsl(var(--foreground))', formatter: (val: number) => `R$ ${(val / 1000).toFixed(0)}k` }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-sm mb-2">{payload[0]?.payload.month}</p>
                        {payload.map((item, index) => (
                          <div key={index} className="flex items-center justify-between gap-3 mb-1">
                            <span className="text-xs font-medium">{item.name === 'valorEstimado' ? 'Estimado' : 'Convertido'}:</span>
                            <span className="text-sm font-bold" style={{ color: item.color }}>
                              R$ {Number(item.value).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="line"
                  wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
                  formatter={(value) => value === 'valorEstimado' ? 'Valor Estimado' : 'Valor Convertido'}
                />
                <Line 
                  type="monotone" 
                  dataKey="valorEstimado" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: 'hsl(var(--chart-1))' }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="valorConvertido" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: 'hsl(var(--chart-2))' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default FinancialMetricsChart;
