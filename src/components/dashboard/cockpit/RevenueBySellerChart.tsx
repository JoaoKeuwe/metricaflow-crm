import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign } from "lucide-react";

interface RevenueBySellerData {
  month: string;
  [sellerName: string]: number | string;
}

interface SellerInfo {
  name: string;
  color: string;
}

interface RevenueBySellerChartProps {
  data: RevenueBySellerData[];
  sellers: SellerInfo[];
  title?: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(215, 70%, 55%)",
  "hsl(255, 60%, 60%)",
  "hsl(38, 90%, 50%)",
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  return (
    <div className="bg-cockpit-card border border-cockpit-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-cockpit-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-cockpit-muted">{entry.name}</span>
            </div>
            <span className="font-medium text-cockpit-foreground">
              R$ {Number(entry.value).toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function RevenueBySellerChart({ data, sellers, title = "Receita por Vendedor" }: RevenueBySellerChartProps) {
  const sellerColors = useMemo(() => {
    return sellers.map((seller, index) => ({
      ...seller,
      color: seller.color || CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [sellers]);

  if (!data || data.length === 0 || sellers.length === 0) {
    return (
      <Card className="bg-cockpit-card border-cockpit-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-cockpit-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cockpit-accent" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-cockpit-muted">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cockpit-card border-cockpit-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-cockpit-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-cockpit-accent" />
          {title}
        </CardTitle>
        <p className="text-sm text-cockpit-muted">Receita mensal por vendedor</p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
                tickFormatter={formatCurrency}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-cockpit-muted text-sm">{value}</span>
                )}
              />
              {sellerColors.map((seller) => (
                <Bar
                  key={seller.name}
                  dataKey={seller.name}
                  fill={seller.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
