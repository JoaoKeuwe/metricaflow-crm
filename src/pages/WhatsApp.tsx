import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WhatsAppChat } from "@/components/whatsapp/WhatsAppChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const WhatsApp = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);

  // Buscar todas as conversas do WhatsApp
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["whatsapp-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select(`
          id,
          phone,
          message,
          created_at,
          direction,
          lead_id,
          leads (
            id,
            name,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Agrupar por lead_id e pegar a última mensagem de cada
      const conversationsMap = new Map();
      data?.forEach((msg: any) => {
        if (msg.lead_id && !conversationsMap.has(msg.lead_id)) {
          conversationsMap.set(msg.lead_id, {
            lead_id: msg.lead_id,
            lead_name: msg.leads?.name || "Lead sem nome",
            lead_phone: msg.leads?.phone || msg.phone,
            last_message: msg.message,
            last_message_time: msg.created_at,
            direction: msg.direction,
          });
        }
      });

      return Array.from(conversationsMap.values());
    },
  });

  // Contar mensagens por lead
  const { data: messageCounts } = useQuery({
    queryKey: ["whatsapp-message-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("lead_id");

      if (error) throw error;

      const counts = new Map();
      data?.forEach((msg: any) => {
        if (msg.lead_id) {
          counts.set(msg.lead_id, (counts.get(msg.lead_id) || 0) + 1);
        }
      });

      return counts;
    },
  });

  const filteredConversations = conversations?.filter((conv) =>
    conv.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lead_phone.includes(searchTerm)
  );

  if (selectedLead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedLead(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar para conversas
          </button>
        </div>
        <WhatsAppChat
          leadId={selectedLead.id}
          leadPhone={selectedLead.phone}
          leadName={selectedLead.name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp</h1>
          <p className="text-muted-foreground">
            Gerencie todas as conversas do WhatsApp
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          {conversations?.length || 0} conversas
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredConversations && filteredConversations.length > 0 ? (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.lead_id}
                    onClick={() =>
                      setSelectedLead({
                        id: conv.lead_id,
                        name: conv.lead_name,
                        phone: conv.lead_phone,
                      })
                    }
                    className="w-full text-left p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {conv.lead_name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {messageCounts?.get(conv.lead_id) || 0} msgs
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {conv.lead_phone}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.direction === "sent" ? "Você: " : ""}
                          {conv.last_message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(conv.last_message_time), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsApp;
