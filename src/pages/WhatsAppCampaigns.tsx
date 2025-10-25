import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Send, Calendar, Users, TrendingUp, AlertCircle, Play, Pause, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WhatsAppCampaigns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<string>("all");
  const queryClient = useQueryClient();

  // Buscar perfil do usuário
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar campanhas
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ["whatsapp-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Buscar leads para seleção
  const { data: leads } = useQuery({
    queryKey: ["leads-for-campaign", selectedLeadStatus],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("id, name, phone, status, company")
        .not("phone", "is", null);

      if (selectedLeadStatus !== "all") {
        query = query.eq("status", selectedLeadStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Criar campanha
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      if (!profile?.company_id) throw new Error("Perfil não encontrado");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      // Criar campanha
      const { data: campaign, error: campaignError } = await supabase
        .from("whatsapp_campaigns")
        .insert({
          ...campaignData,
          company_id: profile.company_id,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Adicionar destinatários
      const recipients = campaignData.selectedLeads.map((leadId: string) => {
        const lead = leads?.find(l => l.id === leadId);
        return {
          campaign_id: campaign.id,
          lead_id: leadId,
          phone: lead?.phone,
        };
      });

      const { error: recipientsError } = await supabase
        .from("campaign_recipients")
        .insert(recipients);

      if (recipientsError) throw recipientsError;

      // Atualizar total de destinatários
      await supabase
        .from("whatsapp_campaigns")
        .update({ total_recipients: recipients.length })
        .eq("id", campaign.id);

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      toast.success("Campanha criada com sucesso!");
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao criar campanha: " + error.message);
    },
  });

  // Executar campanha
  const executeCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke("execute-whatsapp-campaign", {
        body: { campaignId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      toast.success(`Campanha executada! ${data.sentCount} mensagens enviadas.`);
    },
    onError: (error) => {
      toast.error("Erro ao executar campanha: " + error.message);
    },
  });

  // Deletar campanha
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from("whatsapp_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      toast.success("Campanha deletada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao deletar campanha: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Rascunho" },
      scheduled: { variant: "default", label: "Agendada" },
      sending: { variant: "default", label: "Enviando" },
      completed: { variant: "default", label: "Concluída" },
      cancelled: { variant: "destructive", label: "Cancelada" },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campanhas WhatsApp</h1>
          <p className="text-muted-foreground">
            Crie e gerencie disparos de mensagens em massa
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Configure sua campanha de disparos WhatsApp
              </DialogDescription>
            </DialogHeader>
            <CampaignForm
              leads={leads || []}
              selectedLeadStatus={selectedLeadStatus}
              setSelectedLeadStatus={setSelectedLeadStatus}
              onSubmit={(data) => createCampaignMutation.mutate(data)}
              isSubmitting={createCampaignMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns && campaigns.length > 0
                ? Math.round(
                    (campaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0) /
                      campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)) *
                      100
                  ) || 0
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.filter((c) => c.status === "sending" || c.status === "scheduled")
                .length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Campanhas */}
      <div className="space-y-4">
        {isLoadingCampaigns ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : campaigns && campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>
                      Criada em {format(new Date(campaign.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    {getStatusBadge(campaign.status)}
                    {campaign.use_ai_personalization && (
                      <Badge variant="outline">IA Personalizada</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {campaign.message_template}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Destinatários</p>
                      <p className="font-medium">{campaign.total_recipients}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Enviadas</p>
                      <p className="font-medium text-green-600">{campaign.sent_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Entregues</p>
                      <p className="font-medium text-blue-600">{campaign.delivered_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lidas</p>
                      <p className="font-medium text-purple-600">{campaign.read_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Falhas</p>
                      <p className="font-medium text-red-600">{campaign.failed_count}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {campaign.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => executeCampaignMutation.mutate(campaign.id)}
                        disabled={executeCampaignMutation.isPending}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Executar Agora
                      </Button>
                    )}
                    {(campaign.status === "draft" || campaign.status === "cancelled") && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                        disabled={deleteCampaignMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Send className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma campanha criada ainda</p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Criar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Componente do formulário
function CampaignForm({
  leads,
  selectedLeadStatus,
  setSelectedLeadStatus,
  onSubmit,
  isSubmitting,
}: any) {
  const [formData, setFormData] = useState({
    name: "",
    message_template: "",
    interval_seconds: 5,
    use_ai_personalization: false,
    ai_instructions: "",
    selectedLeads: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message_template || formData.selectedLeads.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome da Campanha *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Promoção Black Friday"
          required
        />
      </div>

      <div>
        <Label htmlFor="message">Mensagem do Template *</Label>
        <Textarea
          id="message"
          value={formData.message_template}
          onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
          placeholder="Olá {nome}! Temos uma oferta especial para {empresa}..."
          rows={5}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use {"{nome}"}, {"{empresa}"}, {"{email}"} para personalizar
        </p>
      </div>

      <div>
        <Label htmlFor="interval">Intervalo entre mensagens (segundos)</Label>
        <Input
          id="interval"
          type="number"
          min="1"
          value={formData.interval_seconds}
          onChange={(e) => setFormData({ ...formData, interval_seconds: parseInt(e.target.value) })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="ai-personalization"
          checked={formData.use_ai_personalization}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, use_ai_personalization: checked })
          }
        />
        <Label htmlFor="ai-personalization">
          Usar IA para personalização avançada
        </Label>
      </div>

      {formData.use_ai_personalization && (
        <div>
          <Label htmlFor="ai-instructions">Instruções para a IA</Label>
          <Textarea
            id="ai-instructions"
            value={formData.ai_instructions}
            onChange={(e) => setFormData({ ...formData, ai_instructions: e.target.value })}
            placeholder="Ex: Seja mais informal, use emojis, foque em benefícios..."
            rows={3}
          />
        </div>
      )}

      <div>
        <Label>Selecionar Leads *</Label>
        <Select value={selectedLeadStatus} onValueChange={setSelectedLeadStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="contato">Contato</SelectItem>
            <SelectItem value="qualificado">Qualificado</SelectItem>
            <SelectItem value="proposta">Proposta</SelectItem>
          </SelectContent>
        </Select>

        <div className="mt-2 border rounded-md max-h-64 overflow-y-auto">
          {leads && leads.length > 0 ? (
            <div className="p-2 space-y-1">
              {leads.map((lead: any) => (
                <label
                  key={lead.id}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedLeads.includes(lead.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          selectedLeads: [...formData.selectedLeads, lead.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          selectedLeads: formData.selectedLeads.filter((id) => id !== lead.id),
                        });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.phone} • {lead.company || "Sem empresa"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-4 text-center">
              Nenhum lead encontrado com telefone
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formData.selectedLeads.length} leads selecionados
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar Campanha"}
        </Button>
      </div>
    </form>
  );
}