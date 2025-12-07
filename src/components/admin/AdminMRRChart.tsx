import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign } from "lucide-react";

interface StripeInvoice {
  id: string;
  amount_paid: number;
  created: number;
  status: string;
}

interface AdminMRRChartProps {
  invoices: StripeInvoice[];
  currentMRR: number;
}

export const AdminMRRChart = ({ invoices, currentMRR }: AdminMRRChartProps) => {
  // Generate last 12 months data
  const getLast12Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      });
    }
    return months;
  };

  const months = getLast12Months();

  // Calculate revenue per month from paid invoices
  const revenuePerMonth = months.map(({ month, monthKey }) => {
    const monthRevenue = invoices
      .filter((inv) => {
        if (inv.status !== "paid") return false;
        const invDate = new Date(inv.created * 1000);
        const invKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}`;
        return invKey === monthKey;
      })
      .reduce((sum, inv) => sum + (inv.amount_paid / 100), 0);

    return { month, receita: monthRevenue };
  });

  // Calculate growth rate
  const lastMonth = revenuePerMonth[revenuePerMonth.length - 1]?.receita || 0;
  const previousMonth = revenuePerMonth[revenuePerMonth.length - 2]?.receita || 0;
  const growthRate = previousMonth > 0 
    ? ((lastMonth - previousMonth) / previousMonth * 100).toFixed(1) 
    : "0";

  return (
    <Card className="premium-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Evolução da Receita
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <span className="text-muted-foreground">MRR Atual</span>
              <p className="font-bold text-primary">
                R$ {currentMRR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Crescimento</span>
              <p className={`font-bold ${Number(growthRate) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {Number(growthRate) >= 0 ? "+" : ""}{growthRate}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenuePerMonth}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Receita"]}
              />
              <Area 
                type="monotone" 
                dataKey="receita" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReceita)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
