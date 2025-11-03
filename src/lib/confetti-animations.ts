import confetti from 'canvas-confetti';

export type CelebrationType = 'small' | 'medium' | 'large' | 'mega';

export function triggerConfetti(type: CelebrationType) {
  const duration = type === 'mega' ? 5000 : type === 'large' ? 3000 : 2000;
  const animationEnd = Date.now() + duration;
  
  const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const frame = () => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) return;

    const particleCount = type === 'mega' ? 8 : type === 'large' ? 5 : 3;

    confetti({
      particleCount,
      angle: randomInRange(55, 125),
      spread: randomInRange(50, 100),
      origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
      colors,
      startVelocity: type === 'mega' ? 60 : type === 'large' ? 45 : 30,
      ticks: type === 'mega' ? 400 : 300,
    });

    requestAnimationFrame(frame);
  };

  frame();
}

export function triggerFireworks() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}

export function getCelebrationType(saleValue: number): CelebrationType {
  if (saleValue >= 100000) return 'mega';
  if (saleValue >= 50000) return 'large';
  if (saleValue >= 10000) return 'medium';
  return 'small';
}

export function getCelebrationMessage(type: CelebrationType): string {
  switch (type) {
    case 'mega':
      return '🔥 VENDA ÉPICA! MEGA FECHAMENTO! 🔥';
    case 'large':
      return '💎 EXCELENTE VENDA! HIGH TICKET! 💎';
    case 'medium':
      return '⭐ ÓTIMA VENDA! PARABÉNS! ⭐';
    default:
      return '🎉 VENDA FECHADA! 🎉';
  }
}
