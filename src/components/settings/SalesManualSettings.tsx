import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Target, CheckSquare, FileText } from "lucide-react";
import { StageGuideEditor } from "./StageGuideEditor";
import { CriteriaEditor } from "./CriteriaEditor";
import { ScriptEditor } from "./ScriptEditor";
import { 
  useStages, 
  useStageGuides, 
  useAdvancementCriteria, 
  useStageScripts 
} from "@/hooks/useSalesManual";

export const SalesManualSettings = () => {
  const stages = useStages();
  const [selectedStage, setSelectedStage] = useState(stages[0].id);
  const [activeTab, setActiveTab] = useState("guide");

  // Get company ID
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      
      return data;
    },
  });

  const companyId = profile?.company_id;

  // Fetch data
  const { data: guides, isLoading: guidesLoading } = useStageGuides(companyId || null);
  const { data: criteria, isLoading: criteriaLoading } = useAdvancementCriteria(companyId || null, null);
  const { data: scripts, isLoading: scriptsLoading } = useStageScripts(companyId || null, null);

  const currentGuide = guides?.find(g => g.stage_id === selectedStage) || null;
  const currentStageName = stages.find(s => s.id === selectedStage)?.name || selectedStage;

  const isLoading = profileLoading || guidesLoading || criteriaLoading || scriptsLoading;

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Erro ao carregar configurações. Tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Manual Vivo do Vendedor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize o manual de vendas da sua equipe por etapa do pipeline
          </p>
        </div>
      </div>

      {/* Stage Selector */}
      <div className="flex items-center gap-4">
        <Label htmlFor="stage-select" className="whitespace-nowrap">Etapa do Pipeline:</Label>
        <Select value={selectedStage} onValueChange={setSelectedStage}>
          <SelectTrigger id="stage-select" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Guia da Etapa</span>
            <span className="sm:hidden">Guia</span>
          </TabsTrigger>
          <TabsTrigger value="criteria" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Critérios de Avanço</span>
            <span className="sm:hidden">Critérios</span>
          </TabsTrigger>
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Scripts Prontos</span>
            <span className="sm:hidden">Scripts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <StageGuideEditor
              guide={currentGuide}
              stageId={selectedStage}
              stageName={currentStageName}
              companyId={companyId}
            />
          )}
        </TabsContent>

        <TabsContent value="criteria" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <CriteriaEditor
              criteria={criteria || []}
              stageId={selectedStage}
              companyId={companyId}
            />
          )}
        </TabsContent>

        <TabsContent value="scripts" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ScriptEditor
              scripts={scripts || []}
              stageId={selectedStage}
              companyId={companyId}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
