import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateUserStats,
  calculateBadges,
  formatPoints,
  getRankColor,
  getMedalEmoji,
} from "@/lib/gamification";
import { Trophy, TrendingUp } from "lucide-react";

export function LeaderboardLive() {
  // Buscar todos os eventos dos últimos 30 dias
  const { data: events, isLoading } = useQuery({
    queryKey: ["gamification-events"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("gamification_events")
        .select("*, profiles!inner(id, name, avatar_url)")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Agrupar eventos por usuário e calcular ranking
  const leaderboard = events
    ? Object.entries(
        events.reduce((acc: any, event: any) => {
          const userId = event.user_id;
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              name: event.profiles.name,
              avatar: event.profiles.avatar_url,
              events: [],
            };
          }
          acc[userId].events.push(event);
          return acc;
        }, {})
      )
        .map(([_, userData]: any) => {
          const stats = calculateUserStats(userData.events);
          const badges = calculateBadges(stats);

          return {
            userId: userData.userId,
            name: userData.name,
            avatar: userData.avatar,
            stats,
            badges,
            totalPoints: stats.totalPoints,
          };
        })
        .sort((a, b) => b.totalPoints - a.totalPoints)
    : [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <div className="space-y-8">
      {/* Pódio dos Top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 2º Lugar */}
          {topThree[1] && (
            <Card className={`relative overflow-hidden bg-gradient-to-br ${getRankColor(2)}`}>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="text-4xl mb-2">{getMedalEmoji(2)}</div>
                <Avatar className="h-24 w-24 mb-4 border-4 border-white shadow-lg">
                  <AvatarImage src={topThree[1].avatar || undefined} alt={topThree[1].name} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(topThree[1].name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold text-white mb-2">{topThree[1].name}</h3>
                <p className="text-3xl font-bold text-white mb-2">
                  {formatPoints(topThree[1].totalPoints)}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {topThree[1].badges.slice(0, 3).map((badge) => (
                    <span key={badge.id} className="text-xl" title={badge.description}>
                      {badge.icon}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 1º Lugar */}
          {topThree[0] && (
            <Card className={`relative overflow-hidden bg-gradient-to-br ${getRankColor(1)} md:scale-110 md:z-10`}>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="text-5xl mb-2 animate-bounce">{getMedalEmoji(1)}</div>
                <Avatar className="h-32 w-32 mb-4 border-4 border-white shadow-2xl">
                  <AvatarImage src={topThree[0].avatar || undefined} alt={topThree[0].name} />
                  <AvatarFallback className="text-3xl">
                    {getInitials(topThree[0].name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-bold text-white mb-2">{topThree[0].name}</h3>
                <p className="text-4xl font-bold text-white mb-2">
                  {formatPoints(topThree[0].totalPoints)}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {topThree[0].badges.slice(0, 3).map((badge) => (
                    <span key={badge.id} className="text-2xl" title={badge.description}>
                      {badge.icon}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3º Lugar */}
          {topThree[2] && (
            <Card className={`relative overflow-hidden bg-gradient-to-br ${getRankColor(3)}`}>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="text-4xl mb-2">{getMedalEmoji(3)}</div>
                <Avatar className="h-24 w-24 mb-4 border-4 border-white shadow-lg">
                  <AvatarImage src={topThree[2].avatar || undefined} alt={topThree[2].name} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(topThree[2].name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold text-white mb-2">{topThree[2].name}</h3>
                <p className="text-3xl font-bold text-white mb-2">
                  {formatPoints(topThree[2].totalPoints)}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {topThree[2].badges.slice(0, 3).map((badge) => (
                    <span key={badge.id} className="text-xl" title={badge.description}>
                      {badge.icon}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Ranking completo */}
      <div className="space-y-3">
        {restOfLeaderboard.map((user, index) => {
          const position = index + 4;
          return (
            <Card
              key={user.userId}
              className="hover:bg-accent transition-colors"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="text-2xl font-bold text-muted-foreground w-8">
                  #{position}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold">{user.name}</h4>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>💰 {user.stats.salesClosed} vendas</span>
                    <span>📋 {user.stats.proposalsSent} propostas</span>
                    <span>📊 {user.stats.conversionRate.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.badges.slice(0, 3).map((badge) => (
                    <span key={badge.id} className="text-xl" title={badge.description}>
                      {badge.icon}
                    </span>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatPoints(user.totalPoints)}
                  </p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mensagem se não houver dados */}
      {leaderboard.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">Nenhum dado disponível</h3>
            <p className="text-muted-foreground">
              O ranking será atualizado conforme as vendas acontecerem
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
