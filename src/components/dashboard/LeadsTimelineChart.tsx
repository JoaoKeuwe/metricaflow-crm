import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Evolução de Leads (30 dias)</CardTitle>
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
        <ChartContainer config={chartConfig} className="h-[300px]">
          {chartType === "line" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="novos" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="convertidos" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                <Line type="monotone" dataKey="perdidos" stroke="hsl(var(--chart-3))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="novos" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="convertidos" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="perdidos" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default LeadsTimelineChart;
