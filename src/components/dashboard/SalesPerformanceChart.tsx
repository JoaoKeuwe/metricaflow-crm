import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface SalesPerformanceChartProps {
  data: Array<{ vendedor: string; leads: number; convertidos: number; taxa: number }>;
}

const SalesPerformanceChart = ({ data }: SalesPerformanceChartProps) => {
  const chartConfig = {
    leads: { label: "Total de Leads", color: "hsl(var(--chart-1))" },
    convertidos: { label: "Convertidos", color: "hsl(var(--chart-2))" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho por Vendedor</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="vendedor" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="leads" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="convertidos" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default SalesPerformanceChart;
