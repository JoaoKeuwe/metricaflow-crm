import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DollarSign, Target, Phone, Calendar } from "lucide-react";

interface KPIGoalCardProps {
  title: string;
  target: number;
  actual: number;
  type: 'revenue' | 'deals' | 'calls' | 'meetings';
  formatAsCurrency?: boolean;
}

const icons = {
  revenue: DollarSign,
  deals: Target,
  calls: Phone,
  meetings: Calendar,
};

export const KPIGoalCard = ({ title, target, actual, type, formatAsCurrency = false }: KPIGoalCardProps) => {
  const percentage = target > 0 ? Math.min((actual / target) * 100, 150) : 0;
  const remaining = Math.max(target - actual, 0);
  
  const Icon = icons[type];
  
  const getStatusColor = () => {
    if (percentage >= 100) return "text-green-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-red-500";
  };
  
  const getProgressColor = () => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const formatValue = (value: number) => {
    if (formatAsCurrency) {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return value.toString();
  };

  return (
    <Card className="premium-card hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {formatValue(actual)}
            </p>
            <p className="text-xs text-muted-foreground">
              de {formatValue(target)}
            </p>
          </div>
          <div className={cn("text-2xl font-bold", getStatusColor())}>
            {percentage.toFixed(0)}%
          </div>
        </div>
        
        <div className="space-y-1">
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-2"
            style={{
              ['--progress-background' as string]: percentage >= 100 ? 'rgb(34 197 94)' : percentage >= 70 ? 'rgb(234 179 8)' : 'rgb(239 68 68)'
            }}
          />
          <p className="text-xs text-muted-foreground text-right">
            {remaining > 0 ? `Falta: ${formatValue(remaining)}` : '✓ Meta atingida!'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
