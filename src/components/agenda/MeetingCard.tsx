import { format } from "date-fns";
import { Clock, Users, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import MeetingDetailDialog from "./MeetingDetailDialog";

interface MeetingCardProps {
  meeting: any;
  onRefetch: () => void;
}

const MeetingCard = ({ meeting, onRefetch }: MeetingCardProps) => {
  const [detailOpen, setDetailOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendada":
        return "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20";
      case "realizada":
        return "bg-green-500/10 border-green-500/20 hover:bg-green-500/20";
      case "cancelada":
        return "bg-red-500/10 border-red-500/20 hover:bg-red-500/20";
      default:
        return "bg-muted hover:bg-muted/80";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "agendada":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "realizada":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "cancelada":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      default:
        return "";
    }
  };

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={cn(
          "p-2 rounded-md border cursor-pointer transition-colors text-xs",
          getStatusColor(meeting.status)
        )}
      >
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="font-medium line-clamp-1">{meeting.title}</p>
          <Badge variant="secondary" className={cn("text-[10px] px-1 py-0", getStatusBadgeColor(meeting.status))}>
            {meeting.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground mb-1">
          <Clock className="h-3 w-3" />
          <span>
            {format(new Date(meeting.start_time), "HH:mm")} - {format(new Date(meeting.end_time), "HH:mm")}
          </span>
        </div>

        {meeting.lead && (
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <UserCircle className="h-3 w-3" />
            <span className="line-clamp-1">{meeting.lead.name}</span>
          </div>
        )}

        {meeting.meeting_participants && meeting.meeting_participants.length > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{meeting.meeting_participants.length} participante(s)</span>
          </div>
        )}
      </div>

      <MeetingDetailDialog
        meeting={meeting}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRefetch={onRefetch}
      />
    </>
  );
};

export default MeetingCard;
