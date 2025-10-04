import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LineChartIcon, AreaChartIcon } from "lucide-react";

interface LeadsTimelineChartProps {
  data: Array<{ date: string; novos: number; convertidos: number; perdidos: number }>;
}

const LeadsTimelineChart = ({ data }: LeadsTimelineChartProps) => {
  const [chartType, setChartType] = useState<"line" | "area">("line");

  const chartConfig = {
    novos: { label: "Novos", color: "hsl(var(--chart-1))" },
    convertidos: { label: "Convertidos", color: "hsl(var(--chart-2))" },
    perdidos: { label: "Perdidos", color: "hsl(var(--chart-3))" },
  };

  return (
    <Card className="bg-card border-primary/20 hover:shadow-2xl hover:shadow-success/20 transition-all duration-500 group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center justify-between relative z-10">
        <div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
            Linha do Tempo de Leads
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhamento diário: novos leads, vendas fechadas e perdas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
          >
            <LineChartIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === "area" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("area")}
          >
            <AreaChartIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          {chartType === "line" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  content={({ payload, label }) => {
                    if (!payload?.length) return null;
                    
                    return (
                      <div className="bg-card border border-border rounded-lg p-4 shadow-lg min-w-[200px]">
                        <p className="font-bold text-sm mb-3">{label}</p>
                        <div className="space-y-2">
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex justify-between items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs font-medium">{entry.name === 'novos' ? 'Novos Leads' : entry.name === 'convertidos' ? 'Vendas Fechadas' : 'Leads Perdidos'}:</span>
                              </div>
                              <span className="text-sm font-bold">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="line"
                  wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingBottom: '10px' }}
                  formatter={(value) => {
                    if (value === 'novos') return 'Novos Leads';
                    if (value === 'convertidos') return 'Vendas Fechadas';
                    if (value === 'perdidos') return 'Leads Perdidos';
                    return value;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="novos" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="convertidos" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="perdidos" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  content={({ payload, label }) => {
                    if (!payload?.length) return null;
                    
                    return (
                      <div className="bg-card border border-border rounded-lg p-4 shadow-lg min-w-[200px]">
                        <p className="font-bold text-sm mb-3">{label}</p>
                        <div className="space-y-2">
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex justify-between items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs font-medium">{entry.name === 'novos' ? 'Novos Leads' : entry.name === 'convertidos' ? 'Vendas Fechadas' : 'Leads Perdidos'}:</span>
                              </div>
                              <span className="text-sm font-bold">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="square"
                  wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingBottom: '10px' }}
                  formatter={(value) => {
                    if (value === 'novos') return 'Novos Leads';
                    if (value === 'convertidos') return 'Vendas Fechadas';
                    if (value === 'perdidos') return 'Leads Perdidos';
                    return value;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="novos" 
                  stackId="1" 
                  stroke="hsl(var(--chart-1))" 
                  fill="hsl(var(--chart-1))" 
                  fillOpacity={0.7} 
                />
                <Area 
                  type="monotone" 
                  dataKey="convertidos" 
                  stackId="1" 
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))" 
                  fillOpacity={0.7} 
                />
                <Area 
                  type="monotone" 
                  dataKey="perdidos" 
                  stackId="1" 
                  stroke="hsl(var(--chart-3))" 
                  fill="hsl(var(--chart-3))" 
                  fillOpacity={0.7} 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
        
        {/* Resumo rápido */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Total Novos</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-1))' }}>
                {data.reduce((sum, d) => sum + d.novos, 0)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Total Vendas</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
                {data.reduce((sum, d) => sum + d.convertidos, 0)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Total Perdas</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-3))' }}>
                {data.reduce((sum, d) => sum + d.perdidos, 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsTimelineChart;
