import { format, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import MeetingCard from "./MeetingCard";
import { DndContext, DragEndEvent, DragOverlay, useDroppable } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Clock } from "lucide-react";

interface CalendarGridProps {
  weekDays: Date[];
  meetings: any[];
  isLoading: boolean;
  onRefetch: () => void;
}

interface DroppableSlotProps {
  id: string;
  children: React.ReactNode;
  isOver?: boolean;
}

const DroppableSlot = ({ id, children }: DroppableSlotProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-1.5 border-l border-border/50 relative min-h-[80px] transition-colors",
        isOver && "bg-primary/10 ring-2 ring-primary ring-inset"
      )}
    >
      {children}
    </div>
  );
};

const CalendarGrid = ({ weekDays, meetings, isLoading, onRefetch }: CalendarGridProps) => {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8h às 20h
  const today = format(new Date(), "yyyy-MM-dd");
  const [activeMeeting, setActiveMeeting] = useState<any>(null);
  const [optimisticMeetings, setOptimisticMeetings] = useState<any[]>([]);

  const getMeetingsForDateTime = (date: Date, hour: number) => {
    const allMeetings = optimisticMeetings.length > 0 ? optimisticMeetings : meetings;
    return allMeetings.filter((meeting) => {
      const meetingDate = new Date(meeting.start_time);
      return (
        format(meetingDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
        meetingDate.getHours() === hour
      );
    });
  };

  const isToday = (date: Date) => {
    return format(date, "yyyy-MM-dd") === today;
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveMeeting(event.active.data.current?.meeting);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveMeeting(null);
    const { active, over } = event;

    if (!over) return;

    const meetingId = active.id as string;
    const dropId = over.id as string;
    
    // Parse drop location: "day-YYYY-MM-DD-hour-HH"
    const dayIndex = dropId.indexOf('day-');
    const hourIndex = dropId.indexOf('-hour-');
    
    if (dayIndex === -1 || hourIndex === -1) {
      console.error("Invalid drop ID format:", dropId);
      return;
    }
    
    const dateStr = dropId.substring(dayIndex + 4, hourIndex);
    const hourStr = dropId.substring(hourIndex + 6);
    
    const newDate = new Date(dateStr);
    const newHour = parseInt(hourStr);
    
    if (isNaN(newDate.getTime()) || isNaN(newHour)) {
      console.error("Invalid date or hour:", { dateStr, hourStr });
      return;
    }
    
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    // Calculate duration
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);
    const durationMs = endTime.getTime() - startTime.getTime();

    // Set new start time
    const newStartTime = setMinutes(setHours(newDate, newHour), 0);
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    // Optimistic update - atualiza imediatamente na UI
    const updatedMeeting = {
      ...meeting,
      start_time: newStartTime.toISOString(),
      end_time: newEndTime.toISOString(),
    };
    
    const newOptimisticMeetings = meetings.map(m => 
      m.id === meetingId ? updatedMeeting : m
    );
    setOptimisticMeetings(newOptimisticMeetings);

    // Salva no banco em background
    try {
      const { error } = await supabase
        .from("meetings")
        .update({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
        })
        .eq("id", meetingId);

      if (error) throw error;

      // Limpa otimistic update e atualiza dados reais
      setOptimisticMeetings([]);
      onRefetch();
    } catch (error) {
      console.error("Error updating meeting:", error);
      // Reverte otimistic update em caso de erro
      setOptimisticMeetings([]);
      toast({
        title: "Erro ao mover reunião",
        description: "Não foi possível mover a reunião. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
          {/* Header com dias da semana */}
          <div className="grid grid-cols-8 border-b border-border/50 bg-background">
            <div className="p-4 text-sm font-medium text-muted-foreground">Horário</div>
            {weekDays.map((day) => (
              <div key={day.toString()} className="p-4 text-center border-l border-border/50">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className={cn(
                  "text-2xl font-bold mt-1.5 inline-flex items-center justify-center",
                  isToday(day) && "w-10 h-10 rounded-full bg-[#1a73e8] text-white"
                )}>
                  {format(day, "dd", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>

          {/* Grid de horários */}
          <div className="divide-y divide-border/50">
            {hours.map((hour, index) => (
              <div 
                key={hour} 
                className={cn(
                  "grid grid-cols-8 min-h-[80px]",
                  index % 2 === 0 && "bg-muted/20"
                )}
              >
                <div className="p-3 text-xs text-muted-foreground font-medium border-r border-border/50">
                  {hour}:00
                </div>
                {weekDays.map((day) => {
                  const dayMeetings = getMeetingsForDateTime(day, hour);
                  const dropId = `day-${format(day, "yyyy-MM-dd")}-hour-${hour}`;
                  return (
                    <DroppableSlot key={dropId} id={dropId}>
                      <div className="space-y-1">
                        {dayMeetings.map((meeting) => (
                          <MeetingCard
                            key={meeting.id}
                            meeting={meeting}
                            onRefetch={onRefetch}
                          />
                        ))}
                      </div>
                    </DroppableSlot>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        </div>
      </Card>

      <DragOverlay>
        {activeMeeting ? (
          <div className="p-2.5 rounded-md border border-l-4 text-xs bg-background shadow-lg opacity-90">
            <p className="font-semibold">{activeMeeting.title}</p>
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(activeMeeting.start_time), "HH:mm")} - {format(new Date(activeMeeting.end_time), "HH:mm")}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default CalendarGrid;
