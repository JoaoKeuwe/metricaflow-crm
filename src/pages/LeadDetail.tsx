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
import { ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

  const { data: notes } = useQuery({
    queryKey: ["lead-notes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_observations")
        .select("*, profiles(name)")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: { content: string; note_type: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("lead_observations").insert({
        lead_id: id,
        user_id: user.id,
        content: data.content,
        note_type: data.note_type,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notes", id] });
      toast({ title: "Nota adicionada com sucesso!" });
      setNoteContent("");
      setNoteType("Contato feito");
      setCustomNoteType("");
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
    addNoteMutation.mutate({ content: noteContent, note_type: finalNoteType });
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
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
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

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Nota
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {notes?.map((note: any) => (
              <Card key={note.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{note.note_type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {note.profiles?.name}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(note.created_at), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </CardContent>
              </Card>
            ))}
            {notes?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma nota adicionada ainda
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadDetail;
