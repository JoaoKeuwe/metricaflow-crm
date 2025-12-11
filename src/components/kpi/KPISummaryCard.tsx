import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Minus, MessageSquare, AlertTriangle, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPISummaryCardProps {
  userName: string;
  avatarUrl?: string | null;
  targetRevenue: number;
  actualRevenue: number;
  lastFeedback?: {
    type: 'positivo' | 'negativo' | 'advertencia';
    title: string;
    date: string;
  } | null;
}

export const KPISummaryCard = ({ 
  userName, 
  avatarUrl, 
  targetRevenue, 
  actualRevenue,
  lastFeedback 
}: KPISummaryCardProps) => {
  const percentage = targetRevenue > 0 ? (actualRevenue / targetRevenue) * 100 : 0;
  const remaining = Math.max(targetRevenue - actualRevenue, 0);
  
  const getStatus = () => {
    if (percentage >= 100) return { label: 'Excelente', color: 'bg-green-500', icon: TrendingUp };
    if (percentage >= 70) return { label: 'Em Linha', color: 'bg-yellow-500', icon: Minus };
    return { label: 'Atenção', color: 'bg-red-500', icon: TrendingDown };
  };
  
  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'positivo': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negativo': return <MessageSquare className="h-4 w-4 text-yellow-500" />;
      case 'advertencia': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };
  
  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="premium-card border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/30">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{userName}</p>
            <p className="text-sm text-muted-foreground font-normal">Desempenho do Mês</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{percentage.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">da meta</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              R$ {(remaining / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted-foreground">falta</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <Badge className={cn("gap-1", status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">status</p>
          </div>
        </div>
        
        {lastFeedback && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Último feedback:</p>
            <div className="flex items-center gap-2">
              {getFeedbackIcon(lastFeedback.type)}
              <span className="text-sm truncate">{lastFeedback.title}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(lastFeedback.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
