import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Plus, RefreshCw, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiToken {
  id: string;
  token: string;
  name: string;
  active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface IntegrationLog {
  id: string;
  source: string;
  status: string;
  error_message: string | null;
  created_at: string;
  payload: any;
  lead_id: string | null;
}

export default function Integrations() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTokenName, setNewTokenName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const canManageIntegrations = userRole === "gestor" || userRole === "gestor_owner";

  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  const endpointUrl = `${projectUrl}/functions/v1/create-lead-from-external`;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const role = await loadUserRole();
    if (role === "gestor" || role === "gestor_owner") {
      await Promise.all([loadTokens(), loadLogs()]);
    }
    setLoading(false);
  };

  const loadUserRole = async (): Promise<string | null> => {
    const { data, error } = await supabase.rpc("get_user_role");

    if (error) {
      console.error("Erro ao carregar role do usuário:", error);
      return null;
    }

    const role = data as string | null;
    setUserRole(role);
    return role;
  };

  const loadTokens = async () => {
    const { data, error } = await supabase
      .from("api_tokens")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar tokens:", error);
      toast({ title: "Erro ao carregar tokens", variant: "destructive" });
    } else {
      setTokens(data || []);
    }
  };

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from("integration_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro ao carregar logs:", error);
      toast({ title: "Erro ao carregar logs", variant: "destructive" });
    } else {
      setLogs(data || []);
    }
  };

  const generateToken = async () => {
    if (!newTokenName.trim()) {
      toast({ title: "Nome do token é obrigatório", variant: "destructive" });
      return;
    }

    if (!canManageIntegrations) {
      toast({
        title: "Permissão negada",
        description: "Apenas gestores e owners podem criar tokens de API.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.rpc("create_api_token", {
        p_name: newTokenName.trim(),
      });

      if (error) {
        console.error("Erro RPC create_api_token:", error);
        const msg = (error as any)?.message || "Erro ao criar token";
        toast({
          title: msg.toLowerCase().includes("permissão") ? "Permissão negada" : "Erro ao criar token",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      const createdToken = data as string | null;
      if (!createdToken) {
        toast({ title: "Falha ao criar token", variant: "destructive" });
        return;
      }

      toast({ title: "Token criado com sucesso!" });
      setNewTokenName("");
      setIsDialogOpen(false);
      await loadTokens();
    } catch (error) {
      console.error("Erro ao criar token:", error);
      const msg = (error as any)?.message || "Erro ao criar token";
      toast({ title: "Erro ao criar token", description: msg, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const revokeToken = async (tokenId: string) => {
    const { error } = await supabase
      .from("api_tokens")
      .update({ active: false })
      .eq("id", tokenId);

    if (error) {
      console.error("Erro ao revogar token:", error);
      toast({ title: "Erro ao revogar token", variant: "destructive" });
    } else {
      toast({ title: "Token revogado com sucesso" });
      loadTokens();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado para a área de transferência!" });
  };

  const testIntegration = async () => {
    if (tokens.length === 0) {
      toast({ title: "Crie um token primeiro", variant: "destructive" });
      return;
    }

    const activeToken = tokens.find((t) => t.active);
    if (!activeToken) {
      toast({ title: "Nenhum token ativo encontrado", variant: "destructive" });
      return;
    }

    setTestLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-lead-from-external",
        {
          body: {
            name: "Lead de Teste",
            email: `teste-${Date.now()}@example.com`,
            phone: "11999999999",
            company: "Empresa Teste",
            source: "Teste de Integração",
            estimated_value: 1000,
          },
          headers: {
            Authorization: `Bearer ${activeToken.token}`,
          },
        }
      );

      const result = data as any;

      if (error || !result?.success) {
        const message = (error as any)?.message || result?.error || "Erro desconhecido";
        toast({ title: "❌ Erro na integração", description: message, variant: "destructive" });
      } else {
        toast({ title: "✅ Integração funcionando!", description: `Lead criado: ${result.lead_id}` });
        loadLogs();
      }
    } catch (error) {
      console.error("Erro ao testar:", error);
      toast({ title: "Erro ao testar integração", variant: "destructive" });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">
          Conecte o CRM com Google Sheets, n8n, Zapier e outras ferramentas
        </p>
      </div>

      <Tabs defaultValue="tokens" className="w-full">
        <TabsList>
          <TabsTrigger value="tokens">Tokens de API</TabsTrigger>
          <TabsTrigger value="logs">Histórico de Importações</TabsTrigger>
          <TabsTrigger value="docs">Documentação</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tokens de API</CardTitle>
              <CardDescription>
                Gere tokens seguros para integrar com ferramentas externas. Cada empresa tem seus próprios tokens isolados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Gerar Novo Token
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Token de API</DialogTitle>
                      <DialogDescription>
                        Dê um nome descritivo para identificar onde o token será usado (ex: "Planilha Google - Vendas")
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="token-name">Nome do Token</Label>
                        <Input
                          id="token-name"
                          placeholder="Ex: Planilha Google - Leads Marketing"
                          value={newTokenName}
                          onChange={(e) => setNewTokenName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={generateToken} disabled={isCreating}>
                        {isCreating ? "Gerando..." : "Criar Token"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={loadTokens}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>

                <Button variant="outline" onClick={testIntegration} disabled={testLoading}>
                  {testLoading ? "Testando..." : "Testar Integração"}
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Último uso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum token criado ainda
                        </TableCell>
                      </TableRow>
                    ) : (
                      tokens.map((token) => (
                        <TableRow key={token.id}>
                          <TableCell className="font-medium">{token.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {token.token.substring(0, 12)}...{token.token.slice(-4)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={() => copyToClipboard(token.token)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            {token.active ? (
                              <Badge variant="default">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Revogado</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(token.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {token.last_used_at
                              ? new Date(token.last_used_at).toLocaleString("pt-BR")
                              : "Nunca usado"}
                          </TableCell>
                          <TableCell className="text-right">
                            {token.active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => revokeToken(token.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Importações</CardTitle>
              <CardDescription>
                Últimas 50 requisições recebidas pela API (logs são mantidos por 30 dias)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={loadLogs} className="mb-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nome do Lead</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhuma importação registrada ainda
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {log.status === "success" ? (
                              <Badge variant="default">Sucesso</Badge>
                            ) : (
                              <Badge variant="destructive">Erro</Badge>
                            )}
                          </TableCell>
                          <TableCell>{log.payload?.name || "-"}</TableCell>
                          <TableCell>{log.payload?.email || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {log.error_message || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentação da API</CardTitle>
              <CardDescription>
                Como integrar o CRM com Google Sheets, n8n ou Zapier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Endpoint da API</Label>
                <div className="flex gap-2 items-center mt-2">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded">
                    {endpointUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(endpointUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Método HTTP</Label>
                <p className="text-sm mt-1">
                  <code className="bg-muted px-2 py-1 rounded">POST</code>
                </p>
              </div>

              <div>
                <Label>Headers Obrigatórios</Label>
                <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-x-auto">
{`Content-Type: application/json
Authorization: Bearer [SEU_TOKEN_AQUI]`}
                </pre>
              </div>

              <div>
                <Label>Exemplo de Payload JSON</Label>
                <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-x-auto">
{`{
  "name": "João Silva",              // obrigatório
  "email": "joao@example.com",       // opcional (valida duplicidade)
  "phone": "11999999999",            // opcional
  "company": "Empresa X",            // opcional
  "source": "Google Sheets",         // opcional
  "estimated_value": 5000,           // opcional
  "assigned_to": "uuid-do-vendedor"  // opcional
}`}
                </pre>
              </div>

              <div>
                <Label>Exemplo de Resposta (Sucesso)</Label>
                <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": true,
  "lead_id": "abc-123-xyz",
  "message": "Lead criado com sucesso"
}`}
                </pre>
              </div>

              <div>
                <Label>Exemplo de Resposta (Erro)</Label>
                <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": false,
  "error": "Email inválido"
}`}
                </pre>
              </div>

              <div className="pt-4 border-t">
                <Label>🔗 Links Úteis</Label>
                <div className="mt-2 space-y-2">
                  <a
                    href="https://n8n.io/integrations/webhook/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Como usar Webhooks no n8n
                  </a>
                  <a
                    href="https://zapier.com/apps/webhook/integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Como usar Webhooks no Zapier
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
