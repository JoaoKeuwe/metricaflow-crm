import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReminderFiltersProps {
  filters: {
    status: string;
    leadId: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export function ReminderFilters({ filters, onFilterChange }: ReminderFiltersProps) {
  const { data: leads } = useQuery({
    queryKey: ["leads-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex gap-4 flex-wrap">
      <div className="space-y-2 min-w-[200px]">
        <Label>Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="overdue">Vencidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 min-w-[200px]">
        <Label>Lead</Label>
        <Select
          value={filters.leadId}
          onValueChange={(value) => onFilterChange("leadId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os leads" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os leads</SelectItem>
            <SelectItem value="none">Sem lead</SelectItem>
            {leads?.map((lead) => (
              <SelectItem key={lead.id} value={lead.id}>
                {lead.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
