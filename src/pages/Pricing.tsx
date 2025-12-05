import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Zap, HeadphonesIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { PricingCard } from "@/components/pricing/PricingCard";
import { STRIPE_PLANS } from "@/lib/stripe-plans";
import { toast } from "sonner";

const Pricing = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { planType } = useSubscription();

  const filteredPlans = STRIPE_PLANS.filter(plan => 
    plan.period === billingPeriod || plan.isEnterprise
  );

  const handleSubscribe = async (planId: string) => {
    if (planId === 'enterprise') {
      window.open('https://wa.me/5511999999999?text=Olá! Gostaria de conhecer o plano Enterprise do WorkFlow360', '_blank');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado para assinar');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType: planId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao criar sessão de pagamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 text-center pb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Escolha o plano ideal para seu{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            negócio
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Comece a vender mais com o CRM mais completo do mercado. 
          Cancele quando quiser, sem multas.
        </p>

        {/* Billing Toggle */}
        <Tabs 
          value={billingPeriod} 
          onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'yearly')}
          className="inline-flex"
        >
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="yearly" className="relative">
              Anual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                -17%
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlan={planType}
              onSubscribe={handleSubscribe}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="container mx-auto px-4 pb-16">
        <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <span className="text-sm">Pagamento 100% seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <span className="text-sm">Ativação instantânea</span>
          </div>
          <div className="flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5 text-accent" />
            <span className="text-sm">Suporte em português</span>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 pb-16 max-w-3xl">
        <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
        <div className="space-y-4">
          <div className="premium-card p-6">
            <h3 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h3>
            <p className="text-muted-foreground text-sm">
              Sim! Você pode cancelar sua assinatura quando quiser, sem multas ou taxas adicionais.
            </p>
          </div>
          <div className="premium-card p-6">
            <h3 className="font-semibold mb-2">Quais formas de pagamento são aceitas?</h3>
            <p className="text-muted-foreground text-sm">
              Aceitamos cartões de crédito (Visa, Mastercard, Amex), PIX e boleto bancário.
            </p>
          </div>
          <div className="premium-card p-6">
            <h3 className="font-semibold mb-2">Posso trocar de plano depois?</h3>
            <p className="text-muted-foreground text-sm">
              Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
              Os valores são calculados proporcionalmente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
