import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Diretor Comercial",
    company: "TechVendas Brasil",
    image: "https://i.pravatar.cc/150?img=1",
    content: "O WorkFlow360 transformou nossa operação. Em 3 meses aumentamos as conversões em 40% e finalmente conseguimos padronizar o processo de vendas.",
    rating: 5,
  },
  {
    name: "Ana Rodrigues",
    role: "Gerente de Vendas",
    company: "Consultoria Premium",
    image: "https://i.pravatar.cc/150?img=5",
    content: "A gamificação fez toda diferença. Minha equipe está mais motivada e competitiva. O ranking ao vivo virou o centro das atenções no escritório!",
    rating: 5,
  },
  {
    name: "Roberto Santos",
    role: "CEO",
    company: "StartUp Solutions",
    image: "https://i.pravatar.cc/150?img=3",
    content: "Testei vários CRMs antes de encontrar o WorkFlow360. É o único que realmente entende o mercado brasileiro e as necessidades de equipes menores.",
    rating: 5,
  },
  {
    name: "Marina Costa",
    role: "Head de Vendas",
    company: "Digital Commerce",
    image: "https://i.pravatar.cc/150?img=10",
    content: "O Manual Vivo do Vendedor é genial. Nossos novos vendedores ficam produtivos em dias, não semanas. O sistema realmente treina a equipe.",
    rating: 5,
  },
  {
    name: "Fernando Lima",
    role: "Fundador",
    company: "Agência Criativa",
    image: "https://i.pravatar.cc/150?img=7",
    content: "Interface linda, fácil de usar e suporte excepcional. Finalmente um CRM que a equipe realmente usa sem reclamar!",
    rating: 5,
  },
  {
    name: "Patricia Mendes",
    role: "Diretora de Operações",
    company: "Imobiliária Central",
    image: "https://i.pravatar.cc/150?img=9",
    content: "Os relatórios com IA nos ajudam a tomar decisões muito mais rápido. Conseguimos prever tendências e ajustar a estratégia em tempo real.",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/20" />
      
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
            Depoimentos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            O que nossos clientes{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              dizem
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Empresas de todos os tamanhos confiam no WorkFlow360 para impulsionar suas vendas.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-primary/20 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
