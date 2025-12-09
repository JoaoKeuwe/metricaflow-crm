import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  wonDeals: number;
  revenue: number;
  conversionRate: number;
  trend?: number;
}

interface TeamPerformancePanelProps {
  members: TeamMember[];
  title?: string;
}

export const TeamPerformancePanel = ({ 
  members, 
  title = "Ranking do Time" 
}: TeamPerformancePanelProps) => {
  const sortedMembers = [...members].sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = sortedMembers.length > 0 ? sortedMembers[0].revenue : 0;

  const getMedalColor = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-900";
    if (index === 1) return "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-800";
    if (index === 2) return "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900";
    return "bg-cockpit-muted/20 text-cockpit-muted";
  };

  return (
    <div className="rounded-xl bg-cockpit-card border border-cockpit-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cockpit-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-cockpit-foreground tracking-wide">
            {title}
          </h3>
        </div>
        <span className="text-xs text-cockpit-muted">
          {sortedMembers.length} membros
        </span>
      </div>

      {/* Members List */}
      <div className="divide-y divide-cockpit-border/50">
        {sortedMembers.slice(0, 5).map((member, index) => {
          const progressWidth = maxRevenue > 0 ? (member.revenue / maxRevenue) * 100 : 0;
          
          return (
            <div 
              key={member.id}
              className="px-5 py-4 flex items-center gap-4 hover:bg-cockpit-muted/5 transition-colors group"
            >
              {/* Rank */}
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                getMedalColor(index)
              )}>
                {index + 1}
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10 border-2 border-cockpit-border">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="bg-cockpit-accent/10 text-cockpit-accent text-sm font-medium">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-cockpit-foreground truncate">
                    {member.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-cockpit-foreground">
                      R$ {member.revenue.toLocaleString('pt-BR')}
                    </span>
                    {member.trend !== undefined && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-xs",
                        member.trend >= 0 ? "text-cockpit-success" : "text-cockpit-danger"
                      )}>
                        {member.trend >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(member.trend)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-cockpit-muted/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cockpit-accent to-cockpit-accent/50 rounded-full transition-all duration-700"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                  <span className="text-xs text-cockpit-muted flex-shrink-0">
                    {member.wonDeals} vendas · {member.conversionRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
