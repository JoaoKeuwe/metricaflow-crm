import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Kanban, 
  Calendar, 
  Trophy, 
  BookOpen, 
  Brain,
  CheckSquare,
  Bell,
  MessageSquare,
  BarChart3,
  Users,
  Zap
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Inteligente",
    description: "Visualize métricas em tempo real: CAC, LTV, conversões, funil e muito mais.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Kanban,
    title: "Kanban de Vendas",
    description: "Arraste leads entre etapas do funil com validações automáticas.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Calendar,
    title: "Agenda Integrada",
    description: "Gerencie reuniões com notificações automáticas para toda a equipe.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Trophy,
    title: "Gamificação",
    description: "Motive sua equipe com rankings, pontos e badges por performance.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: BookOpen,
    title: "Manual Vivo",
    description: "Treine vendedores automaticamente com scripts e guias por etapa.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Brain,
    title: "Relatórios com IA",
    description: "Insights gerados por inteligência artificial sobre sua operação.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: CheckSquare,
    title: "Gestão de Tarefas",
    description: "Atribua tarefas individuais ou em massa com acompanhamento.",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Bell,
    title: "Lembretes Inteligentes",
    description: "Nunca mais perca um follow-up com lembretes automáticos.",
    color: "from-amber-500 to-yellow-500",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integrado",
    description: "Envie mensagens e campanhas com um clique do CRM.",
    color: "from-green-500 to-lime-500",
  },
  {
    icon: BarChart3,
    title: "Metas & Objetivos",
    description: "Defina metas por vendedor e acompanhe o progresso em tempo real.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Users,
    title: "Multi-Usuários",
    description: "Gerencie equipes com diferentes níveis de acesso e permissões.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Zap,
    title: "Automações",
    description: "Regras automáticas para mover leads e criar tarefas.",
    color: "from-orange-500 to-red-500",
  },
];

export const FeaturesShowcase = () => {
  return (
    <section id="features" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Funcionalidades
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Tudo que você precisa para{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              vender mais
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Um CRM completo com recursos avançados de automação, gamificação e inteligência artificial.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group relative"
            >
              <div className="h-full p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:bg-card transition-all duration-300">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
