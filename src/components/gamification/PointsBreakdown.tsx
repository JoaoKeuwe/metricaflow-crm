import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PointsBreakdown() {
  const pointsRules = [
    { icon: "🎯", label: "Lead Criado", points: "+10 pts" },
    { icon: "📋", label: "Proposta Enviada", points: "+25 pts" },
    { icon: "💰", label: "Venda Fechada", points: "+100 pts" },
    { icon: "💵", label: "Bônus por Valor", points: "+1/R$1k" },
    { icon: "💬", label: "Observação", points: "+3 pts" },
    { icon: "📊", label: "Taxa Conversão", points: "+2x taxa" },
  ];

  return (
    <Card className="bg-background/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="text-center">Sistema de Pontuação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {pointsRules.map((rule) => (
            <div
              key={rule.label}
              className="flex flex-col items-center p-3 rounded-lg bg-card hover:bg-accent transition-colors"
            >
              <span className="text-3xl mb-2">{rule.icon}</span>
              <p className="text-xs text-center text-muted-foreground mb-1">
                {rule.label}
              </p>
              <p className="text-sm font-bold text-primary">{rule.points}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
