import {
  Building2,
  Phone,
  MapPin,
  Star,
  Globe,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface ProspectingCardProps {
  lead: ProspectLead;
  className?: string;
}

export const ProspectingCard = ({ lead, className }: ProspectingCardProps) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-500";
    if (rating >= 4.0) return "text-yellow-500";
    if (rating >= 3.0) return "text-orange-500";
    return "text-red-500";
  };

  const formatPhone = (phone: string) => {
    // Formata o telefone para exibição
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  return (
    <Card
      className={cn(
        "premium-card group hover:border-primary/30 transition-all duration-300",
        className
      )}
    >
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3
                className="font-semibold text-foreground truncate text-sm sm:text-base"
                title={lead.nome}
              >
                {lead.nome}
              </h3>
              {lead.categoria && (
                <Badge
                  variant="outline"
                  className="mt-1 text-[10px] sm:text-xs"
                >
                  {lead.categoria}
                </Badge>
              )}
            </div>
          </div>

          {lead.rating && (
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <Star
                className={cn(
                  "h-3 w-3 sm:h-4 sm:w-4 fill-current",
                  getRatingColor(lead.rating)
                )}
              />
              <span
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  getRatingColor(lead.rating)
                )}
              >
                {lead.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Informações de Contato */}
        <div className="space-y-1.5 sm:space-y-2">
          {lead.telefone && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              <span className="text-foreground font-medium truncate">
                {lead.telefone}
              </span>
            </div>
          )}

          {(lead.cidade || lead.estado) && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">
                {[lead.cidade, lead.estado].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          {lead.endereco && (
            <div className="hidden sm:flex items-start gap-2 text-xs sm:text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground text-[10px] sm:text-xs line-clamp-1">
                {lead.endereco}
              </span>
            </div>
          )}

          {lead.website && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              <a
                href={
                  lead.website.startsWith("http")
                    ? lead.website
                    : `https://${lead.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate text-[10px] sm:text-xs"
              >
                {lead.website}
              </a>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-[10px] sm:text-xs h-8 sm:h-9"
            onClick={() => {
              if (lead.telefone) {
                window.open(
                  `https://wa.me/55${lead.telefone.replace(/\D/g, "")}`,
                  "_blank"
                );
              }
            }}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            <span className="hidden xs:inline">WhatsApp</span>
            <span className="xs:hidden">Zap</span>
          </Button>
          {lead.website && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3"
              onClick={() => {
                window.open(
                  lead.website?.startsWith("http")
                    ? lead.website
                    : `https://${lead.website}`,
                  "_blank"
                );
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Site
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
