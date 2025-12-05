import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, Users, ExternalLink, RefreshCw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SubscriptionSettings = () => {
  const navigate = useNavigate();
  const { isLoading, subscribed, planType, userLimit, subscriptionEnd, planDetails, refetch } = useSubscription();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Erro ao abrir portal do cliente. Tente novamente.');
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success('Status da assinatura atualizado');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="premium-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Sua Assinatura
              </CardTitle>
              <CardDescription>Gerencie seu plano e pagamentos</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div>
              <p className="text-sm text-muted-foreground">Plano atual</p>
              <p className="text-2xl font-bold">
                {planDetails?.name || (planType === 'free' ? 'Gratuito' : planType)}
              </p>
            </div>
            <Badge variant={subscribed ? "default" : "secondary"} className={subscribed ? "bg-green-500" : ""}>
              {subscribed ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/20">
              <Users className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Limite de usuários</p>
                <p className="font-medium">
                  {userLimit === -1 ? 'Ilimitado' : `${userLimit} usuário${userLimit > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {subscriptionEnd && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/20">
                <Calendar className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Próxima renovação</p>
                  <p className="font-medium">
                    {format(new Date(subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
            {subscribed ? (
              <Button onClick={handleManageSubscription} disabled={isPortalLoading}>
                {isPortalLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Gerenciar Assinatura
              </Button>
            ) : (
              <Button onClick={() => navigate('/pricing')}>
                Ver Planos
              </Button>
            )}
            
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              {subscribed ? 'Trocar Plano' : 'Comparar Planos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Available */}
      {planDetails && (
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>Recursos do seu plano</CardTitle>
            <CardDescription>O que está incluído na sua assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {planDetails.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Free Plan Notice */}
      {!subscribed && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Aproveite todos os recursos</h3>
                <p className="text-muted-foreground text-sm">
                  Faça upgrade para desbloquear gestão de equipe, relatórios avançados e muito mais.
                </p>
              </div>
              <Button onClick={() => navigate('/pricing')} className="shrink-0">
                Ver Planos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
