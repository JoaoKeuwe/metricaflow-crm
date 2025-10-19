import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ParsedLead {
  name: string;
  phone: string;
  email?: string;
  company?: string;
}

export default function BulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [autoProspect, setAutoProspect] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(
    "Olá {nome}! Tudo bem? Sou da empresa X e gostaria de conversar sobre..."
  );
  const [campaignName, setCampaignName] = useState("");
  const [delaySeconds, setDelaySeconds] = useState("15");
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [importResult, setImportResult] = useState<any>(null);

  const parseCSV = (text: string): ParsedLead[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const nameIndex = headers.findIndex((h) => h.includes("nome") || h === "name");
    const phoneIndex = headers.findIndex((h) => h.includes("telefone") || h.includes("phone"));
    const emailIndex = headers.findIndex((h) => h.includes("email") || h === "e-mail");
    const companyIndex = headers.findIndex((h) => h.includes("empresa") || h === "company");

    if (nameIndex === -1 || phoneIndex === -1) {
      throw new Error("Arquivo deve conter colunas 'nome' e 'telefone'");
    }

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return {
        name: values[nameIndex],
        phone: values[phoneIndex],
        email: emailIndex !== -1 ? values[emailIndex] : undefined,
        company: companyIndex !== -1 ? values[companyIndex] : undefined,
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    // Preview do arquivo
    try {
      const text = await selectedFile.text();
      const leads = parseCSV(text);
      setParsedLeads(leads);
      toast.success(`${leads.length} leads encontrados no arquivo`);
    } catch (error: any) {
      toast.error(error.message);
      setFile(null);
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsedLeads.length) throw new Error("Nenhum lead para importar");

      const { data, error } = await supabase.functions.invoke("bulk-import-leads", {
        body: {
          leads: parsedLeads,
          auto_prospect: autoProspect,
          message_template: autoProspect ? messageTemplate : undefined,
          campaign_name: autoProspect ? campaignName || `Importação ${new Date().toLocaleDateString()}` : undefined,
          delay_seconds: parseInt(delaySeconds),
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast.success("Importação concluída!");
      
      if (data.campaign_id) {
        toast.info("Campanha de prospecção iniciada!");
      }
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Importação em Massa</h1>
        <p className="text-muted-foreground mt-2">
          Importe leads de uma planilha CSV e inicie prospecção automática via WhatsApp
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Arquivo CSV
            </CardTitle>
            <CardDescription>
              Formato esperado: nome, telefone, email (opcional), empresa (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Selecionar Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importMutation.isPending}
              />
              {parsedLeads.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  ✓ {parsedLeads.length} leads prontos para importar
                </p>
              )}
            </div>

            <Alert>
              <Upload className="h-4 w-4" />
              <AlertTitle>Exemplo de CSV</AlertTitle>
              <AlertDescription className="font-mono text-xs mt-2">
                nome,telefone,email,empresa<br />
                João Silva,11999999999,joao@email.com,Empresa X<br />
                Maria Santos,11988888888,maria@email.com,Empresa Y
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prospecção Automática</CardTitle>
            <CardDescription>
              Configure o envio automático de mensagens via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ativar Prospecção</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar mensagens automaticamente após importar
                </p>
              </div>
              <Switch checked={autoProspect} onCheckedChange={setAutoProspect} />
            </div>

            {autoProspect && (
              <>
                <div>
                  <Label htmlFor="campaign-name">Nome da Campanha</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Ex: Campanha Black Friday 2024"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Mensagem Modelo</Label>
                  <Textarea
                    id="message"
                    placeholder="Use {nome}, {empresa}, {email} como variáveis"
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variáveis disponíveis: {"{nome}"}, {"{empresa}"}, {"{email}"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="delay">Delay entre mensagens (segundos)</Label>
                  <Select value={delaySeconds} onValueChange={setDelaySeconds}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 segundos</SelectItem>
                      <SelectItem value="15">15 segundos (recomendado)</SelectItem>
                      <SelectItem value="20">20 segundos</SelectItem>
                      <SelectItem value="30">30 segundos</SelectItem>
                      <SelectItem value="60">1 minuto</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delay maior reduz risco de bloqueio no WhatsApp
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{importResult.results.success}</p>
                  <p className="text-sm text-muted-foreground">Importados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{importResult.results.duplicates}</p>
                  <p className="text-sm text-muted-foreground">Duplicados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{importResult.results.errors}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>
            </div>

            {importResult.campaign_id && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Campanha Iniciada</AlertTitle>
                <AlertDescription>
                  As mensagens serão enviadas automaticamente com delay de {delaySeconds} segundos entre cada uma.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => importMutation.mutate()}
          disabled={!file || parsedLeads.length === 0 || importMutation.isPending}
        >
          {importMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Iniciar Importação
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
