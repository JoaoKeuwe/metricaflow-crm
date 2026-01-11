import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const OnboardingTour = () => {
  const [run, setRun] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("No user");
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", session.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Tour concluído!",
        description: "Você está pronto para começar a usar o sistema.",
      });
    },
  });

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      // Delay para garantir que a página carregou
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div>
          <h2 className="text-lg font-bold mb-2">Bem-vindo ao CRM!</h2>
          <p>Vamos fazer um tour rápido pelas principais funcionalidades do sistema.</p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[href="/dashboard"]',
      content: "Aqui está o Dashboard com métricas e gráficos de vendas.",
      disableBeacon: true,
    },
    {
      target: '[href="/leads"]',
      content: "Na página de Leads você gerencia todos os seus contatos e oportunidades.",
      disableBeacon: true,
    },
    {
      target: '[href="/kanban"]',
      content: "O Kanban permite visualizar e mover leads pelo funil de vendas de forma visual.",
      disableBeacon: true,
    },
    {
      target: '[href="/tasks"]',
      content: "Crie e acompanhe tarefas vinculadas aos seus leads.",
      disableBeacon: true,
    },
    {
      target: '[href="/agenda"]',
      content: "Agende reuniões e compromissos com seus clientes.",
      disableBeacon: true,
    },
    {
      target: '[href="/gamification-live"]',
      content: "Acompanhe seu desempenho e conquiste badges através da gamificação!",
      disableBeacon: true,
    },
    {
      target: "body",
      content: (
        <div>
          <h2 className="text-lg font-bold mb-2">Pronto para começar!</h2>
          <p>Explore o sistema e comece a gerenciar suas vendas de forma eficiente.</p>
        </div>
      ),
      placement: "center",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      completeOnboarding.mutate();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--card))",
          arrowColor: "hsl(var(--card))",
          zIndex: 10000,
        },
      }}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Finalizar",
        next: "Próximo",
        skip: "Pular",
      }}
    />
  );
};

export default OnboardingTour;