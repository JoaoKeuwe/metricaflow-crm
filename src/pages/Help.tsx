import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Mail, MessageCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Help = () => {
  const faqs = [
    {
      question: "Como adicionar um novo lead?",
      answer: "Vá para a página 'Leads' e clique no botão 'Novo Lead'. Preencha as informações obrigatórias (nome, email, telefone) e clique em 'Criar Lead'."
    },
    {
      question: "Como atribuir um lead a um vendedor?",
      answer: "Na lista de leads, clique no lead desejado. Na tela de detalhes, você pode alterar o campo 'Responsável' selecionando o vendedor desejado."
    },
    {
      question: "Como criar uma tarefa?",
      answer: "Acesse a página 'Tarefas' e clique em 'Nova Tarefa'. Defina o título, descrição, prazo e responsável. Você também pode vincular a tarefa a um lead específico."
    },
    {
      question: "Como agendar uma reunião?",
      answer: "Vá para 'Agenda' e clique em 'Nova Reunião'. Escolha o horário, participantes e lead relacionado. Todos os participantes receberão notificações automáticas."
    },
    {
      question: "Como convidar novos usuários?",
      answer: "Gestores e proprietários podem ir em 'Gestão de Usuários' e clicar em 'Convidar Usuário'. Digite o email e selecione o perfil. O usuário receberá um email para definir sua senha."
    },
    {
      question: "Como funciona a gamificação?",
      answer: "O sistema pontua automaticamente ações como criar leads, fechar vendas e completar tarefas. Acesse 'Gamificação' para ver o ranking e suas conquistas."
    },
    {
      question: "Como exportar dados de leads?",
      answer: "Na página de Leads, clique no botão 'Exportar' no canto superior direito. Você pode escolher entre PDF ou CSV com todos os dados filtrados."
    },
    {
      question: "Como integrar com WhatsApp?",
      answer: "Acesse 'Integrações' e configure sua instância do Evolution API. Após conectar, você poderá enviar e receber mensagens diretamente no sistema."
    },
    {
      question: "Como personalizar o sistema com a logo da empresa?",
      answer: "Proprietários podem acessar as configurações da empresa e fazer upload da logo. A logo aparecerá no cabeçalho do sistema para todos os usuários."
    },
    {
      question: "Como desativar notificações por email?",
      answer: "Acesse seu perfil de usuário e desative a opção 'Notificações por Email'. Você ainda receberá notificações dentro do sistema."
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Central de Ajuda</h1>
          <p className="text-muted-foreground">Encontre respostas e aprenda a usar o sistema</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <PlayCircle className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Tutorial em Vídeo</CardTitle>
            <CardDescription>Aprenda em 5 minutos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href="https://www.youtube.com/watch?v=example" target="_blank" rel="noopener noreferrer">
                Assistir Tutorial
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Documentação PDF</CardTitle>
            <CardDescription>Guia completo de funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Baixar Guia
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Mail className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Suporte por Email</CardTitle>
            <CardDescription>Tire suas dúvidas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:suporte@seucrm.com">
                Enviar Email
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
          <CardDescription>Respostas rápidas para dúvidas comuns</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <MessageCircle className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Ainda tem dúvidas?</CardTitle>
          <CardDescription>Entre em contato conosco pelo WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full md:w-auto" asChild>
            <a
              href="https://wa.me/5511999999999?text=Olá,%20preciso%20de%20ajuda%20com%20o%20CRM"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Falar no WhatsApp
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;