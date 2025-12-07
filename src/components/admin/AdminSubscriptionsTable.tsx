import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, ExternalLink, AlertCircle } from "lucide-react";
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
import { useAdminStripeData } from "@/hooks/useAdminData";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const getStatusBadge = (status: string) => {
  const statuses: Record<string, { label: string; className: string }> = {
    active: {
      label: "Ativo",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    trialing: {
      label: "Trial",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    past_due: {
      label: "Pendente",
      className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    canceled: {
      label: "Cancelado",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    incomplete: {
      label: "Incompleto",
      className: "bg-muted text-muted-foreground",
    },
    incomplete_expired: {
      label: "Expirado",
      className: "bg-muted text-muted-foreground",
    },
    unpaid: {
      label: "Não Pago",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

  const config = statuses[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={config.className}>{config.label}</Badge>;
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

export const AdminSubscriptionsTable = () => {
  const { data: stripeData, isLoading, error } = useAdminStripeData();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-card p-6">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar dados do Stripe: {(error as Error).message}</span>
        </div>
      </div>
    );
  }

  const subscriptions = stripeData?.subscriptions || [];

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-4 border-b border-border/30">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Assinaturas Stripe ({subscriptions.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ID Assinatura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Intervalo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próxima Cobrança</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma assinatura encontrada
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => {
                const item = sub.items[0];
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">
                      {sub.id.slice(0, 20)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {typeof sub.customer === 'string' ? sub.customer.slice(0, 14) : '-'}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {item ? formatCurrency(item.amount, item.currency) : "-"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {item?.interval === "month" ? "Mensal" : item?.interval === "year" ? "Anual" : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(sub.current_period_end * 1000), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          window.open(
                            `https://dashboard.stripe.com/subscriptions/${sub.id}`,
                            "_blank"
                          );
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
