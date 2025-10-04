import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";

interface LeadFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  responsibleFilter: string;
  onResponsibleChange: (value: string) => void;
  users?: Array<{ id: string; name: string }>;
  canFilterByResponsible: boolean;
}

export const LeadFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  responsibleFilter,
  onResponsibleChange,
  users,
  canFilterByResponsible,
}: LeadFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-lg border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="border-t p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca */}
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome, email, telefone, empresa..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Filtro por Status */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger id="status-filter">
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

              {/* Filtro por Responsável (apenas para gestores) */}
              {canFilterByResponsible && (
                <div className="space-y-2">
                  <Label htmlFor="responsible-filter">Responsável</Label>
                  <Select value={responsibleFilter} onValueChange={onResponsibleChange}>
                    <SelectTrigger id="responsible-filter">
                      <SelectValue placeholder="Todos os responsáveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os responsáveis</SelectItem>
                      <SelectItem value="unassigned">Não atribuído</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
