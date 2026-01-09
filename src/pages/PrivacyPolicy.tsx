import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/sales">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade e LGPD</h1>
        <p className="text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Privacidade descreve como o WorkFlow360 coleta, usa, armazena 
              e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de 
              Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Controlador dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              O WorkFlow360 é o controlador dos dados pessoais coletados através de nossa 
              plataforma. Para questões relacionadas à privacidade, entre em contato com 
              nosso Encarregado de Proteção de Dados (DPO) pelo e-mail: privacidade@workflow360.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Dados Coletados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coletamos os seguintes tipos de dados:
            </p>
            <h3 className="text-lg font-medium mt-4 mb-2">3.1 Dados fornecidos por você:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Nome completo e e-mail</li>
              <li>Dados da empresa (nome, CNPJ)</li>
              <li>Informações de leads e clientes que você cadastrar</li>
              <li>Comunicações e anotações registradas</li>
            </ul>
            <h3 className="text-lg font-medium mt-4 mb-2">3.2 Dados coletados automaticamente:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Endereço IP e dados de navegação</li>
              <li>Tipo de dispositivo e navegador</li>
              <li>Logs de acesso e atividades na plataforma</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Finalidade do Tratamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos seus dados para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Enviar comunicações sobre o serviço</li>
              <li>Personalizar sua experiência</li>
              <li>Cumprir obrigações legais</li>
              <li>Prevenir fraudes e garantir a segurança</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Base Legal (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              O tratamento de dados é realizado com base em:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Execução de contrato:</strong> para fornecer o serviço contratado</li>
              <li><strong>Consentimento:</strong> para comunicações de marketing</li>
              <li><strong>Legítimo interesse:</strong> para melhorias e segurança</li>
              <li><strong>Cumprimento legal:</strong> para obrigações fiscais e regulatórias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Compartilhamos dados apenas com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Processadores de pagamento (Stripe)</li>
              <li>Provedores de infraestrutura (hospedagem, banco de dados)</li>
              <li>Serviços de e-mail transacional</li>
              <li>Autoridades, quando exigido por lei</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Todos os parceiros são obrigados contratualmente a proteger seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessá-los</li>
              <li><strong>Correção:</strong> atualizar dados incompletos ou incorretos</li>
              <li><strong>Anonimização ou exclusão:</strong> solicitar remoção de dados desnecessários</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
              <li><strong>Revogação:</strong> retirar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> recusar tratamento em certas situações</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Para exercer seus direitos, envie e-mail para: privacidade@workflow360.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Segurança dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas de segurança como:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Criptografia de dados em trânsito (TLS/SSL)</li>
              <li>Criptografia de dados em repouso</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Monitoramento e logs de segurança</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos seus dados pelo período necessário para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Fornecer o serviço enquanto sua conta estiver ativa</li>
              <li>Cumprir obrigações legais (mínimo 5 anos para dados fiscais)</li>
              <li>Defender nossos interesses legítimos</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Após o encerramento da conta, dados são mantidos por 30 dias antes da exclusão.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Transferência Internacional</h2>
            <p className="text-muted-foreground leading-relaxed">
              Alguns de nossos provedores de serviço podem estar localizados fora do Brasil. 
              Garantimos que todas as transferências internacionais são realizadas com as 
              devidas salvaguardas exigidas pela LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O WorkFlow360 não é destinado a menores de 18 anos. Não coletamos 
              intencionalmente dados de menores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Alterações na Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças 
              significativas por e-mail ou através da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contato e Reclamações</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas ou reclamações sobre privacidade:
            </p>
            <ul className="list-none text-muted-foreground space-y-1 mt-2">
              <li>E-mail: privacidade@workflow360.com</li>
              <li>DPO: Encarregado de Proteção de Dados</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Você também pode registrar reclamação junto à Autoridade Nacional de Proteção 
              de Dados (ANPD).
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Termos de Uso
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

export default PrivacyPolicy;
