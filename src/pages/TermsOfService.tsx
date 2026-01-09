import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/sales">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e utilizar o WorkFlow360 ("Serviço"), você concorda em cumprir e estar 
              vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes 
              termos, não deverá usar o Serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O WorkFlow360 é uma plataforma de CRM (Customer Relationship Management) que oferece:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Gestão de leads e pipeline de vendas</li>
              <li>Gamificação e métricas de desempenho</li>
              <li>Relatórios e dashboards analíticos</li>
              <li>Integração com ferramentas de comunicação</li>
              <li>Automação de tarefas e lembretes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar o Serviço, você deve criar uma conta fornecendo informações 
              verdadeiras e completas. Você é responsável por manter a confidencialidade 
              de sua senha e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Planos e Pagamentos</h2>
            <p className="text-muted-foreground leading-relaxed">
              O WorkFlow360 oferece diferentes planos de assinatura. Ao contratar um plano pago:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>O pagamento é processado de forma recorrente (mensal ou anual)</li>
              <li>Você pode cancelar a qualquer momento, mantendo acesso até o fim do período pago</li>
              <li>Não há reembolso proporcional para cancelamentos antecipados</li>
              <li>Oferecemos período de teste gratuito de 14 dias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você concorda em não utilizar o Serviço para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Violar leis ou regulamentos aplicáveis</li>
              <li>Transmitir conteúdo ilegal, ofensivo ou malicioso</li>
              <li>Tentar acessar sistemas ou dados não autorizados</li>
              <li>Interferir no funcionamento normal do Serviço</li>
              <li>Revender ou redistribuir o Serviço sem autorização</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo, marcas, logos e software do WorkFlow360 são de propriedade 
              exclusiva da empresa. Você mantém a propriedade de todos os dados que inserir 
              na plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Disponibilidade do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nos esforçamos para manter o Serviço disponível 24/7, mas não garantimos 
              disponibilidade ininterrupta. Podemos realizar manutenções programadas, 
              sempre notificando os usuários com antecedência quando possível.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O WorkFlow360 não se responsabiliza por danos indiretos, incidentais ou 
              consequenciais decorrentes do uso do Serviço. Nossa responsabilidade total 
              é limitada ao valor pago pelo usuário nos últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Encerramento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos suspender ou encerrar sua conta por violação destes termos. Você pode 
              encerrar sua conta a qualquer momento através das configurações. Após o 
              encerramento, seus dados serão mantidos por 30 dias antes da exclusão definitiva.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Alterações nos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças 
              significativas por e-mail ou através do Serviço. O uso continuado após as 
              alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Lei Aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes termos são regidos pelas leis da República Federativa do Brasil. 
              Qualquer disputa será resolvida no foro da comarca de São Paulo, SP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes termos, entre em contato:
            </p>
            <ul className="list-none text-muted-foreground space-y-1 mt-2">
              <li>E-mail: contato@workflow360.com</li>
              <li>WhatsApp: (11) 99999-9999</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
