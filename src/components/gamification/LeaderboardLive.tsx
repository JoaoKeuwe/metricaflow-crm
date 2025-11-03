import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, Target, MessageSquare, ArrowUp, ArrowDown } from "lucide-react";
import {
  calculateUserStats,
  calculateBadges,
  formatPoints,
  getRankColor,
  getMedalEmoji,
} from "@/lib/gamification";
import { motion, AnimatePresence } from "framer-motion";
import { useRankingChanges } from "@/hooks/useRankingChanges";

export function LeaderboardLive() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["gamification-leaderboard"],
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
    refetchInterval: 5000,
  });

  const leaderboard = events
    ? Object.entries(
        events.reduce((acc: any, event: any) => {
          const userId = event.profiles.id;
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              userName: event.profiles.name,
              avatar: event.profiles.avatar_url,
              events: [],
            };
          }
          acc[userId].events.push(event);
          return acc;
        }, {})
      )
        .map(([userId, data]: [string, any]) => {
          const stats = calculateUserStats(data.events);
          const badges = calculateBadges(stats);
          return {
            userId,
            userName: data.userName,
            avatar: data.avatar,
            stats,
            badges,
            totalPoints: stats.totalPoints,
          };
        })
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 20)
    : [];

  const rankingChanges = useRankingChanges(leaderboard);

  const getChangeForUser = (userId: string) => {
    return rankingChanges.find(change => change.userId === userId);
  };

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
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="text-2xl font-bold">Nenhum dado disponível</h3>
          <p className="text-muted-foreground">
            O ranking será atualizado conforme as vendas acontecerem
          </p>
        </div>
      </Card>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <div className="space-y-8">
      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <AnimatePresence mode="popLayout">
          {topThree.map((user, index) => {
            const change = getChangeForUser(user.userId);
            return (
              <motion.div
                key={user.userId}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ type: "spring", duration: 0.6 }}
                className={`${
                  index === 0
                    ? "col-start-2 row-start-1"
                    : index === 1
                    ? "col-start-1 row-start-1"
                    : "col-start-3 row-start-1"
                }`}
              >
                <Card
                  className={`relative overflow-hidden ${
                    index === 0 ? "transform scale-110" : ""
                  }`}
                >
                  {change && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                        change.direction === 'up' 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {change.direction === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(change.newPosition - change.oldPosition)}
                    </motion.div>
                  )}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${getRankColor(
                      index + 1
                    )} opacity-10`}
                  />
                  <motion.div
                    animate={index === 0 ? {
                      boxShadow: [
                        "0 0 20px rgba(139, 92, 246, 0.3)",
                        "0 0 40px rgba(139, 92, 246, 0.6)",
                        "0 0 20px rgba(139, 92, 246, 0.3)",
                      ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative p-8 text-center space-y-4"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-6xl mb-4"
                    >
                      {getMedalEmoji(index + 1)}
                    </motion.div>

                    <Avatar className={`${index === 0 ? 'h-32 w-32' : 'h-24 w-24'} mx-auto border-4 border-primary shadow-xl`}>
                      <AvatarImage src={user.avatar} alt={user.userName} />
                      <AvatarFallback className={`${index === 0 ? 'text-3xl' : 'text-2xl'} bg-gradient-to-br from-primary to-primary/60`}>
                        {getInitials(user.userName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-2">
                      <h3 className={`${index === 0 ? 'text-2xl' : 'text-xl'} font-bold`}>{user.userName}</h3>
                      <motion.p
                        key={user.totalPoints}
                        initial={{ scale: 1.3, color: "rgb(139, 92, 246)" }}
                        animate={{ scale: 1, color: "currentColor" }}
                        className={`${index === 0 ? 'text-5xl' : 'text-4xl'} font-bold text-primary`}
                      >
                        {formatPoints(user.totalPoints)}
                      </motion.p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {user.stats.salesClosed}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {user.stats.conversionRate}%
                      </Badge>
                    </div>

                    <div className="flex gap-1 justify-center">
                      {user.badges.slice(0, 3).map((badge) => (
                        <span key={badge.id} className="text-2xl" title={badge.name}>
                          {badge.icon}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Rest of Leaderboard */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {restOfLeaderboard.map((user, index) => {
            const change = getChangeForUser(user.userId);
            return (
              <motion.div
                key={user.userId}
                layout
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: "spring", duration: 0.4 }}
              >
                <Card className="hover:shadow-lg transition-shadow relative overflow-hidden">
                  {change && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className={`absolute left-0 top-0 bottom-0 w-2 ${
                        change.direction === 'up' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  )}
                  <div className="p-6 flex items-center gap-6">
                    {/* Position */}
                    <div className="text-3xl font-bold text-muted-foreground w-12 text-center flex items-center gap-2">
                      {index + 4}
                      {change && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={change.direction === 'up' ? 'text-green-500' : 'text-red-500'}
                        >
                          {change.direction === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        </motion.div>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar} alt={user.userName} />
                      <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-primary/60">
                        {getInitials(user.userName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 space-y-2">
                      <h4 className="text-xl font-bold">{user.userName}</h4>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {user.stats.salesClosed} vendas
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {user.stats.proposalsSent} propostas
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {user.stats.conversionRate}% conversão
                        </Badge>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-1">
                      {user.badges.slice(0, 3).map((badge) => (
                        <span key={badge.id} className="text-xl" title={badge.name}>
                          {badge.icon}
                        </span>
                      ))}
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <motion.div
                        key={user.totalPoints}
                        initial={{ scale: 1.2, color: "rgb(139, 92, 246)" }}
                        animate={{ scale: 1, color: "currentColor" }}
                        className="text-3xl font-bold text-primary"
                      >
                        {formatPoints(user.totalPoints)}
                      </motion.div>
                      <div className="text-sm text-muted-foreground">pontos</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
