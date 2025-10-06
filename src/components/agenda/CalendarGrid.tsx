import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MeetingCard from "./MeetingCard";

interface CalendarGridProps {
  weekDays: Date[];
  meetings: any[];
  isLoading: boolean;
  onRefetch: () => void;
}

const CalendarGrid = ({ weekDays, meetings, isLoading, onRefetch }: CalendarGridProps) => {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8h às 20h

  const getMeetingsForDateTime = (date: Date, hour: number) => {
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.start_time);
      return (
        format(meetingDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
        meetingDate.getHours() === hour
      );
    });
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
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header com dias da semana */}
          <div className="grid grid-cols-8 border-b bg-muted/50">
            <div className="p-4 text-sm font-medium text-muted-foreground">Horário</div>
            {weekDays.map((day) => (
              <div key={day.toString()} className="p-4 text-center border-l">
                <div className="text-sm font-medium">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className="text-2xl font-bold mt-1">
                  {format(day, "dd", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>

          {/* Grid de horários */}
          <div className="divide-y">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[80px]">
                <div className="p-4 text-sm text-muted-foreground font-medium border-r">
                  {hour}:00
                </div>
                {weekDays.map((day) => {
                  const dayMeetings = getMeetingsForDateTime(day, hour);
                  return (
                    <div key={`${day}-${hour}`} className="p-2 border-l relative">
                      <div className="space-y-1">
                        {dayMeetings.map((meeting) => (
                          <MeetingCard
                            key={meeting.id}
                            meeting={meeting}
                            onRefetch={onRefetch}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CalendarGrid;
