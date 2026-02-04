import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  Phone,
  MapPin,
  Star,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Globe,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import { ProspectingCard } from "@/components/prospecting/ProspectingCard";
import { ProspectingStats } from "@/components/prospecting/ProspectingStats";

// Webhook URL
const WEBHOOK_URL =
  "https://n8n-principal-n8n.dczlic.easypanel.host/webhook/112bb213-d3a9-442e-8c8a-1f55c890429e";

// Interface para resposta do webhook
interface WebhookResult {
  Nome: string;
  Telefone?: string;
  Endereco?: string;
  Cidade?: string;
  Site?: string;
}

interface WebhookResponse {
  ok: boolean;
  termo: string;
  count: number;
  results: WebhookResult[];
}

interface ProspectLead {
  id: string;
  nome: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  rating?: number;
  endereco?: string;
  website?: string;
  categoria?: string;
}

const Prospecting = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isProspecting, setIsProspecting] = useState(false);
  const [prospectingComplete, setProspectingComplete] = useState(false);
  const [leads, setLeads] = useState<ProspectLead[]>([]);

  // Mutation para enviar mensagem ao webhook
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      setIsProspecting(true);
      setProspectingComplete(false);

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termo_de_busca: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const raw = await response.json();

      if (Array.isArray(raw) && raw.length > 0 && raw[0]?.Nome) {
        return {
          ok: true,
          termo: message,
          count: raw.length,
          results: raw,
        };
      }
      

      if (raw?.code !== undefined && raw?.message) {
        throw new Error(raw.message || "Erro no workflow do n8n");
      }

      // Se vier array com wrapper, pega o primeiro elemento
      const data: WebhookResponse = Array.isArray(raw) ? raw[0] : raw;

      // Verificar novamente se é erro após extrair do array
      if (data?.code !== undefined && data?.message) {
        throw new Error(data.message || "Erro no workflow do n8n");
      }

      if (!data?.ok) {
        throw new Error("A busca não retornou resultados válidos");
      }

      return data;
    },
    onSuccess: (data: WebhookResponse) => {
      // Mapear resultados do webhook para o formato ProspectLead
      if (data?.results && Array.isArray(data.results)) {
        const mappedLeads: ProspectLead[] = data.results.map(
          (result, index) => ({
            id: `lead-${Date.now()}-${index}`,
            nome: result.Nome,
            telefone: result.Telefone,
            cidade: result.Cidade,
            endereco: result.Endereco,
            website: result.Site,
          })
        );

        setLeads(mappedLeads);

        toast.success("🎯 Prospecção finalizada!", {
          description: `${mappedLeads.length} leads encontrados`,
          duration: 5000,
        });
      } else {
        setLeads([]);
        toast.info("Nenhum lead encontrado", {
          description: "Tente um termo de busca diferente",
        });
      }
      setIsProspecting(false);
      setProspectingComplete(true);
      setSearchTerm("");
    },
    onError: (error) => {
      setIsProspecting(false);
      toast.error("Erro na prospecção", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.warning("Digite um termo de busca", {
        description: "Ex: Imobiliárias em São Paulo, Brasil",
      });
      return;
    }
    sendMessageMutation.mutate(searchTerm);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pt-20 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent shrink-0">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                  Prospecção Inteligente
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Busque e prospecte leads automaticamente com IA
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="premium-card">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Nova Prospecção
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Digite o que deseja buscar. Ex: "Imobiliárias em São Paulo,
                  Brasil"
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <Input
                      placeholder="Digite o termo de busca..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={isProspecting}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isProspecting}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground h-11 sm:h-12 px-4 sm:px-8 w-full sm:w-auto"
                  >
                    {isProspecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span className="hidden sm:inline">
                          Prospectando...
                        </span>
                        <span className="sm:hidden">Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">
                          Iniciar Prospecção
                        </span>
                        <span className="sm:hidden">Prospectar</span>
                      </>
                    )}
                  </Button>
                </form>

                {/* Status da Prospecção */}
                {isProspecting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="relative shrink-0">
                        <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary rounded-full animate-pulse" />
                        <div className="absolute inset-0 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary rounded-full animate-ping" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-primary text-sm sm:text-base">
                          Prospecção em andamento...
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          A IA está analisando e buscando leads
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {prospectingComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-green-600 dark:text-green-400 text-sm sm:text-base">
                          Prospecção finalizada!
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {leads.length} leads encontrados
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ProspectingStats leads={leads} />
          </motion.div>

          {/* Leads Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="truncate">Leads Prospectados</span>
              </h2>
              <Badge
                variant="outline"
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm shrink-0"
              >
                {leads.length} leads
              </Badge>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {leads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <ProspectingCard lead={lead} />
                </motion.div>
              ))}
            </div>

            {leads.length === 0 && !isProspecting && (
              <Card className="premium-card">
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                  <Search className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-muted-foreground text-center">
                    Nenhum lead prospectado ainda
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 text-center">
                    Digite um termo de busca acima para iniciar
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Prospecting;
