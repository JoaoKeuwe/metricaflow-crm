import { Building2, Users, Target, DollarSign, CreditCard, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminMetrics } from "@/hooks/useAdminData";

export const AdminMetricsCards = () => {
  const metrics = useAdminMetrics();

  const cards = [
    {
      title: "Empresas",
      value: metrics.totalCompanies,
      icon: Building2,
      description: `${metrics.activeSubscriptions} com assinatura ativa`,
    },
    {
      title: "Usuários",
      value: metrics.activeUsers,
      icon: Users,
      description: `${metrics.totalUsers} total no sistema`,
    },
    {
      title: "Leads",
      value: metrics.totalLeads.toLocaleString("pt-BR"),
      icon: Target,
      description: "Total de leads no sistema",
    },
    {
      title: "MRR",
      value: `R$ ${metrics.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      description: "Receita mensal recorrente",
    },
    {
      title: "Receita Total",
      value: `R$ ${metrics.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Total faturado (Stripe)",
    },
    {
      title: "Clientes Stripe",
      value: metrics.stripeCustomers,
      icon: CreditCard,
      description: "Clientes registrados no Stripe",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="premium-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <card.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{card.title}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
