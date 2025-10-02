import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Desempenho Financeiro</CardTitle>
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
        <ChartContainer config={chartConfig} className="h-[300px]">
          {chartType === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="valorEstimado" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="valorConvertido" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="valorEstimado" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="valorConvertido" stroke="hsl(var(--chart-2))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default FinancialMetricsChart;
