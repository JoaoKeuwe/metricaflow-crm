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
  viewMode?: "week" | "workweek" | "month";
  onDayClick?: (date: Date) => void;
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
        "border-r border-border relative h-full transition-colors hover:bg-muted/30",
        isOver && "bg-primary/10"
      )}
    >
      {children}
    </div>
  );
};

const CalendarGrid = ({ weekDays, meetings, isLoading, onRefetch, viewMode = "week", onDayClick }: CalendarGridProps) => {
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0h às 23h
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
      <div className="p-8">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (viewMode === "month") {
    // Vista mensal completa estilo Google Calendar
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    weekDays.forEach((day, index) => {
      currentWeek.push(day);
      if ((index + 1) % 7 === 0 || index === weekDays.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return (
      <div className="h-full flex flex-col">
        {/* Header com dias da semana */}
        <div className="grid grid-cols-7 border-b border-border bg-background sticky top-0 z-10">
          {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((day) => (
            <div key={day} className="text-center py-2 border-r border-border last:border-r-0">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {day}
              </div>
            </div>
          ))}
        </div>

        {/* Grid do mês */}
        <div className="flex-1 grid grid-rows-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-border" style={{ minHeight: '120px' }}>
              {week.map((day) => {
                const dayMeetings = meetings.filter((meeting) => {
                  const meetingDate = new Date(meeting.start_time);
                  return format(meetingDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
                });
                
                return (
                  <div 
                    key={day.toString()} 
                    className={cn(
                      "border-r border-border last:border-r-0 p-2 overflow-y-auto cursor-pointer",
                      "hover:bg-muted/30 transition-colors"
                    )}
                    onClick={() => onDayClick?.(day)}
                  >
                    <div className={cn(
                      "text-sm mb-1 font-medium",
                      isToday(day) 
                        ? "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs" 
                        : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayMeetings.slice(0, 3).map((meeting) => (
                        <MeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          onRefetch={onRefetch}
                          compact
                        />
                      ))}
                      {dayMeetings.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayMeetings.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vista semanal com horários
  const gridCols = weekDays.length === 5 ? "grid-cols-6" : "grid-cols-8";

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-w-full">
        {/* Header com dias da semana - fixo no topo */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className={cn("grid", gridCols)}>
            <div className="w-12 border-r border-border" /> {/* Coluna de horários */}
            {weekDays.map((day) => (
              <div key={day.toString()} className="text-center py-2 border-r border-border last:border-r-0">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className={cn(
                  "text-2xl font-normal mt-1 inline-flex items-center justify-center",
                  isToday(day) 
                    ? "w-12 h-12 rounded-full bg-primary text-primary-foreground" 
                    : "text-foreground"
                )}>
                  {format(day, "dd")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid de horários */}
        <div className="relative">
          {hours.map((hour) => (
            <div 
              key={hour} 
              className={cn("grid", gridCols, "border-b border-border")}
              style={{ minHeight: '60px' }}
            >
              <div className="w-12 text-right pr-1 pt-1 text-xs text-muted-foreground border-r border-border">
                {hour}:00
              </div>
              {weekDays.map((day) => {
                const dayMeetings = getMeetingsForDateTime(day, hour);
                const dropId = `day-${format(day, "yyyy-MM-dd")}-hour-${hour}`;
                return (
                  <DroppableSlot key={dropId} id={dropId}>
                    <div 
                      className="space-y-1 p-1 h-full cursor-pointer"
                      onClick={() => {
                        if (dayMeetings.length === 0 && onDayClick) {
                          const clickedDate = new Date(day);
                          clickedDate.setHours(hour, 0, 0, 0);
                          onDayClick(clickedDate);
                        }
                      }}
                    >
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

      <DragOverlay>
        {activeMeeting ? (
          <div className="p-3 rounded-lg border-l-4 border-primary bg-background shadow-2xl opacity-95 min-w-[200px]">
            <p className="font-bold text-sm mb-2">{activeMeeting.title}</p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
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
