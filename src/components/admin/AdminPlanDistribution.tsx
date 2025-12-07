import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { PieChartIcon, BarChart3 } from "lucide-react";

interface StripeSubscription {
  id: string;
  status: string;
  items: Array<{
    price_id: string;
    product_id: string;
    amount: number;
    interval: string;
  }>;
}

interface AdminPlanDistributionProps {
  subscriptions: StripeSubscription[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(220, 70%, 50%)",
  "hsl(280, 70%, 50%)",
  "hsl(340, 70%, 50%)",
  "hsl(160, 70%, 50%)",
];

export const AdminPlanDistribution = ({ subscriptions }: AdminPlanDistributionProps) => {
  // Calculate plan distribution
  const planCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  subscriptions.forEach((sub) => {
    // Status counts
    statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;

    // Plan type (monthly vs yearly)
    const interval = sub.items[0]?.interval || "unknown";
    const planKey = interval === "year" ? "Anual" : interval === "month" ? "Mensal" : "Outro";
    planCounts[planKey] = (planCounts[planKey] || 0) + 1;
  });

  const planData = Object.entries(planCounts).map(([name, value]) => ({ name, value }));
  
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status === "active" ? "Ativa" :
            status === "canceled" ? "Cancelada" :
            status === "past_due" ? "Atrasada" :
            status === "trialing" ? "Trial" :
            status === "incomplete" ? "Incompleta" : status,
    count,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} assinaturas
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Plan Type Distribution */}
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Distribuição por Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {planData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {planData.map((plan, index) => (
              <div key={plan.name} className="text-center">
                <div 
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <p className="text-sm font-medium text-foreground">{plan.value}</p>
                <p className="text-xs text-muted-foreground">{plan.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status Distribution */}
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Status das Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="status"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`${value} assinaturas`, "Quantidade"]}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
