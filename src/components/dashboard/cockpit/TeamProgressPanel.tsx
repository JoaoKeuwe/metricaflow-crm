import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface TeamProgressPanelProps {
  companyId: string;
  currentUserId: string;
  isManager: boolean;
}

export const TeamProgressPanel = ({ companyId, currentUserId, isManager }: TeamProgressPanelProps) => {
  const currentMonth = startOfMonth(new Date());
  const monthStr = format(currentMonth, 'yyyy-MM-dd');

  const { data: teamKPIs, isLoading } = useQuery({
    queryKey: ['team-kpi-progress', companyId, monthStr],
    queryFn: async () => {
      // Get all KPIs for the month
      const { data: kpis, error } = await supabase
        .from('seller_kpi_monthly')
        .select('*')
        .eq('company_id', companyId)
        .eq('month', monthStr);

      if (error) throw error;
      if (!kpis || kpis.length === 0) return [];

      // Filter by user if not manager
      const filteredKpis = !isManager 
        ? kpis.filter(k => k.user_id === currentUserId)
        : kpis;

      // Get user profiles separately
      const userIds = filteredKpis.map(k => k.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      // Combine KPIs with user data
      return filteredKpis.map(kpi => ({
        ...kpi,
        user: profiles?.find(p => p.id === kpi.user_id) || null
      }));
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <Card className="premium-card">
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!teamKPIs || teamKPIs.length === 0) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Progresso do Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhuma meta definida para este mês.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by percentage achieved
  const sortedKPIs = [...teamKPIs].sort((a, b) => {
    const aPercent = a.target_revenue > 0 ? (a.actual_revenue / a.target_revenue) : 0;
    const bPercent = b.target_revenue > 0 ? (b.actual_revenue / b.target_revenue) : 0;
    return bPercent - aPercent;
  });

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Progresso do Time Comercial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedKPIs.map((kpi) => {
          const percentage = kpi.target_revenue > 0 
            ? (kpi.actual_revenue / kpi.target_revenue) * 100 
            : 0;
          const remaining = Math.max(kpi.target_revenue - kpi.actual_revenue, 0);
          
          const getStatusBadge = () => {
            if (percentage >= 100) return { label: 'Acima', color: 'bg-green-500', icon: TrendingUp };
            if (percentage >= 70) return { label: 'Em linha', color: 'bg-yellow-500', icon: Minus };
            return { label: 'Atenção', color: 'bg-red-500', icon: TrendingDown };
          };
          
          const status = getStatusBadge();
          const StatusIcon = status.icon;

          return (
            <div
              key={kpi.id}
              className={cn(
                "p-4 rounded-lg border transition-all",
                percentage >= 100 ? "border-green-500/30 bg-green-500/5" :
                percentage >= 70 ? "border-yellow-500/30 bg-yellow-500/5" :
                "border-red-500/30 bg-red-500/5"
              )}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={kpi.user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {kpi.user?.name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold truncate">{kpi.user?.name || 'Usuário'}</p>
                    <Badge className={cn("gap-1", status.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>
                      R$ {kpi.actual_revenue?.toLocaleString('pt-BR')} de R$ {kpi.target_revenue?.toLocaleString('pt-BR')}
                    </span>
                    <span className="font-medium text-foreground">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                  />
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {remaining > 0 
                      ? `Falta: R$ ${remaining.toLocaleString('pt-BR')}`
                      : '✓ Meta atingida!'
                    }
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
