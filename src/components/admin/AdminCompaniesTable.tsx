import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminCompanies } from "@/hooks/useAdminData";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const getPlanLabel = (planType: string | undefined) => {
  if (!planType) return "Sem plano";
  const labels: Record<string, string> = {
    individual_monthly: "Individual Mensal",
    individual_yearly: "Individual Anual",
    team_monthly: "Equipe Mensal",
    team_yearly: "Equipe Anual",
    free: "Gratuito",
  };
  return labels[planType] || planType;
};

const getStatusBadge = (status: string | undefined) => {
  if (!status || status === "inactive") {
    return <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>;
  }
  if (status === "active") {
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
  }
  if (status === "trialing") {
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Trial</Badge>;
  }
  if (status === "past_due") {
    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendente</Badge>;
  }
  if (status === "canceled") {
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelado</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
};

export const AdminCompaniesTable = () => {
  const { data: companies, isLoading } = useAdminCompanies();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-4 border-b border-border/30">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Empresas Cadastradas ({companies?.length || 0})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Empresa</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Usuários</TableHead>
              <TableHead className="text-center">Leads</TableHead>
              <TableHead>Stripe ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies?.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>{getPlanLabel(company.subscription?.plan_type)}</TableCell>
                <TableCell>{getStatusBadge(company.subscription?.status)}</TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{company.activeUsers}</span>
                  <span className="text-muted-foreground">
                    /{company.subscription?.user_limit || "-"}
                  </span>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {company.totalLeads.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>
                  {company.subscription?.stripe_customer_id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        window.open(
                          `https://dashboard.stripe.com/customers/${company.subscription?.stripe_customer_id}`,
                          "_blank"
                        );
                      }}
                    >
                      {company.subscription.stripe_customer_id.slice(0, 14)}...
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
