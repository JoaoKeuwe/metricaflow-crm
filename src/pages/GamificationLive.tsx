import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeaderboardLive } from "@/components/gamification/LeaderboardLive";
import { PointsBreakdown } from "@/components/gamification/PointsBreakdown";
import { SaleCelebration } from "@/components/gamification/SaleCelebration";
import { useGamificationEvents } from "@/hooks/useGamificationEvents";
import { useGamificationSounds } from "@/hooks/useGamificationSounds";
import { SoundControls } from "@/components/gamification/SoundControls";
import { Trophy, Users, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function GamificationLive() {
  const [showCelebration, setShowCelebration] = useState(false);
  const { latestSale, clearLatestSale } = useGamificationEvents();
  const { isMuted, volume, setIsMuted, setVolume, playSound } = useGamificationSounds();
  const [lastUpdate, setLastUpdate] = useState(new Date());

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

      {/* Modal de celebração */}
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

        {/* Sistema de Pontuação */}
        <PointsBreakdown />

        {/* Ranking */}
        <LeaderboardLive />

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
