import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  date: z.date({ required_error: "Selecione uma data" }),
  startTime: z.string().min(1, "Horário de início é obrigatório"),
  endTime: z.string().min(1, "Horário de término é obrigatório"),
  leadId: z.string().optional(),
  participantIds: z.array(z.string()).min(1, "Selecione pelo menos um participante"),
});

interface MeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: any[];
  users: any[];
  onSuccess: () => void;
  meeting?: any;
}

const MeetingDialog = ({ open, onOpenChange, leads, users, onSuccess, meeting }: MeetingDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: meeting ? {
      title: meeting.title,
      description: meeting.description || "",
      date: new Date(meeting.start_time),
      startTime: format(new Date(meeting.start_time), "HH:mm"),
      endTime: format(new Date(meeting.end_time), "HH:mm"),
      leadId: meeting.lead_id || undefined,
      participantIds: meeting.meeting_participants?.map((p: any) => p.user_id) || [],
    } : {
      title: "",
      description: "",
      startTime: "09:00",
      endTime: "10:00",
      participantIds: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      const [startHour, startMinute] = values.startTime.split(":").map(Number);
      const [endHour, endMinute] = values.endTime.split(":").map(Number);

      const startTime = new Date(values.date);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(values.date);
      endTime.setHours(endHour, endMinute, 0, 0);

      if (endTime <= startTime) {
        toast({
          title: "Erro",
          description: "O horário de término deve ser após o horário de início",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (meeting) {
        // Update existing meeting
        const { error } = await supabase
          .from("meetings")
          .update({
            title: values.title,
            description: values.description,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            lead_id: values.leadId || null,
          })
          .eq("id", meeting.id);

        if (error) throw error;

        // Update participants
        await supabase
          .from("meeting_participants")
          .delete()
          .eq("meeting_id", meeting.id);

        const participants = values.participantIds.map((userId) => ({
          meeting_id: meeting.id,
          user_id: userId,
          is_organizer: userId === user.id,
        }));

        const { error: participantsError } = await supabase
          .from("meeting_participants")
          .insert(participants);

        if (participantsError) throw participantsError;

        toast({
          title: "Reunião atualizada",
          description: "A reunião foi atualizada com sucesso.",
        });
      } else {
        // Create new meeting
        const { data: meetingData, error } = await supabase
          .from("meetings")
          .insert({
            company_id: profile.company_id,
            title: values.title,
            description: values.description,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            lead_id: values.leadId || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Add participants
        const participants = values.participantIds.map((userId) => ({
          meeting_id: meetingData.id,
          user_id: userId,
          is_organizer: userId === user.id,
        }));

        const { error: participantsError } = await supabase
          .from("meeting_participants")
          .insert(participants);

        if (participantsError) throw participantsError;

        // Add note to lead if linked
        if (values.leadId) {
          await supabase.from("lead_observations").insert({
            lead_id: values.leadId,
            user_id: user.id,
            content: `Reunião agendada: ${values.title} - ${format(startTime, "dd/MM/yyyy 'às' HH:mm")}`,
            note_type: "Reunião agendada",
          });
        }
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting ? "Editar Reunião" : "Nova Reunião"}</DialogTitle>
          <DialogDescription>
            {meeting ? "Edite os detalhes da reunião" : "Preencha os detalhes para criar uma nova reunião"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Reunião de proposta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione detalhes sobre a reunião..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="time" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Término *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="time" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="leadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Relacionado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um lead (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participantIds"
              render={() => (
                <FormItem>
                  <FormLabel>Participantes *</FormLabel>
                  <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                    {users.map((user) => (
                      <FormField
                        key={user.id}
                        control={form.control}
                        name="participantIds"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, user.id])
                                    : field.onChange(field.value?.filter((id) => id !== user.id));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {user.name}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : meeting ? "Atualizar" : "Criar Reunião"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingDialog;
