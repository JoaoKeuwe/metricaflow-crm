import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeaderboardLive } from "@/components/gamification/LeaderboardLive";
import { PointsBreakdown } from "@/components/gamification/PointsBreakdown";
import { SaleCelebration } from "@/components/gamification/SaleCelebration";
import { useGamificationEvents } from "@/hooks/useGamificationEvents";
import { Trophy, Users, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GamificationLive() {
  const [showCelebration, setShowCelebration] = useState(false);
  const { latestSale, clearLatestSale } = useGamificationEvents();
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
    }
  }, [latestSale, sellerData]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
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

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="h-12 w-12 text-primary animate-bounce" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Ranking ao Vivo
            </h1>
            <Trophy className="h-12 w-12 text-primary animate-bounce" />
          </div>
          <p className="text-xl text-muted-foreground">
            Últimos 30 dias • Atualização automática a cada 5 segundos
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Sistema de Pontuação */}
        <PointsBreakdown />

        {/* Ranking */}
        <LeaderboardLive />

        {/* Footer com indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-card rounded-lg p-4 text-center border border-primary/20">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">Top Performers</p>
            <p className="text-sm text-muted-foreground">Celebrando a excelência</p>
          </div>
          <div className="bg-card rounded-lg p-4 text-center border border-primary/20">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">Time Unido</p>
            <p className="text-sm text-muted-foreground">Crescendo juntos</p>
          </div>
          <div className="bg-card rounded-lg p-4 text-center border border-primary/20">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">Em Tempo Real</p>
            <p className="text-sm text-muted-foreground">Acompanhe cada venda</p>
          </div>
        </div>

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
