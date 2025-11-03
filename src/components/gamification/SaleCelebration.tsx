import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/gamification";
import { 
  triggerConfetti, 
  triggerFireworks, 
  getCelebrationType, 
  getCelebrationMessage 
} from "@/lib/confetti-animations";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isVisible, setIsVisible] = useState(true);
  const celebrationType = getCelebrationType(saleValue);
  const message = getCelebrationMessage(celebrationType);

  useEffect(() => {
    // Trigger confetti based on sale value
    if (celebrationType === 'mega') {
      triggerFireworks();
    } else {
      triggerConfetti(celebrationType);
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete, celebrationType]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: -100 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="relative text-center space-y-8 px-8"
          >
            {/* Celebration Message */}
            <motion.h1
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1] }}
              className={`text-7xl font-bold bg-gradient-to-r ${
                celebrationType === 'mega' 
                  ? 'from-yellow-400 via-orange-500 to-red-600' 
                  : celebrationType === 'large'
                  ? 'from-purple-400 via-pink-500 to-primary'
                  : 'from-primary via-blue-400 to-primary'
              } bg-clip-text text-transparent drop-shadow-2xl`}
            >
              {message}
            </motion.h1>

            {/* Seller Info */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Avatar className="h-48 w-48 border-8 border-primary shadow-2xl shadow-primary/50">
                  <AvatarImage src={sellerAvatar} alt={sellerName} />
                  <AvatarFallback className="text-6xl font-bold bg-gradient-to-br from-primary to-primary/60">
                    {getInitials(sellerName)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              <div className="space-y-2">
                <p className="text-4xl font-bold text-white">{sellerName}</p>
                <p className="text-2xl text-muted-foreground">fechou {leadName}</p>
              </div>
            </motion.div>

            {/* Sale Details */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-8 max-w-2xl mx-auto"
            >
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-primary/30">
                <p className="text-lg text-muted-foreground mb-2">Valor da Venda</p>
                <p className="text-5xl font-bold text-primary">{formatCurrency(saleValue)}</p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-primary/30">
                <p className="text-lg text-muted-foreground mb-2">Pontos Ganhos</p>
                <p className="text-5xl font-bold text-primary">+{points}</p>
              </div>
            </motion.div>

            {/* Celebration Icon */}
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="text-8xl"
            >
              {celebrationType === 'mega' ? '🔥' : celebrationType === 'large' ? '💎' : '⭐'}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
