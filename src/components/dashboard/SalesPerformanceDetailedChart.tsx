import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, FileText } from "lucide-react";

interface SalesPerformanceDetailedData {
  vendedor: string;
  leads: number;
  convertidos: number;
  taxa: number;
  observacoes: number;
  tempoMedio: number; // em dias
}

interface SalesPerformanceDetailedChartProps {
  data: SalesPerformanceDetailedData[];
}

const SalesPerformanceDetailedChart = ({ data }: SalesPerformanceDetailedChartProps) => {
  const chartConfig = {
    leads: { label: "Total de Leads", color: "hsl(var(--chart-1))" },
    convertidos: { label: "Convertidos", color: "hsl(var(--chart-5))" },
  };

  return (
    <Card className="bg-card border-primary/20 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
          Desempenho Detalhado por Vendedor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gráfico de Barras */}
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="vendedor" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="leads" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="convertidos" fill="hsl(var(--chart-5))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Tabela de Métricas Detalhadas */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Métricas Detalhadas
          </h4>
          <div className="grid gap-3">
            {data.map((vendedor, index) => (
              <div
                key={index}
                className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-semibold">{vendedor.vendedor}</h5>
                  <Badge
                    variant={vendedor.taxa >= 50 ? "default" : "secondary"}
                    className="ml-2"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {vendedor.taxa}% conversão
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Leads</p>
                    <p className="font-semibold text-lg">{vendedor.leads}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Convertidos</p>
                    <p className="font-semibold text-lg text-success">
                      {vendedor.convertidos}
                    </p>
                  </div>
                  <div className="flex items-start gap-1">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Observações</p>
                      <p className="font-semibold text-lg">{vendedor.observacoes}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Tempo Médio</p>
                      <p className="font-semibold text-lg">
                        {vendedor.tempoMedio} dias
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesPerformanceDetailedChart;
