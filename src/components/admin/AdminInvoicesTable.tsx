import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, ExternalLink, Download, AlertCircle } from "lucide-react";
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
    paid: {
      label: "Pago",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    open: {
      label: "Aberto",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    draft: {
      label: "Rascunho",
      className: "bg-muted text-muted-foreground",
    },
    void: {
      label: "Cancelado",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    uncollectible: {
      label: "Incobrável",
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

export const AdminInvoicesTable = () => {
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
          <span>Erro ao carregar faturas: {(error as Error).message}</span>
        </div>
      </div>
    );
  }

  const invoices = stripeData?.invoices || [];

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-4 border-b border-border/30">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Faturas ({invoices.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma fatura encontrada
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs">
                    {invoice.number || invoice.id.slice(0, 15)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.customer_email || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(invoice.created * 1000), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {invoice.hosted_invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => window.open(invoice.hosted_invoice_url!, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      {invoice.invoice_pdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => window.open(invoice.invoice_pdf!, "_blank")}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
