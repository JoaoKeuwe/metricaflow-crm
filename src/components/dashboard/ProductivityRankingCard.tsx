import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Award, Medal, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VendedorData {
  vendedor: string;
  avatar?: string | null;
  leads: number;
  convertidos: number;
  taxa: number;
  observacoes: number;
  tempoMedio: number;
}

interface ProductivityRankingCardProps {
  vendedores: VendedorData[];
}

export const ProductivityRankingCard = ({ vendedores }: ProductivityRankingCardProps) => {
  if (!vendedores || vendedores.length === 0) {
    return null;
  }

  // Ordenar por total de atividades (leads + conversões)
  const sortedVendedores = [...vendedores].sort((a, b) => {
    const scoreA = a.leads + (a.convertidos * 3) + (a.observacoes * 0.5);
    const scoreB = b.leads + (b.convertidos * 3) + (b.observacoes * 0.5);
    return scoreB - scoreA;
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Award className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <TrendingUp className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 1:
        return 'bg-gray-400/10 border-gray-400/20 text-gray-700 dark:text-gray-400';
      case 2:
        return 'bg-orange-600/10 border-orange-600/20 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Ranking de Produtividade
        </CardTitle>
        <CardDescription>
          Classificação por desempenho no período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedVendedores.map((vendedor, index) => {
            return (
              <div
                key={vendedor.vendedor}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${getRankBadgeColor(index)}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(index)}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={vendedor.avatar || undefined} alt={vendedor.vendedor} />
                    <AvatarFallback>
                      {vendedor.vendedor.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{vendedor.vendedor}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{vendedor.leads} leads</span>
                      <span>•</span>
                      <span>{vendedor.convertidos} vendas</span>
                      <span>•</span>
                      <span>{vendedor.observacoes} atividades</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{vendedor.taxa}%</p>
                  <p className="text-xs text-muted-foreground">conversão</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
