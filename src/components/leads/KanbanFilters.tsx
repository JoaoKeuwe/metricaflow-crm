import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KanbanFiltersProps {
  activeOnly: boolean;
  onActiveOnlyChange: (value: boolean) => void;
  periodFilter: string;
  onPeriodFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  totalLeads: number;
  visibleLeads: number;
}

export const KanbanFilters = ({
  activeOnly,
  onActiveOnlyChange,
  periodFilter,
  onPeriodFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
  totalLeads,
  visibleLeads,
}: KanbanFiltersProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex items-center space-x-2">
            <Switch
              id="active-only"
              checked={activeOnly}
              onCheckedChange={onActiveOnlyChange}
            />
            <Label htmlFor="active-only" className="cursor-pointer">
              Apenas atendimento ativo
            </Label>
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Nome, email, telefone ou empresa..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>

          <div className="w-full md:w-48 space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
              <SelectTrigger id="period">
                <SelectValue placeholder="Todos os períodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="current">Este mês (&lt; 30d)</SelectItem>
                <SelectItem value="previous">Mês anterior (31-60d)</SelectItem>
                <SelectItem value="old">Antigos (&gt; 60d)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48 space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contato_feito">Contato Feito</SelectItem>
                <SelectItem value="proposta">Proposta</SelectItem>
                <SelectItem value="negociacao">Negociação</SelectItem>
                <SelectItem value="ganho">Ganho</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {visibleLeads} de {totalLeads} leads
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
