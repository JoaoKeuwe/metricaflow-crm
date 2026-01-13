import { Building2, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProspectLead {
  id: string;
  nome: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  rating?: number;
  endereco?: string;
  website?: string;
  categoria?: string;
}

interface ProspectingStatsProps {
  leads: ProspectLead[];
}

export const ProspectingStats = ({ leads }: ProspectingStatsProps) => {
  const totalLeads = leads.length;
  const leadsComTelefone = leads.filter((l) => l.telefone).length;

  // Cidades únicas - filtra valores undefined/null/vazios
  const cidadesUnicas = new Set(
    leads.map((l) => l.cidade).filter((cidade) => cidade && cidade.trim())
  ).size;

  const stats = [
    {
      label: "Total de Leads",
      value: totalLeads,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Com Telefone",
      value: leadsComTelefone,
      icon: Phone,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Cidades",
      value: cidadesUnicas,
      icon: MapPin,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="premium-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor} shrink-0`}
              >
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold truncate">
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {stat.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
