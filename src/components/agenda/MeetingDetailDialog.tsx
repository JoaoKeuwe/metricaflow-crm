import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Users, UserCircle, FileText, Pencil, Trash2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FeedbackDialog from "./FeedbackDialog";
import MeetingDialog from "./MeetingDialog";
import { useQuery } from "@tanstack/react-query";

interface MeetingDetailDialogProps {
  meeting: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch: () => void;
}

const MeetingDetailDialog = ({ meeting, open, onOpenChange, onRefetch }: MeetingDetailDialogProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: leads } = useQuery({
    queryKey: ["leads-for-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users-for-meetings"],
    queryFn: async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profileData) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("company_id", profileData.company_id)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", meeting.id);

      if (error) throw error;

      toast({
        title: "Reunião excluída",
        description: "A reunião foi excluída com sucesso.",
      });

      onRefetch();
      onOpenChange(false);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("meetings")
        .update({ status: "realizada" })
        .eq("id", meeting.id);

      if (error) throw error;

      toast({
        title: "Reunião marcada como realizada",
        description: "A reunião foi marcada como realizada.",
      });

      onRefetch();
      
      // Check if feedback should be collected
      const endTime = new Date(meeting.end_time);
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      if (endTime < oneHourAgo && !meeting.feedback_collected) {
        setFeedbackDialogOpen(true);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      agendada: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
      realizada: "bg-green-500/20 text-green-700 dark:text-green-300",
      cancelada: "bg-red-500/20 text-red-700 dark:text-red-300",
    };
    return variants[status as keyof typeof variants] || "";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl">{meeting.title}</DialogTitle>
                <DialogDescription>
                  Detalhes completos da reunião
                </DialogDescription>
              </div>
              <Badge className={getStatusBadge(meeting.status)}>
                {meeting.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(meeting.start_time), "PPP", { locale: ptBR })}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(meeting.start_time), "HH:mm")} - {format(new Date(meeting.end_time), "HH:mm")}
              </span>
            </div>

            {meeting.lead && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCircle className="h-4 w-4" />
                <span>Lead: <strong>{meeting.lead.name}</strong></span>
              </div>
            )}

            {meeting.description && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Descrição</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{meeting.description}</p>
                </div>
              </>
            )}

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                <span className="font-medium">Participantes ({meeting.meeting_participants?.length || 0})</span>
              </div>
              <div className="space-y-2">
                {meeting.meeting_participants?.map((participant: any) => (
                  <div key={participant.user_id} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>{participant.profile?.name}</span>
                    {participant.is_organizer && (
                      <Badge variant="secondary" className="text-xs">Organizador</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {meeting.feedback && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Feedback</span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {meeting.feedback}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>

            {meeting.status === "agendada" && (
              <Button
                size="sm"
                onClick={handleMarkAsCompleted}
                disabled={isUpdating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Realizada
              </Button>
            )}

            {meeting.status === "realizada" && !meeting.feedback_collected && (
              <Button
                size="sm"
                onClick={() => setFeedbackDialogOpen(true)}
              >
                Adicionar Feedback
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FeedbackDialog
        meeting={meeting}
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        onRefetch={onRefetch}
      />

      {editDialogOpen && (
        <MeetingDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          leads={leads || []}
          users={users || []}
          meeting={meeting}
          onSuccess={() => {
            onRefetch();
            setEditDialogOpen(false);
          }}
        />
      )}
    </>
  );
};

export default MeetingDetailDialog;
