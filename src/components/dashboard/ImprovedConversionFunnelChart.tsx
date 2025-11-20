import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowDown, TrendingDown } from "lucide-react";

interface ImprovedConversionFunnelChartProps {
  data: Array<{
    stage: string;
    count: number;
    color: string;
  }>;
  conversionRates?: Array<{
    from: string;
    to: string;
    rate: string;
  }>;
}

export const ImprovedConversionFunnelChart = ({ data, conversionRates }: ImprovedConversionFunnelChartProps) => {
  const maxCount = Math.max(...data.map(d => d.count));

  const getDropOffRate = (currentIndex: number) => {
    if (currentIndex === 0 || currentIndex >= data.length) return null;
    const previousCount = data[currentIndex - 1].count;
    const currentCount = data[currentIndex].count;
    if (previousCount === 0) return null;
    const dropOff = ((previousCount - currentCount) / previousCount) * 100;
    return dropOff > 0 ? dropOff.toFixed(1) : null;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          Funil de Conversão
        </CardTitle>
        <CardDescription>
          Acompanhamento detalhado por etapa do pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((stage, index) => {
            const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const dropOffRate = getDropOffRate(index);
            const conversionRate = conversionRates?.find(
              cr => cr.to === stage.stage.toLowerCase().replace(' ', '_')
            );

            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground min-w-[140px]">{stage.stage}</span>
                    <span className="text-2xl font-bold text-foreground">{stage.count}</span>
                    {conversionRate && (
                      <span className="text-sm text-muted-foreground">
                        ({conversionRate.rate} de conversão)
                      </span>
                    )}
                  </div>
                  {dropOffRate && (
                    <div className="flex items-center gap-1 text-destructive text-sm">
                      <TrendingDown className="h-4 w-4" />
                      <span>-{dropOffRate}%</span>
                    </div>
                  )}
                </div>
                
                <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 flex items-center justify-start px-4"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: stage.color,
                      minWidth: stage.count > 0 ? '60px' : '0px',
                    }}
                  >
                    <span className="text-sm font-semibold text-white drop-shadow-md">
                      {((stage.count / (data[0]?.count || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {index < data.length - 1 && (
                  <div className="flex items-center justify-center py-1">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Taxa de Conversão Geral</p>
              <p className="text-xl font-bold text-primary">
                {data[0]?.count > 0 
                  ? ((data[data.length - 1]?.count / data[0]?.count) * 100).toFixed(1)
                  : '0.0'}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Total no Funil</p>
              <p className="text-xl font-bold text-foreground">
                {data.reduce((sum, stage) => sum + stage.count, 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
