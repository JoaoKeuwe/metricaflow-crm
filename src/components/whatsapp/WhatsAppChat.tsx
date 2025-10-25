import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppChatProps {
  leadId: string;
  leadPhone: string;
  leadName: string;
  readOnly?: boolean;
}

export function WhatsAppChat({ leadId, leadPhone, leadName, readOnly = false }: WhatsAppChatProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Buscar mensagens
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["whatsapp-messages", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
        body: {
          lead_id: leadId,
          phone: leadPhone,
          message: text,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Mensagem enviada!");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", leadId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`whatsapp-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", leadId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3" />;
      case "delivered":
      case "read":
        return <CheckCheck className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 h-[500px] flex items-center justify-center">
        <p className="text-muted-foreground">Carregando conversas...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 h-[500px] flex flex-col">
      <div className="mb-4 pb-4 border-b">
        <h3 className="font-semibold">{leadName}</h3>
        <p className="text-sm text-muted-foreground">{leadPhone}</p>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm mt-2">Envie a primeira mensagem para {leadName}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === "sent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.direction === "sent"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {/* React auto-escapes text content - safe from XSS */}
                  <p className="text-sm break-words">{msg.message}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 text-xs ${
                      msg.direction === "sent"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span>
                      {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                    </span>
                    {msg.direction === "sent" && (
                      <span className="ml-1">{getStatusIcon(msg.status)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="mt-4 pt-4 border-t">
        {readOnly ? (
          <div className="bg-muted p-3 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Modo visualização - Apenas gestores podem enviar mensagens
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
