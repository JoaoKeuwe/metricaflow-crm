import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlanConfig } from "@/lib/stripe-plans";

interface PricingCardProps {
  plan: PlanConfig;
  currentPlan?: string;
  onSubscribe: (planId: string) => void;
  isLoading?: boolean;
}

export const PricingCard = ({ plan, currentPlan, onSubscribe, isLoading }: PricingCardProps) => {
  const isCurrentPlan = currentPlan === plan.id;
  const isEnterprise = plan.isEnterprise;

  return (
    <Card 
      className={cn(
        "relative flex flex-col premium-card transition-all duration-300 hover:scale-[1.02]",
        plan.popular && "border-primary shadow-lg shadow-primary/20",
        isCurrentPlan && "border-accent ring-2 ring-accent/50"
      )}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white">
          <Sparkles className="h-3 w-3 mr-1" />
          Mais Popular
        </Badge>
      )}
      
      {isCurrentPlan && (
        <Badge className="absolute -top-3 right-4 bg-accent text-white">
          Seu Plano
        </Badge>
      )}

      {plan.discount && (
        <Badge variant="secondary" className="absolute -top-3 left-4 bg-green-500/20 text-green-400 border-green-500/30">
          {plan.discount}
        </Badge>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {plan.priceDisplay}
          </span>
          {!isEnterprise && (
            <span className="text-muted-foreground ml-1">
              /{plan.period === 'monthly' ? 'mês' : 'ano'}
            </span>
          )}
        </div>
        <CardDescription className="mt-2">{plan.description}</CardDescription>
        {plan.userLimit > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {plan.userLimit === 1 ? '1 usuário' : `Até ${plan.userLimit} usuários`}
          </p>
        )}
        {plan.userLimit === -1 && (
          <p className="text-sm text-muted-foreground mt-1">Usuários ilimitados</p>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          className={cn(
            "w-full",
            plan.popular && "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          )}
          variant={plan.popular ? "default" : "outline"}
          onClick={() => onSubscribe(plan.id)}
          disabled={isLoading || isCurrentPlan}
        >
          {isCurrentPlan 
            ? 'Plano Atual' 
            : isEnterprise 
              ? 'Fale Conosco' 
              : 'Assinar Agora'
          }
        </Button>
      </CardFooter>
    </Card>
  );
};
