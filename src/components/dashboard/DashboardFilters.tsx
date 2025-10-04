import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ChevronDown, Calendar, ArrowLeftRight } from "lucide-react";

interface DashboardFiltersProps {
  selectedMonth: string;
  selectedYear: string;
  compareMode: boolean;
  compareMonth: string;
  compareYear: string;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  onCompareModeChange: (enabled: boolean) => void;
  onCompareMonthChange: (month: string) => void;
  onCompareYearChange: (year: string) => void;
}

const DashboardFilters = ({
  selectedMonth,
  selectedYear,
  compareMode,
  compareMonth,
  compareYear,
  onMonthChange,
  onYearChange,
  onCompareModeChange,
  onCompareMonthChange,
  onCompareYearChange,
}: DashboardFiltersProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const months = [
    { value: "all", label: "Todos os Meses" },
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-lg border shadow-md">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Filtros de Período</h3>
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
          <div className="border-t p-4 space-y-4">
            {/* Filtros principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mês</label>
                <Select value={selectedMonth} onValueChange={onMonthChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ano</label>
                <Select value={selectedYear} onValueChange={onYearChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant={compareMode ? "default" : "outline"}
                  onClick={() => onCompareModeChange(!compareMode)}
                  className="w-full"
                >
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  {compareMode ? "Comparação Ativa" : "Ativar Comparação"}
                </Button>
              </div>
            </div>

            {/* Filtros de comparação */}
            {compareMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium mb-2 block text-accent">
                    Comparar com Mês
                  </label>
                  <Select value={compareMonth} onValueChange={onCompareMonthChange}>
                    <SelectTrigger className="border-accent/50">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.slice(1).map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-accent">
                    Comparar com Ano
                  </label>
                  <Select value={compareYear} onValueChange={onCompareYearChange}>
                    <SelectTrigger className="border-accent/50">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default DashboardFilters;
