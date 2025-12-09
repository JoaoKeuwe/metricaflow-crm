import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Preciso de cartão de crédito para testar?",
    answer: "Não! Você pode criar sua conta e testar todas as funcionalidades por 14 dias sem precisar cadastrar nenhum cartão de crédito. Só cobramos quando você decidir continuar usando após o período de teste.",
  },
  {
    question: "Como funciona o período de 14 dias grátis?",
    answer: "Ao criar sua conta, você tem acesso completo a todas as funcionalidades do plano escolhido por 14 dias. Não há limite de leads, usuários ou recursos durante o teste. Após esse período, você pode escolher assinar ou sua conta será pausada (sem perder dados).",
  },
  {
    question: "Posso migrar de outro CRM?",
    answer: "Sim! Oferecemos importação de leads via CSV/Excel. Você pode exportar seus dados do CRM atual e importar facilmente para o WorkFlow360. Para migrações maiores, nossa equipe pode ajudar no processo.",
  },
  {
    question: "Quantos leads posso cadastrar?",
    answer: "Leads ilimitados em todos os planos! Não limitamos a quantidade de leads, contatos ou oportunidades que você pode gerenciar. Você paga apenas pela quantidade de usuários.",
  },
  {
    question: "O sistema funciona no celular?",
    answer: "Sim! O WorkFlow360 é totalmente responsivo e funciona perfeitamente em smartphones e tablets. Você pode acompanhar suas vendas, adicionar leads e gerenciar sua equipe de qualquer lugar.",
  },
  {
    question: "Posso adicionar mais usuários depois?",
    answer: "Claro! Você pode adicionar ou remover usuários a qualquer momento. No plano Individual você tem 1 usuário, no Equipe até 10, e no Enterprise usuários ilimitados.",
  },
  {
    question: "Os dados ficam seguros?",
    answer: "Sim! Utilizamos infraestrutura de nível enterprise com criptografia de ponta a ponta, backups automáticos e servidores seguros. Seus dados estão protegidos 24/7.",
  },
  {
    question: "Tem integração com WhatsApp?",
    answer: "Sim! O plano Equipe e Enterprise incluem integração com WhatsApp para envio de mensagens e campanhas diretamente do CRM. Você pode se comunicar com leads sem sair do sistema.",
  },
  {
    question: "Como funciona o suporte?",
    answer: "No plano Individual oferecemos suporte por email. No plano Equipe você tem acesso a suporte prioritário via chat. No Enterprise, você conta com um gerente de sucesso dedicado e suporte 24/7.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Não temos fidelidade ou multas. Você pode cancelar sua assinatura quando quiser. No plano anual, você continua tendo acesso até o fim do período pago.",
  },
];

export const ExpandedFAQ = () => {
  return (
    <section id="faq" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Perguntas{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Frequentes
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tudo que você precisa saber antes de começar.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/50 rounded-xl px-6 bg-card/30 backdrop-blur-sm data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="text-foreground font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
