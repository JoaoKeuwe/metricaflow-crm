import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down";
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  description,
}: MetricCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  const isNumeric = !isNaN(numericValue);

  useEffect(() => {
    if (isNumeric) {
      let start = 0;
      const end = numericValue;
      const duration = 1000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(start);
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [numericValue, isNumeric]);

  const formattedValue = isNumeric 
    ? typeof value === 'string' && value.includes('%')
      ? `${displayValue.toFixed(1)}%`
      : typeof value === 'string' && value.includes('R$')
      ? `R$ ${Math.round(displayValue).toLocaleString('pt-BR')}`
      : Math.round(displayValue).toLocaleString('pt-BR')
    : value;

  return (
    <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 glow-border border-primary/20 bg-card">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100" />
      
      <CardContent className="relative p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-4xl font-bold bg-gradient-to-br from-foreground via-primary to-accent bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-3 duration-500">
              {formattedValue}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                {description}
              </p>
            )}
            
            {/* Progress bar indicator */}
            <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-in slide-in-from-left duration-1000"
                style={{ 
                  width: '70%',
                  animation: 'gradient-shift 3s ease infinite'
                }}
              />
            </div>
          </div>
          
          {/* Icon with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-300 animate-pulse" />
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center backdrop-blur-sm border border-primary/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Icon className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
};

export default MetricCard;
