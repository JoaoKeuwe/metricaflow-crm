import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, DollarSign } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface ForecastCardProps {
  forecastValue: number;
  currentRevenue: number;
  targetRevenue?: number;
}

export const ForecastCard = ({ forecastValue, currentRevenue, targetRevenue }: ForecastCardProps) => {
  const totalProjected = currentRevenue + forecastValue;
  const progressPercentage = targetRevenue && targetRevenue > 0 
    ? Math.min((totalProjected / targetRevenue) * 100, 100) 
    : 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Forecast de Fechamento
        </CardTitle>
        <CardDescription>
          Projeção de receita com base no pipeline atual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="space-y-1 cursor-help p-4 rounded-lg bg-chart-5/10 border border-chart-5/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-chart-5" />
                  <p className="text-sm text-muted-foreground">Receita Atual</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  R$ {currentRevenue.toLocaleString('pt-BR')}
                </p>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm">Valor total de vendas já fechadas no período</p>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="space-y-1 cursor-help p-4 rounded-lg bg-chart-3/10 border border-chart-3/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-chart-3" />
                  <p className="text-sm text-muted-foreground">Previsão Pipeline</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  R$ {forecastValue.toLocaleString('pt-BR')}
                </p>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm">Valor estimado de fechamento baseado em probabilidades por etapa:<br/>
              • Novo: 10%<br/>
              • Contato Feito: 20%<br/>
              • Proposta: 40%<br/>
              • Negociação: 70%</p>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="space-y-1 cursor-help p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Projeção Total</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  R$ {totalProjected.toLocaleString('pt-BR')}
                </p>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm">Receita atual + previsão de fechamento do pipeline</p>
            </HoverCardContent>
          </HoverCard>
        </div>

        {targetRevenue && targetRevenue > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso em relação à meta</span>
              <span className="font-semibold text-foreground">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              Meta: R$ {targetRevenue.toLocaleString('pt-BR')} | 
              Faltam: R$ {Math.max(0, targetRevenue - totalProjected).toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
