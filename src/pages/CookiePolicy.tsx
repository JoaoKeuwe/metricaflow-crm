import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/sales">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Cookies</h1>
        <p className="text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. O que são Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies são pequenos arquivos de texto armazenados no seu navegador quando 
              você visita um site. Eles permitem que o site lembre informações sobre 
              sua visita, facilitando seu uso e tornando-o mais útil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Como Utilizamos Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              O WorkFlow360 utiliza cookies para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Manter você conectado à sua conta</li>
              <li>Lembrar suas preferências e configurações</li>
              <li>Entender como você usa nossa plataforma</li>
              <li>Melhorar nossos serviços</li>
              <li>Garantir a segurança da sua conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Tipos de Cookies que Utilizamos</h2>
            
            <h3 className="text-lg font-medium mt-4 mb-2">3.1 Cookies Essenciais</h3>
            <p className="text-muted-foreground leading-relaxed">
              Necessários para o funcionamento básico do site. Sem eles, você não conseguiria 
              fazer login ou usar funcionalidades essenciais.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>sb-auth-token:</strong> Mantém sua sessão de login ativa</li>
              <li><strong>theme:</strong> Armazena preferência de tema (claro/escuro)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">3.2 Cookies de Desempenho</h3>
            <p className="text-muted-foreground leading-relaxed">
              Coletam informações sobre como você usa o site para melhorarmos nossos serviços.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>_ga:</strong> Google Analytics - mede tráfego e uso</li>
              <li><strong>_gid:</strong> Google Analytics - identifica sessões</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">3.3 Cookies de Funcionalidade</h3>
            <p className="text-muted-foreground leading-relaxed">
              Permitem lembrar suas escolhas e preferências.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>sidebar-state:</strong> Estado do menu lateral (aberto/fechado)</li>
              <li><strong>onboarding-completed:</strong> Se você completou o tour inicial</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Cookies de Terceiros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos serviços de terceiros que podem definir seus próprios cookies:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Google Analytics:</strong> Análise de uso e comportamento</li>
              <li><strong>Stripe:</strong> Processamento de pagamentos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Duração dos Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os cookies podem ser:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Cookies de sessão:</strong> Apagados quando você fecha o navegador</li>
              <li><strong>Cookies persistentes:</strong> Permanecem por um período definido (até 2 anos)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Como Gerenciar Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você pode controlar cookies através das configurações do seu navegador:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies</li>
              <li><strong>Firefox:</strong> Opções → Privacidade e Segurança → Cookies</li>
              <li><strong>Safari:</strong> Preferências → Privacidade → Cookies</li>
              <li><strong>Edge:</strong> Configurações → Privacidade → Cookies</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>Atenção:</strong> Desabilitar cookies essenciais pode afetar o funcionamento 
              do site. Você pode não conseguir fazer login ou usar certas funcionalidades.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Opt-out de Analytics</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para desativar o rastreamento do Google Analytics, você pode:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Instalar o complemento de desativação do Google Analytics</li>
              <li>Usar o modo de navegação privada/anônima</li>
              <li>Configurar seu navegador para bloquear cookies de terceiros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Alterações na Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta política para refletir mudanças em nossas práticas 
              ou na legislação. A data da última atualização está no topo desta página.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre nossa política de cookies:
            </p>
            <ul className="list-none text-muted-foreground space-y-1 mt-2">
              <li>E-mail: privacidade@workflow360.com</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
