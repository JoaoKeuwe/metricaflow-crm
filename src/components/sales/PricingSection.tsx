import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    id: "individual",
    name: "Individual",
    description: "Para profissionais autônomos e freelancers",
    monthlyPrice: 79,
    yearlyPrice: 790,
    userLimit: 1,
    popular: false,
    features: [
      "1 usuário",
      "Leads ilimitados",
      "Dashboard completo",
      "Kanban de vendas",
      "Agenda integrada",
      "Relatórios básicos",
      "Suporte por email",
    ],
  },
  {
    id: "team",
    name: "Equipe",
    description: "Para times de vendas em crescimento",
    monthlyPrice: 397,
    yearlyPrice: 3970,
    userLimit: 10,
    popular: true,
    features: [
      "Até 10 usuários",
      "Leads ilimitados",
      "Dashboard avançado",
      "Kanban com validações",
      "Agenda multi-usuário",
      "Gamificação completa",
      "Manual Vivo do Vendedor",
      "Relatórios com IA",
      "WhatsApp integrado",
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Para grandes operações comerciais",
    monthlyPrice: null,
    yearlyPrice: null,
    userLimit: null,
    popular: false,
    features: [
      "Usuários ilimitados",
      "Tudo do plano Equipe",
      "API para integrações",
      "Onboarding dedicado",
      "Gerente de sucesso",
      "SLA garantido",
      "Customizações",
      "Treinamento presencial",
    ],
  },
];

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Preços
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Planos que cabem no seu{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              bolso
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Comece grátis por 14 dias. Sem cartão de crédito.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-muted/50 border border-border/50">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isYearly
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              <Badge variant="secondary" className="bg-green-500/20 text-green-500 text-xs">
                -17%
              </Badge>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? "border-primary bg-gradient-to-b from-primary/10 to-transparent"
                  : "border-border/50 bg-card/30"
              } backdrop-blur-sm p-8`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {plan.monthlyPrice ? (
                  <>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl text-muted-foreground">R$</span>
                      <span className="text-5xl font-bold text-foreground">
                        {isYearly ? Math.round(plan.yearlyPrice! / 12) : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-muted-foreground mt-2">
                        R$ {plan.yearlyPrice}/ano
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-3xl font-bold text-foreground">Sob consulta</div>
                )}
              </div>

              {/* User Limit */}
              {plan.userLimit && (
                <div className="text-center mb-6">
                  <Badge variant="outline" className="text-muted-foreground">
                    {plan.userLimit === 1 ? "1 usuário" : `Até ${plan.userLimit} usuários`}
                  </Badge>
                </div>
              )}

              {/* CTA Button */}
              <Link to="/auth" className="block mb-8">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  size="lg"
                >
                  {plan.monthlyPrice ? "Começar Grátis" : "Falar com Vendas"}
                </Button>
              </Link>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Trial Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          Todos os planos incluem 14 dias de teste grátis. Cancele quando quiser.
        </motion.p>
      </div>
    </section>
  );
};
