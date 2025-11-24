import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp, Zap, Star, Award, Medal, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SalesPersonScore {
  id: string;
  name: string;
  avatar: string | null;
  points: number;
  leadsCreated: number;
  leadsConverted: number;
  observations: number;
  conversionRate: number;
  badges: string[];
}

export function GamificationPanel() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: async () => {
      // Buscar dados dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url');

      const { data: leads } = await supabase
        .from('leads')
        .select('id, assigned_to, status, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: observations } = await supabase
        .from('lead_observations')
        .select('user_id, lead_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (!profiles || !leads || !observations) return [];

      const scores: SalesPersonScore[] = profiles.map(profile => {
        const userLeads = leads.filter(l => l.assigned_to === profile.id);
        const convertedLeads = userLeads.filter(l => l.status === 'ganho');
        const userObservations = observations.filter(o => o.user_id === profile.id);
        
        const conversionRate = userLeads.length > 0 
          ? (convertedLeads.length / userLeads.length) * 100 
          : 0;

        // Sistema de pontuação
        let points = 0;
        points += userLeads.length * 10; // 10 pontos por lead criado
        points += convertedLeads.length * 100; // 100 pontos por conversão
        points += userObservations.length * 5; // 5 pontos por observação
        points += Math.floor(conversionRate * 2); // Bônus pela taxa de conversão

        // Sistema de badges
        const badges: string[] = [];
        if (convertedLeads.length >= 10) badges.push('🏆 Fechador Master');
        if (convertedLeads.length >= 5) badges.push('⭐ Top Performer');
        if (conversionRate >= 50) badges.push('🎯 Sniper');
        if (conversionRate >= 30) badges.push('📈 Alta Conversão');
        if (userObservations.length >= 50) badges.push('💬 Comunicador');
        if (userLeads.length >= 20) badges.push('🚀 Gerador de Leads');

        return {
          id: profile.id,
          name: profile.name || 'Sem nome',
          avatar: profile.avatar_url || null,
          points,
          leadsCreated: userLeads.length,
          leadsConverted: convertedLeads.length,
          observations: userObservations.length,
          conversionRate,
          badges
        };
      });

      return scores
        .filter(s => s.leadsCreated > 0 || s.observations > 0)
        .sort((a, b) => b.points - a.points);
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard - Últimos 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topThree = leaderboard?.slice(0, 3) || [];
  const others = leaderboard?.slice(3) || [];

  const getMedalIcon = (position: number) => {
    switch(position) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary animate-pulse" />
            🎮 Ranking Live - Últimos 30 dias
            <Badge variant="secondary" className="ml-auto">
              <Zap className="h-3 w-3 mr-1" />
              Tempo Real
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* 2º Lugar */}
            {topThree[1] && (
              <div className="text-center order-1">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-gray-400">
                      <AvatarImage src={topThree[1].avatar || undefined} alt={topThree[1].name} />
                      <AvatarFallback className="bg-gray-100 text-gray-700 text-lg font-bold">
                        {topThree[1].name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2">
                      {getMedalIcon(2)}
                    </div>
                  </div>
                  <div className="h-24 bg-gray-400/20 rounded-t-lg w-full flex items-end justify-center pb-2">
                    <span className="text-3xl font-bold text-gray-600">2</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{topThree[1].name}</p>
                    <p className="text-2xl font-bold text-primary">{topThree[1].points}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              </div>
            )}

            {/* 1º Lugar */}
            {topThree[0] && (
              <div className="text-center order-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-yellow-500 shadow-lg shadow-yellow-500/50">
                      <AvatarImage src={topThree[0].avatar || undefined} alt={topThree[0].name} />
                      <AvatarFallback className="bg-yellow-50 text-yellow-700 text-xl font-bold">
                        {topThree[0].name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-3 -right-3">
                      {getMedalIcon(1)}
                    </div>
                  </div>
                  <div className="h-32 bg-yellow-500/20 rounded-t-lg w-full flex items-end justify-center pb-2 border-2 border-yellow-500/30">
                    <span className="text-4xl font-bold text-yellow-600">1</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">{topThree[0].name}</p>
                    <p className="text-3xl font-bold text-primary">{topThree[0].points}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3º Lugar */}
            {topThree[2] && (
              <div className="text-center order-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-amber-600">
                      <AvatarImage src={topThree[2].avatar || undefined} alt={topThree[2].name} />
                      <AvatarFallback className="bg-amber-50 text-amber-700 text-lg font-bold">
                        {topThree[2].name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2">
                      {getMedalIcon(3)}
                    </div>
                  </div>
                  <div className="h-20 bg-amber-600/20 rounded-t-lg w-full flex items-end justify-center pb-2">
                    <span className="text-3xl font-bold text-amber-600">3</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{topThree[2].name}</p>
                    <p className="text-2xl font-bold text-primary">{topThree[2].points}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top 3 Stats */}
          <div className="grid grid-cols-3 gap-4">
            {topThree.map((person) => (
              <Card key={person.id} className="bg-card/50">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Conversão</span>
                    <span className="font-bold">{person.conversionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={person.conversionRate} className="h-1" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Leads</p>
                      <p className="font-semibold">{person.leadsCreated}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ganhos</p>
                      <p className="font-semibold text-green-600">{person.leadsConverted}</p>
                    </div>
                  </div>
                  {person.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {person.badges.slice(0, 2).map((badge, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">
                          {badge.split(' ')[0]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resto do Leaderboard */}
      {others.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ranking Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {others.map((person, index) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background font-bold text-sm">
                    {index + 4}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={person.avatar || undefined} alt={person.name} />
                    <AvatarFallback className="text-sm">
                      {person.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{person.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {person.leadsCreated} leads
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {person.leadsConverted} ganhos
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {person.conversionRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{person.points}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sistema de Pontuação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Como Ganhar Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-2xl font-bold text-blue-600">+10</p>
              <p className="text-xs text-muted-foreground">Lead criado</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-2xl font-bold text-green-600">+100</p>
              <p className="text-xs text-muted-foreground">Lead convertido</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-2xl font-bold text-purple-600">+5</p>
              <p className="text-xs text-muted-foreground">Observação</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-2xl font-bold text-orange-600">+2x</p>
              <p className="text-xs text-muted-foreground">Taxa conversão %</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
