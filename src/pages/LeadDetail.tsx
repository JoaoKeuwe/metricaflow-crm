import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, FileDown, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { LinkedTasks } from "@/components/tasks/LinkedTasks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const NOTE_TYPES = [
  "Contato feito",
  "Cliente não responde",
  "Cliente analisando proposta",
  "Cliente vendo outros orçamentos",
  "Personalizado",
];

const statusColors: Record<string, string> = {
  novo: "bg-blue-500",
  contato_feito: "bg-yellow-500",
  proposta: "bg-purple-500",
  negociacao: "bg-orange-500",
  ganho: "bg-green-500",
  perdido: "bg-red-500",
};

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("Contato feito");
  const [customNoteType, setCustomNoteType] = useState("");
  const [returnDate, setReturnDate] = useState<Date>();

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, profiles(name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ["lead-notes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_observations")
        .select(`
          *,
          profiles:user_id (
            name
          )
        `)
        .eq("lead_id", id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar notas:", error);
        throw error;
      }
      console.log("Notas carregadas:", data);
      return data;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      return data?.role;
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: { content: string; note_type: string; return_date?: Date }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada. Por favor, faça login novamente.");

      // Inserir nota com data de retorno
      const { error } = await supabase.from("lead_observations").insert({
        lead_id: id,
        user_id: session.user.id,
        content: data.content,
        note_type: data.note_type,
        return_scheduled_date: data.return_date?.toISOString(),
      });

      if (error) throw error;

      // Se houver data de retorno, criar tarefa
      if (data.return_date) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const { error: taskError } = await supabase.from("tasks").insert({
            title: "Atualização de Lead",
            description: `Retorno agendado em ${format(data.return_date, "dd/MM/yyyy")} - Atualizar informações do lead ${lead?.name}`,
            assigned_to: session.user.id,
            created_by: session.user.id,
            company_id: profile.company_id,
            lead_id: id,
            due_date: data.return_date.toISOString(),
            status: "aberta",
          });

          if (taskError) console.error("Erro ao criar tarefa:", taskError);
        }
      }

      // Marcar tarefas de atualização pendentes como concluídas
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "concluida" })
        .eq("lead_id", id)
        .eq("title", "Atualização de Lead")
        .eq("status", "aberta");

      if (taskError) console.error("Erro ao atualizar tarefas:", taskError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notes", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Nota adicionada com sucesso!" });
      setNoteContent("");
      setNoteType("Contato feito");
      setCustomNoteType("");
      setReturnDate(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNoteType = noteType === "Personalizado" ? customNoteType : noteType;
    if (!noteContent.trim() || !finalNoteType.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o conteúdo e tipo da nota",
        variant: "destructive",
      });
      return;
    }
    addNoteMutation.mutate({ 
      content: noteContent, 
      note_type: finalNoteType,
      return_date: returnDate 
    });
  };

  const handleExportPDF = () => {
    if (!lead || !notes) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Título
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Histórico de Conversas - CRM", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Informações do Lead
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Informações do Lead:", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${lead.name}`, 20, yPosition);
    yPosition += 6;
    if (lead.company) {
      doc.text(`Empresa: ${lead.company}`, 20, yPosition);
      yPosition += 6;
    }
    if (lead.email) {
      doc.text(`Email: ${lead.email}`, 20, yPosition);
      yPosition += 6;
    }
    if (lead.phone) {
      doc.text(`Telefone: ${lead.phone}`, 20, yPosition);
      yPosition += 6;
    }
    doc.text(`Status: ${lead.status}`, 20, yPosition);
    yPosition += 6;
    if (lead.profiles?.name) {
      doc.text(`Vendedor: ${lead.profiles.name}`, 20, yPosition);
      yPosition += 10;
    }

    // Notas
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Histórico de Interações:", 20, yPosition);
    yPosition += 10;

    notes.forEach((note: any, index) => {
      // Verificar se precisa de nova página
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const dateStr = format(new Date(note.created_at), "dd/MM/yyyy HH:mm");
      doc.text(`[${dateStr}] ${note.profiles?.name || "Usuário"} - ${note.note_type}`, 20, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "normal");
      const splitContent = doc.splitTextToSize(note.content, pageWidth - 40);
      splitContent.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
      yPosition += 8;
    });

    // Salvar PDF
    doc.save(`lead-${lead.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
    
    toast({
      title: "PDF exportado com sucesso!",
      description: "O arquivo foi baixado para seu dispositivo",
    });
  };


  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!lead) {
    return <div className="p-6">Lead não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{lead.name}</h1>
          <p className="text-muted-foreground mt-1">Detalhes do Lead</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Nome</Label>
              <p className="font-medium">{lead.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{lead.email || "—"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Telefone</Label>
              <p className="font-medium">{lead.phone || "—"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Empresa</Label>
              <p className="font-medium">{lead.company || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes Comerciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Origem</Label>
              <p className="font-medium">{lead.source || "—"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Valor Estimado</Label>
              <p className="font-medium">
                {lead.estimated_value
                  ? `R$ ${Number(lead.estimated_value).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}`
                  : "—"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Responsável</Label>
              <p className="font-medium">{lead.profiles?.name || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex gap-3 mb-4">
            <Button 
              onClick={handleExportPDF} 
              variant="outline"
              disabled={!notes || notes.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Nota</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note-type">Tipo de Nota</Label>
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {noteType === "Personalizado" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-type">Tipo Personalizado</Label>
                    <Input
                      id="custom-type"
                      value={customNoteType}
                      onChange={(e) => setCustomNoteType(e.target.value)}
                      placeholder="Digite o tipo da nota"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="note-content">Nota</Label>
                  <Textarea
                    id="note-content"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Digite sua nota aqui..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Agendar Retorno (Opcional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarClock className="h-4 w-4 mr-2" />
                        {returnDate ? format(returnDate, "dd/MM/yyyy") : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={setReturnDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {returnDate && (
                    <p className="text-xs text-muted-foreground">
                      Uma tarefa será criada para {format(returnDate, "dd/MM/yyyy")}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Nota
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Notas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingNotes ? (
                <p className="text-center text-muted-foreground py-8">
                  Carregando notas...
                </p>
              ) : notes && notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note: any) => (
                    <div key={note.id} className="border-l-4 border-primary pl-4 py-3 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="font-semibold">
                            {note.note_type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {note.profiles?.name || "Usuário"}
                          </span>
                          {note.return_scheduled_date && (
                            <Badge variant="outline" className="gap-1">
                              <CalendarClock className="h-3 w-3" />
                              Retorno: {format(new Date(note.return_scheduled_date), "dd/MM/yyyy")}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">
                    Nenhuma nota adicionada ainda
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Adicione a primeira nota para começar o histórico
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <LinkedTasks leadId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadDetail;
