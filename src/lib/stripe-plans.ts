export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  priceDisplay: string;
  period: 'monthly' | 'yearly';
  userLimit: number;
  features: string[];
  popular?: boolean;
  discount?: string;
  isEnterprise?: boolean;
}

export const STRIPE_PLANS: PlanConfig[] = [
  {
    id: 'individual_monthly',
    name: 'Individual',
    description: 'Plano para 1 usuário, renovação mensal',
    price: 79,
    priceDisplay: 'R$ 79',
    period: 'monthly',
    userLimit: 1,
    features: [
      'CRM completo',
      'Gestão de leads ilimitados',
      'Agenda integrada',
      'Relatórios básicos',
      'Suporte por email',
    ],
  },
  {
    id: 'individual_yearly',
    name: 'Individual',
    description: 'Plano anual com economia equivalente a 2 meses',
    price: 790,
    priceDisplay: 'R$ 790',
    period: 'yearly',
    userLimit: 1,
    discount: 'Economia de 2 meses',
    features: [
      'CRM completo',
      'Gestão de leads ilimitados',
      'Agenda integrada',
      'Relatórios básicos',
      'Suporte por email',
    ],
  },
  {
    id: 'team_monthly',
    name: 'Equipe',
    description: 'Plano para até 10 usuários com gestão de equipe',
    price: 397,
    priceDisplay: 'R$ 397',
    period: 'monthly',
    userLimit: 10,
    popular: true,
    features: [
      'Tudo do Individual',
      'Até 10 usuários',
      'Gestão de equipe',
      'Permissões avançadas',
      'Relatórios de equipe',
      'Gamificação e ranking',
      'Suporte prioritário',
    ],
  },
  {
    id: 'team_yearly',
    name: 'Equipe',
    description: 'Assinatura anual com melhor custo-benefício',
    price: 3970,
    priceDisplay: 'R$ 3.970',
    period: 'yearly',
    userLimit: 10,
    discount: 'Economia de 2 meses',
    features: [
      'Tudo do Individual',
      'Até 10 usuários',
      'Gestão de equipe',
      'Permissões avançadas',
      'Relatórios de equipe',
      'Gamificação e ranking',
      'Suporte prioritário',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Plano personalizado para times maiores',
    price: 0,
    priceDisplay: 'Sob consulta',
    period: 'monthly',
    userLimit: -1,
    isEnterprise: true,
    features: [
      'Tudo do Equipe',
      'Usuários ilimitados',
      'Integrações avançadas',
      'API dedicada',
      'SLA garantido',
      'Gerente de conta dedicado',
      'Treinamento personalizado',
    ],
  },
];

export const getPlanById = (id: string): PlanConfig | undefined => {
  return STRIPE_PLANS.find(plan => plan.id === id);
};

export const getMonthlyPlans = () => STRIPE_PLANS.filter(p => p.period === 'monthly');
export const getYearlyPlans = () => STRIPE_PLANS.filter(p => p.period === 'yearly');
