import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Edit2 } from "lucide-react";

interface LeadTableRowProps {
  lead: any;
  canEditAssignment: boolean;
  users?: Array<{ id: string; name: string }>;
  onAssignmentChange: (leadId: string, assignedTo: string | null) => void;
  isUpdating: boolean;
  statusColors: Record<string, string>;
}

export const LeadTableRow = memo(({
  lead,
  canEditAssignment,
  users,
  onAssignmentChange,
  isUpdating,
  statusColors,
}: LeadTableRowProps) => {
  const navigate = useNavigate();
  const [showAssignmentSelect, setShowAssignmentSelect] = useState(false);

  return (
    <TableRow>
      <TableCell className="font-medium">{lead.name}</TableCell>
      <TableCell>{lead.email || "—"}</TableCell>
      <TableCell>{lead.phone || "—"}</TableCell>
      <TableCell>{lead.company || "—"}</TableCell>
      <TableCell>
        {canEditAssignment ? (
          showAssignmentSelect ? (
            <Select
              value={lead.assigned_to || "unassigned"}
              onValueChange={(value) => {
                const newAssignedTo = value === "unassigned" ? null : value;
                onAssignmentChange(lead.id, newAssignedTo);
                setShowAssignmentSelect(false);
              }}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Não atribuído" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Não atribuído</SelectItem>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <button
              onClick={() => setShowAssignmentSelect(true)}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <span>{lead.profiles?.name || "Não atribuído"}</span>
              <Edit2 className="h-3 w-3" />
            </button>
          )
        ) : (
          <span className="text-sm">{lead.profiles?.name || "Não atribuído"}</span>
        )}
      </TableCell>
      <TableCell>
        <Badge className={statusColors[lead.status]}>
          {lead.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/lead/${lead.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

LeadTableRow.displayName = "LeadTableRow";
