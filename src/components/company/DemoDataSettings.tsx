import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DemoDataSettings = () => {
  const [loading, setLoading] = useState(false);
  const [loadingSalespeople, setLoadingSalespeople] = useState(false);
  const { toast } = useToast();

  const handleGenerateDemoData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-data', {
        body: {}
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sucesso!",
          description: `Dados de demonstração criados com sucesso! ${data.stats.leads} leads, ${data.stats.leadValues} valores, ${data.stats.observations} observações, ${data.stats.meetings} reuniões, ${data.stats.tasks} tarefas e ${data.stats.reminders} lembretes foram criados.`,
        });
      } else {
        throw new Error(data.error || 'Erro ao gerar dados');
      }
    } catch (error: any) {
      console.error('Error generating demo data:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar os dados de demonstração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSalespeople = async () => {
    setLoadingSalespeople(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-demo-salespeople');

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sucesso!",
          description: `5 vendedores criados com sucesso e dados de 12 meses gerados! Credenciais: email demo, senha: Demo@2024`,
          duration: 10000,
        });
      } else {
        throw new Error(data.error || 'Erro ao criar vendedores');
      }
    } catch (error: any) {
      console.error('Error creating salespeople:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar os vendedores",
        variant: "destructive",
      });
    } finally {
      setLoadingSalespeople(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Criar Time de Vendedores Demo
          </CardTitle>
          <CardDescription>
            Crie 5 vendedores fictícios com dados dos últimos 12 meses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Esta ação irá criar <strong>5 vendedores fictícios</strong> na sua empresa com:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Credenciais de acesso automáticas (senha: Demo@2024)</li>
                <li>Leads, reuniões e tarefas distribuídas nos últimos 12 meses</li>
                <li>Performance variada (top, médio e baixo desempenho)</li>
                <li>Dados completos para análise no dashboard</li>
              </ul>
              <p className="mt-3 text-sm font-semibold text-primary">
                📧 Vendedores: ana.silva@demo.com, carlos.santos@demo.com, juliana.oliveira@demo.com, roberto.ferreira@demo.com, marina.costa@demo.com
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleCreateSalespeople}
              disabled={loadingSalespeople}
              size="lg"
              variant="default"
            >
              {loadingSalespeople ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando vendedores...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Criar Time de Vendedores Demo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerar Dados Adicionais
          </CardTitle>
          <CardDescription>
            Adicione mais dados aos usuários existentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Esta ação irá criar dados adicionais para os usuários existentes:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>300 leads</strong> distribuídos em todas as etapas do funil</li>
                <li><strong>600+ valores</strong> de vendas (únicos e recorrentes)</li>
                <li><strong>1500+ observações</strong> com diferentes tipos de notas</li>
                <li><strong>250 reuniões</strong> agendadas, realizadas e canceladas</li>
                <li><strong>400 tarefas</strong> individuais e em grupo</li>
                <li><strong>200 lembretes</strong> concluídos e pendentes</li>
              </ul>
              <p className="mt-3 text-sm">
                Os dados serão distribuídos ao longo dos últimos 12 meses.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleGenerateDemoData}
              disabled={loading}
              size="lg"
              variant="secondary"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando dados...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Gerar Dados Adicionais
                </>
              )}
            </Button>
          </div>

          <Alert variant="default" className="bg-muted">
            <AlertDescription className="text-xs">
              <strong>Nota:</strong> Esta funcionalidade é ideal para ambientes de teste e demonstração. 
              Os dados são fictícios e não representam informações reais.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoDataSettings;
