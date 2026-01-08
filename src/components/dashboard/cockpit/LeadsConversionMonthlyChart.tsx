import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { TrendingUp } from "lucide-react";

interface LeadsConversionData {
  month: string;
  totalLeads: number;
  closedLeads: number;
  conversionRate: number;
}

interface LeadsConversionMonthlyChartProps {
  data: LeadsConversionData[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  const totalLeads = payload.find((p: any) => p.dataKey === 'totalLeads')?.value || 0;
  const closedLeads = payload.find((p: any) => p.dataKey === 'closedLeads')?.value || 0;
  const conversionRate = payload.find((p: any) => p.dataKey === 'conversionRate')?.value || 0;

  return (
    <div className="bg-cockpit-card border border-cockpit-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-cockpit-foreground mb-2">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-cockpit-muted">Total de Leads</span>
          </div>
          <span className="font-medium text-cockpit-foreground">{totalLeads}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-cockpit-muted">Leads Fechados</span>
          </div>
          <span className="font-medium text-cockpit-foreground">{closedLeads}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm border-t border-cockpit-border pt-2 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-cockpit-muted">Taxa de Conversão</span>
          </div>
          <span className="font-medium text-orange-500">{conversionRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export function LeadsConversionMonthlyChart({ 
  data, 
  title = "Leads vs Fechados + Conversão" 
}: LeadsConversionMonthlyChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-cockpit-card border-cockpit-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-cockpit-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cockpit-accent" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-cockpit-muted">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  const maxLeads = Math.max(...data.map(d => Math.max(d.totalLeads, d.closedLeads)));
  const yAxisMax = Math.ceil(maxLeads * 1.2);

  return (
    <Card className="bg-cockpit-card border-cockpit-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-cockpit-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cockpit-accent" />
          {title}
        </CardTitle>
        <p className="text-sm text-cockpit-muted">Evolução mensal de leads e taxa de conversão</p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3} 
              />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                yAxisId="left"
                domain={[0, yAxisMax]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                label={{ 
                  value: 'Leads', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 }
                }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => `${value}%`}
                label={{ 
                  value: 'Conversão %', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    totalLeads: "Total de Leads",
                    closedLeads: "Leads Fechados",
                    conversionRate: "Taxa de Conversão"
                  };
                  return <span className="text-cockpit-muted text-sm">{labels[value] || value}</span>;
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="totalLeads" 
                fill="hsl(215, 70%, 55%)" 
                radius={[4, 4, 0, 0]}
                maxBarSize={35}
                name="totalLeads"
              />
              <Bar 
                yAxisId="left"
                dataKey="closedLeads" 
                fill="hsl(142, 70%, 45%)" 
                radius={[4, 4, 0, 0]}
                maxBarSize={35}
                name="closedLeads"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="conversionRate" 
                stroke="hsl(38, 90%, 50%)" 
                strokeWidth={3}
                dot={{ fill: "hsl(38, 90%, 50%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                name="conversionRate"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
