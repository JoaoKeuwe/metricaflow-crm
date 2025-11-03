import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeaderboardLive } from "@/components/gamification/LeaderboardLive";
import { PointsBreakdown } from "@/components/gamification/PointsBreakdown";
import { SaleCelebration } from "@/components/gamification/SaleCelebration";
import { BadgeUnlockedModal } from "@/components/gamification/BadgeUnlockedModal";
import { BadgeProgress } from "@/components/gamification/BadgeProgress";
import { AllBadgesDisplay } from "@/components/gamification/AllBadgesDisplay";
import { ActivityFeed } from "@/components/gamification/ActivityFeed";
import { useGamificationEvents } from "@/hooks/useGamificationEvents";
import { useGamificationSounds } from "@/hooks/useGamificationSounds";
import { SoundControls } from "@/components/gamification/SoundControls";
import { Trophy, Users, TrendingUp, RefreshCw, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { calculateUserStats, calculateBadges, getNextBadge, Badge } from "@/lib/gamification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GamificationSettings } from "@/components/gamification/GamificationSettings";
import { Settings } from "lucide-react";

export default function GamificationLive() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const previousBadgesRef = useRef<Set<string>>(new Set());
  const { latestSale, clearLatestSale } = useGamificationEvents();
  const { isMuted, volume, setIsMuted, setVolume, playSound } = useGamificationSounds();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Check user role
  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data?.role;
    },
  });

  // Buscar eventos para detectar novos badges
  const { data: allEvents } = useQuery({
    queryKey: ["gamification-events-badges"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("gamification_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  // Buscar dados do vendedor quando houver nova venda
  const { data: sellerData } = useQuery({
    queryKey: ["seller-profile", latestSale?.user_id],
    queryFn: async () => {
      if (!latestSale?.user_id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", latestSale.user_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!latestSale,
  });

  // Detectar novos badges desbloqueados
  useEffect(() => {
    if (!allEvents) return;

    const stats = calculateUserStats(allEvents);
    const currentBadges = calculateBadges(stats);
    const currentBadgeIds = new Set(currentBadges.map(b => b.id));

    // Check for newly unlocked badges
    currentBadgeIds.forEach(badgeId => {
      if (!previousBadgesRef.current.has(badgeId)) {
        const badge = currentBadges.find(b => b.id === badgeId);
        if (badge) {
          setUnlockedBadge(badge);
          playSound('levelup');
        }
      }
    });

    previousBadgesRef.current = currentBadgeIds;
  }, [allEvents, playSound]);

  // Calcular próximo badge
  const nextBadge = allEvents ? getNextBadge(calculateUserStats(allEvents)) : null;
  const earnedBadges = allEvents ? calculateBadges(calculateUserStats(allEvents)) : [];

  // Mostrar celebração quando houver nova venda
  useEffect(() => {
    if (latestSale && sellerData) {
      setShowCelebration(true);
      playSound('sale');
    }
  }, [latestSale, sellerData, playSound]);

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    clearLatestSale();
  };

  // Atualizar timestamp a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6">
      {/* Sound Controls */}
      <SoundControls
        isMuted={isMuted}
        volume={volume}
        onMuteToggle={() => setIsMuted(!isMuted)}
        onVolumeChange={setVolume}
      />

      {/* Modal de celebração de venda */}
      {showCelebration && latestSale && sellerData && (
        <SaleCelebration
          sellerName={sellerData.name}
          sellerAvatar={sellerData.avatar_url}
          leadName={latestSale.metadata?.lead_name || "Lead"}
          saleValue={latestSale.metadata?.estimated_value || 0}
          points={latestSale.points}
          onComplete={handleCelebrationComplete}
        />
      )}

      {/* Modal de badge desbloqueado */}
      {unlockedBadge && (
        <BadgeUnlockedModal
          badge={unlockedBadge}
          onComplete={() => setUnlockedBadge(null)}
        />
      )}

      <div className="max-w-[1920px] mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="h-16 w-16 text-primary" />
            </motion.div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
              Ranking ao Vivo
            </h1>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <Trophy className="h-16 w-16 text-primary" />
            </motion.div>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Últimos 30 dias • Atualização automática a cada 5 segundos
          </p>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
          </motion.div>
        </motion.div>

        {/* Tabs de conteúdo */}
        <Tabs defaultValue="ranking" className="w-full">
          <TabsList className={`grid w-full max-w-2xl mx-auto ${userRole === 'gestor_owner' || userRole === 'gestor' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="ranking">
              <Trophy className="h-4 w-4 mr-2" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Award className="h-4 w-4 mr-2" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="pontos">
              <TrendingUp className="h-4 w-4 mr-2" />
              Pontos
            </TabsTrigger>
            {(userRole === 'gestor_owner' || userRole === 'gestor') && (
              <TabsTrigger value="configuracoes">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="ranking" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leaderboard - Takes 2 columns */}
              <div className="lg:col-span-2">
                <LeaderboardLive />
              </div>

              {/* Activity Feed - Takes 1 column */}
              <div className="lg:col-span-1">
                <ActivityFeed />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="badges" className="mt-8 space-y-6">
            {/* Próximo Badge */}
            {nextBadge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Award className="h-6 w-6 text-primary" />
                  Próximo Badge
                </h2>
                <BadgeProgress progress={nextBadge} />
              </motion.div>
            )}

            {/* Galeria de Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AllBadgesDisplay earnedBadges={earnedBadges} />
            </motion.div>
          </TabsContent>

          <TabsContent value="pontos" className="mt-8">
            <PointsBreakdown />
          </TabsContent>

          {(userRole === 'gestor_owner' || userRole === 'gestor') && (
            <TabsContent value="configuracoes" className="mt-8">
              <GamificationSettings />
            </TabsContent>
          )}
        </Tabs>

        {/* Footer com indicadores */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-card rounded-2xl p-6 text-center border-2 border-primary/30 shadow-lg"
          >
            <Trophy className="h-10 w-10 mx-auto mb-3 text-primary" />
            <p className="text-3xl font-bold">Top Performers</p>
            <p className="text-sm text-muted-foreground">Celebrando a excelência</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-card rounded-2xl p-6 text-center border-2 border-primary/30 shadow-lg"
          >
            <Users className="h-10 w-10 mx-auto mb-3 text-primary" />
            <p className="text-3xl font-bold">Time Unido</p>
            <p className="text-sm text-muted-foreground">Crescendo juntos</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-card rounded-2xl p-6 text-center border-2 border-primary/30 shadow-lg"
          >
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-primary" />
            <p className="text-3xl font-bold">Em Tempo Real</p>
            <p className="text-sm text-muted-foreground">Acompanhe cada venda</p>
          </motion.div>
        </motion.div>

        {/* Botão para sair */}
        <div className="text-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            ← Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
