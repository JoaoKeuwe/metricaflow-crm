// Funções auxiliares para sistema de gamificação

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
}

export interface UserStats {
  totalPoints: number;
  leadsCreated: number;
  proposalsSent: number;
  salesClosed: number;
  observations: number;
  totalSalesValue: number;
  conversionRate: number;
}

// Calcular estatísticas do usuário nos últimos 30 dias
export function calculateUserStats(events: any[]): UserStats {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const recentEvents = events.filter(
    (e) => new Date(e.created_at) > last30Days
  );

  const stats: UserStats = {
    totalPoints: recentEvents.reduce((sum, e) => sum + (e.points || 0), 0),
    leadsCreated: recentEvents.filter((e) => e.event_type === "lead_created").length,
    proposalsSent: recentEvents.filter((e) => e.event_type === "proposal_sent").length,
    salesClosed: recentEvents.filter((e) => e.event_type === "sale_closed").length,
    observations: recentEvents.filter((e) => e.event_type === "observation_added").length,
    totalSalesValue: 0,
    conversionRate: 0,
  };

  // Calcular valor total de vendas
  const salesEvents = recentEvents.filter((e) => e.event_type === "sale_closed");
  stats.totalSalesValue = salesEvents.reduce(
    (sum, e) => sum + (e.metadata?.estimated_value || 0),
    0
  );

  // Calcular taxa de conversão
  if (stats.leadsCreated > 0) {
    stats.conversionRate = (stats.salesClosed / stats.leadsCreated) * 100;
  }

  return stats;
}

// Determinar badges baseado nas estatísticas
export function calculateBadges(stats: UserStats): Badge[] {
  const badges: Badge[] = [];

  // Fechador Master
  if (stats.salesClosed >= 10) {
    badges.push({
      id: "master-closer",
      name: "Fechador Master",
      icon: "🏆",
      description: "10+ vendas no mês",
      requirement: "10 vendas",
    });
  }

  // Sniper
  if (stats.conversionRate >= 50) {
    badges.push({
      id: "sniper",
      name: "Sniper",
      icon: "🎯",
      description: "Taxa de conversão ≥ 50%",
      requirement: "50% conversão",
    });
  }

  // High Ticket
  if (stats.totalSalesValue >= 100000) {
    badges.push({
      id: "high-ticket",
      name: "High Ticket",
      icon: "💎",
      description: "R$ 100k+ em vendas",
      requirement: "R$ 100k vendas",
    });
  }

  // Consistency King
  if (stats.salesClosed >= 7 && stats.leadsCreated >= 21) {
    badges.push({
      id: "consistency",
      name: "Consistency King",
      icon: "📈",
      description: "Consistência nas vendas",
      requirement: "Vendas diárias",
    });
  }

  // Em Chamas (placeholder - requer dados de timestamp)
  if (stats.salesClosed >= 3) {
    badges.push({
      id: "on-fire",
      name: "Em Chamas",
      icon: "🔥",
      description: "Alta performance",
      requirement: "3+ vendas",
    });
  }

  return badges;
}

// Formatar valor monetário
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Formatar pontuação
export function formatPoints(points: number): string {
  return new Intl.NumberFormat("pt-BR").format(points);
}

// Obter cor do ranking (para o pódio)
export function getRankColor(position: number): string {
  switch (position) {
    case 1:
      return "from-yellow-400 to-yellow-600"; // Ouro
    case 2:
      return "from-gray-300 to-gray-500"; // Prata
    case 3:
      return "from-orange-400 to-orange-600"; // Bronze
    default:
      return "from-primary/20 to-primary/40";
  }
}

// Obter emoji de medalha
export function getMedalEmoji(position: number): string {
  switch (position) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return "";
  }
}
