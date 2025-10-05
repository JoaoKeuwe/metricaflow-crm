import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Eye, MessageCircle } from "lucide-react";

const columns = [
  { id: "novo", title: "Novo", color: "bg-blue-500" },
  { id: "contato_feito", title: "Contato Feito", color: "bg-yellow-500" },
  { id: "proposta", title: "Proposta", color: "bg-purple-500" },
  { id: "negociacao", title: "Negociação", color: "bg-orange-500" },
  { id: "ganho", title: "Ganho", color: "bg-green-500" },
  { id: "perdido", title: "Perdido", color: "bg-red-500" },
];

const formatPhoneForWhatsApp = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("55")) {
    return cleanPhone;
  }
  return `55${cleanPhone}`;
};

const Kanban = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: leads } = useQuery({
    queryKey: ["kanban-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Realtime listener para sincronização instantânea
  useEffect(() => {
    const channel = supabase
      .channel('kanban-leads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast({ title: "Status atualizado com sucesso!" });
    },
  });

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    updateStatusMutation.mutate({ id: leadId, status });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kanban</h1>
        <p className="text-muted-foreground mt-1">
          Visualize e organize seus leads
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {columns.map((column) => {
          const columnLeads = leads?.filter(
            (lead: any) => lead.status === column.id
          );

          return (
            <div
              key={column.id}
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {columnLeads?.length || 0}
                </Badge>
              </div>

              <div className="space-y-2">
                {columnLeads?.map((lead: any) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="cursor-move hover:shadow-lg transition-all"
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">{lead.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="space-y-1">
                        {lead.email && (
                          <p className="text-xs text-muted-foreground">
                            {lead.email}
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground">
                            {lead.phone}
                          </p>
                        )}
                        {lead.profiles && (
                          <Badge variant="outline" className="text-xs">
                            {lead.profiles.name}
                          </Badge>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/leads/${lead.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver detalhes</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={!lead.phone}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (lead.phone) {
                                    const formattedPhone = formatPhoneForWhatsApp(lead.phone);
                                    window.open(`https://wa.me/${formattedPhone}`, "_blank");
                                  } else {
                                    toast({
                                      title: "Telefone não cadastrado",
                                      description: "Este lead não possui telefone cadastrado.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Abrir WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Kanban;
