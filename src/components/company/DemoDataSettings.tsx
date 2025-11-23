import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DemoDataSettings = () => {
  const [loading, setLoading] = useState(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Dados de Demonstração
        </CardTitle>
        <CardDescription>
          Popule o sistema com dados fictícios para testar todas as funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Esta ação irá criar dados de demonstração simulando <strong>12 meses de uso intensivo</strong> do sistema:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>300 leads</strong> distribuídos em todas as etapas do funil</li>
              <li><strong>600+ valores</strong> de vendas (únicos e recorrentes)</li>
              <li><strong>1500+ observações</strong> com diferentes tipos de notas</li>
              <li><strong>250 reuniões</strong> agendadas, realizadas e canceladas</li>
              <li><strong>400 tarefas</strong> individuais e em grupo</li>
              <li><strong>200 lembretes</strong> concluídos e pendentes</li>
            </ul>
            <p className="mt-3 text-sm">
              Os dados serão atribuídos aos usuários existentes na empresa e distribuídos ao longo dos últimos 12 meses.
            </p>
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleGenerateDemoData}
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando dados...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Gerar Dados de Demonstração
              </>
            )}
          </Button>
        </div>

        <Alert variant="default" className="bg-muted">
          <AlertDescription className="text-xs">
            <strong>Nota:</strong> Esta funcionalidade é ideal para ambientes de teste e demonstração. 
            Os dados são fictícios e não representam informações reais. Todos os nomes, empresas e 
            informações de contato são aleatórios.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default DemoDataSettings;
