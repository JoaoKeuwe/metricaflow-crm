import { Trophy, TrendingUp, TrendingDown, Medal } from "lucide-react";
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
  activities?: number;
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

  const getMedalStyle = (index: number) => {
    if (index === 0) return {
      bg: "bg-gradient-to-br from-amber-400 to-amber-600",
      text: "text-amber-900",
      ring: "ring-2 ring-amber-300"
    };
    if (index === 1) return {
      bg: "bg-gradient-to-br from-slate-300 to-slate-400",
      text: "text-slate-700",
      ring: "ring-2 ring-slate-200"
    };
    if (index === 2) return {
      bg: "bg-gradient-to-br from-orange-400 to-orange-600",
      text: "text-orange-900",
      ring: "ring-2 ring-orange-300"
    };
    return {
      bg: "bg-[hsl(0_0%_92%)] dark:bg-[hsl(0_0%_20%)]",
      text: "text-[hsl(0_0%_40%)] dark:text-[hsl(0_0%_60%)]",
      ring: ""
    };
  };

  if (!members || members.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)]">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[hsl(330_100%_62%)]" />
            <h3 className="text-sm font-semibold text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)]">
              {title}
            </h3>
          </div>
        </div>
        <div className="p-8 text-center text-[hsl(0_0%_50%)]">
          <p className="text-sm">Nenhum dado de equipe disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[hsl(330_100%_62%/0.1)]">
            <Trophy className="h-4 w-4 text-[hsl(330_100%_62%)]" />
          </div>
          <h3 className="text-sm font-semibold text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)] tracking-wide">
            {title}
          </h3>
        </div>
        <span className="text-xs text-[hsl(0_0%_50%)]">
          {sortedMembers.length} vendedores
        </span>
      </div>

      {/* Column Headers */}
      <div className="px-5 py-2 bg-[hsl(0_0%_98%)] dark:bg-[hsl(0_0%_6%)] border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)]">
        <div className="grid grid-cols-12 gap-4 text-[10px] font-semibold text-[hsl(0_0%_45%)] uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Vendedor</div>
          <div className="col-span-2 text-right">Vendas</div>
          <div className="col-span-3 text-right">Receita</div>
          <div className="col-span-2 text-right">Conv.</div>
        </div>
      </div>

      {/* Members List */}
      <div className="divide-y divide-[hsl(0_0%_95%)] dark:divide-[hsl(0_0%_12%)]">
        {sortedMembers.slice(0, 5).map((member, index) => {
          const progressWidth = maxRevenue > 0 ? (member.revenue / maxRevenue) * 100 : 0;
          const medal = getMedalStyle(index);
          
          return (
            <div 
              key={member.id}
              className="px-5 py-4 hover:bg-[hsl(0_0%_98%)] dark:hover:bg-[hsl(0_0%_10%)] transition-colors group"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Rank */}
                <div className="col-span-1">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    medal.bg, medal.text, medal.ring
                  )}>
                    {index + 1}
                  </div>
                </div>

                {/* Avatar + Name */}
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_20%)]">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="bg-[hsl(330_100%_62%/0.1)] text-[hsl(330_100%_62%)] text-xs font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[hsl(0_0%_15%)] dark:text-[hsl(0_0%_90%)] truncate">
                      {member.name}
                    </p>
                    {member.trend !== undefined && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-[10px] font-medium",
                        member.trend >= 0 ? "text-[hsl(142_70%_40%)]" : "text-[hsl(0_75%_50%)]"
                      )}>
                        {member.trend >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(member.trend)}% vs mês anterior
                      </span>
                    )}
                  </div>
                </div>

                {/* Won Deals */}
                <div className="col-span-2 text-right">
                  <span className="text-sm font-bold text-[hsl(0_0%_15%)] dark:text-[hsl(0_0%_90%)]">
                    {member.wonDeals}
                  </span>
                </div>

                {/* Revenue with progress bar */}
                <div className="col-span-3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-[hsl(0_0%_15%)] dark:text-[hsl(0_0%_90%)]">
                      R$ {member.revenue.toLocaleString('pt-BR')}
                    </span>
                    <div className="w-full h-1.5 bg-[hsl(0_0%_92%)] dark:bg-[hsl(0_0%_15%)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[hsl(330_100%_62%)] to-[hsl(330_80%_50%)] rounded-full transition-all duration-700"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="col-span-2 text-right">
                  <span className={cn(
                    "text-sm font-bold",
                    member.conversionRate >= 20 
                      ? "text-[hsl(142_70%_40%)]" 
                      : member.conversionRate >= 10 
                      ? "text-[hsl(38_90%_45%)]"
                      : "text-[hsl(0_75%_50%)]"
                  )}>
                    {member.conversionRate.toFixed(0)}%
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