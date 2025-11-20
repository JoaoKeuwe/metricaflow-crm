// Advanced metrics card for CAC, LTV e Payback
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Clock, DollarSign, Info, Settings } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MarketingCostsSettings } from "./MarketingCostsSettings";

interface AdvancedMetricsCardProps {
  cac: number | null;
  ltv: number | null;
  payback: number | null;
  avgTimeInFunnel: number;
}

export const AdvancedMetricsCard = ({ cac, ltv, payback, avgTimeInFunnel }: AdvancedMetricsCardProps) => {
  return (
    <Dialog>
      <Card className="hover:shadow-lg transition-all duration-300 border-accent/20 hover:border-accent/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-accent" />
                Métricas Avançadas
              </CardTitle>
              <CardDescription>
                Análise estratégica de desempenho
              </CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Custos
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="space-y-1 cursor-help p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-chart-4" />
                    <p className="text-sm text-muted-foreground">Tempo Médio no Funil</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{avgTimeInFunnel} dias</p>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">Tempo médio que um lead leva do cadastro até o fechamento</p>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="space-y-1 cursor-help p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-chart-2" />
                    <p className="text-sm text-muted-foreground">CAC - Custo de Aquisição</p>
                  </div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {cac !== null ? `R$ ${cac.toLocaleString('pt-BR')}` : '---'}
                  </p>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">
                  <strong>CAC</strong>: Custo total de Marketing + Vendas dividido pelo número de clientes adquiridos.
                  {cac === null && <><br/><br/>Configure custos de marketing e vendas para ver este valor.</>}
                </p>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="space-y-1 cursor-help p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-chart-5" />
                    <p className="text-sm text-muted-foreground">LTV - Lifetime Value</p>
                  </div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {ltv !== null ? `R$ ${ltv.toLocaleString('pt-BR')}` : '---'}
                  </p>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">
                  <strong>LTV</strong>: Valor médio que um cliente gera durante todo o relacionamento com a empresa.
                  {ltv === null && <><br/><br/>Configure dados de retenção e ticket médio para ver este valor.</>}
                </p>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="space-y-1 cursor-help p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-chart-3" />
                    <p className="text-sm text-muted-foreground">Payback (meses)</p>
                  </div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {payback !== null ? `${payback} meses` : '---'}
                  </p>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">
                  <strong>Payback</strong>: Tempo necessário para recuperar o investimento de aquisição de um cliente (CAC).
                  {payback === null && <><br/><br/>Configure CAC e ticket mensal para ver este valor.</>}
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>

          {(cac === null || ltv === null || payback === null) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Algumas métricas avançadas requerem configuração de custos de marketing e vendas. 
                Clique em "Configurar Custos" acima para adicionar os dados do período.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração de Custos</DialogTitle>
          <DialogDescription>
            Configure os custos de marketing e vendas para cálculo automático de CAC, LTV e Payback
          </DialogDescription>
        </DialogHeader>
        <MarketingCostsSettings />
      </DialogContent>
    </Dialog>
  );
};
