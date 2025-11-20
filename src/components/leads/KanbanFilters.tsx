import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface KanbanFiltersProps {
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  totalLeads: number;
  visibleLeads: number;
}

export const KanbanFilters = ({
  selectedMonth,
  onMonthChange,
  searchTerm,
  onSearchTermChange,
  totalLeads,
  visibleLeads,
}: KanbanFiltersProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const currentDate = new Date(selectedMonth + '-01');
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onMonthChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      setIsCalendarOpen(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex flex-col gap-2">
            <Label>Mês de Atendimento</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[200px] justify-start text-left font-normal",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="search">Buscar no Kanban</Label>
            <Input
              id="search"
              placeholder="Nome, email, telefone ou empresa..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">
              {visibleLeads} de {totalLeads} leads
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
