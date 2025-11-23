// Celebrações usando CSS animations e toast ao invés de canvas-confetti
import { toast } from 'sonner';

export type CelebrationType = 'small' | 'medium' | 'large' | 'mega';

// Trigger visual celebration usando CSS e toast
export function triggerConfetti(type: CelebrationType) {
  const message = getCelebrationMessage(type);
  
  // Criar elemento de celebração temporário com animação CSS
  const celebration = document.createElement('div');
  celebration.className = 'fixed inset-0 pointer-events-none z-50 flex items-center justify-center';
  celebration.innerHTML = `
    <div class="animate-in zoom-in-50 fade-in duration-500">
      <div class="text-6xl font-bold text-primary animate-bounce">
        ${message}
      </div>
    </div>
  `;
  
  document.body.appendChild(celebration);
  
  // Toast de celebração
  toast.success(message, {
    duration: type === 'mega' ? 5000 : type === 'large' ? 3000 : 2000,
  });
  
  // Remover após animação
  setTimeout(() => {
    celebration.remove();
  }, type === 'mega' ? 5000 : type === 'large' ? 3000 : 2000);
}

export function triggerFireworks() {
  triggerConfetti('mega');
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
