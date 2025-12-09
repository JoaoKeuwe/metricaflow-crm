import { motion } from "framer-motion";
import { Users, Target, TrendingUp, Award } from "lucide-react";

export const LogoBar = () => {
  const stats = [
    { icon: Users, value: "500+", label: "Vendedores Ativos" },
    { icon: Target, value: "10.000+", label: "Leads Gerenciados" },
    { icon: TrendingUp, value: "35%", label: "Aumento em Conversões" },
    { icon: Award, value: "4.9/5", label: "Avaliação dos Clientes" },
  ];

  return (
    <section className="py-12 border-y border-border/30 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Confiado por equipes de vendas em todo o Brasil
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
