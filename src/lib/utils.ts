import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calcula dias desde a última atualização
export function getDaysInCurrentStage(updatedAt: string): number {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffTime = Math.abs(now.getTime() - updated.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Retorna variant do badge baseado em antiguidade
export function getAgeBadgeVariant(days: number): "default" | "secondary" | "destructive" | "outline" {
  if (days <= 7) return "secondary"; // Verde/neutro
  if (days <= 30) return "outline"; // Amarelo
  if (days <= 60) return "default"; // Laranja
  return "destructive"; // Vermelho
}

// Retorna categoria temporal
export function getTimePeriod(days: number): 'current' | 'previous' | 'old' {
  if (days <= 30) return 'current';
  if (days <= 60) return 'previous';
  return 'old';
}

// Formata texto do badge
export function formatDaysAgo(days: number): string {
  if (days === 0) return "Hoje";
  if (days === 1) return "1 dia";
  if (days < 7) return `${days} dias`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 semana" : `${weeks} semanas`;
  }
  if (days < 60) {
    return "1 mês";
  }
  const months = Math.floor(days / 30);
  return `${months} meses`;
}
