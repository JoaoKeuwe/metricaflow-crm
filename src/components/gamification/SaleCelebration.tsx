import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/gamification";
import { Sparkles } from "lucide-react";

interface SaleCelebrationProps {
  sellerName: string;
  sellerAvatar?: string | null;
  leadName: string;
  saleValue: number;
  points: number;
  onComplete: () => void;
}

export function SaleCelebration({
  sellerName,
  sellerAvatar,
  leadName,
  saleValue,
  points,
  onComplete,
}: SaleCelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-fechar após 5 segundos
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500); // Aguardar animação de fade out
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Confetes animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Sparkles
              className={`h-4 w-4 ${
                ["text-yellow-400", "text-blue-400", "text-green-400", "text-red-400", "text-purple-400"][i % 5]
              }`}
            />
          </div>
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex flex-col items-center gap-8 p-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary animate-in zoom-in duration-500">
        {/* Avatar grande do vendedor */}
        <Avatar className="h-40 w-40 border-4 border-primary shadow-2xl animate-pulse">
          <AvatarImage src={sellerAvatar || undefined} alt={sellerName} />
          <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
            {getInitials(sellerName)}
          </AvatarFallback>
        </Avatar>

        {/* Mensagem de celebração */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-primary animate-bounce">
            🎉 VENDA FECHADA! 🎉
          </h1>
          <p className="text-3xl font-semibold">{sellerName}</p>
          <div className="space-y-2">
            <p className="text-xl text-muted-foreground">
              Lead: <span className="text-foreground font-medium">{leadName}</span>
            </p>
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(saleValue)}
            </p>
            <p className="text-lg text-yellow-500">
              +{points} pontos 🏆
            </p>
          </div>
        </div>

        {/* Animação de fogos */}
        <div className="flex gap-4 text-4xl animate-bounce">
          🎊 🎆 ✨ 🎊 🎆
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
}
