import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface StageGuide {
  id: string;
  stage_id: string;
  stage_name: string;
  objective: string;
  mindset: string | null;
  what_to_say: string | null;
  mental_triggers: string[] | null;
  common_mistakes: string[] | null;
  ideal_time_days: number | null;
  how_to_advance: string | null;
  how_not_to_advance: string | null;
  is_default: boolean;
  company_id: string | null;
  order_index: number | null;
}

export interface AdvancementCriteria {
  id: string;
  stage_id: string;
  description: string;
  check_type: string;
  mandatory: boolean;
  blocking: boolean;
  is_default: boolean;
  company_id: string | null;
  order_index: number | null;
}

export interface StageScript {
  id: string;
  stage_id: string;
  title: string;
  situation: string | null;
  script_content: string;
  tags: string[] | null;
  is_active: boolean;
  is_default: boolean;
  company_id: string | null;
  order_index: number | null;
}

const STAGES = [
  { id: "novo", name: "Novo" },
  { id: "contato_feito", name: "Contato Feito" },
  { id: "qualificado", name: "Qualificado" },
  { id: "proposta", name: "Proposta" },
  { id: "negociacao", name: "Negociação" },
  { id: "fechado", name: "Fechado" },
  { id: "perdido", name: "Perdido" },
];

export const useStages = () => STAGES;

export const useStageGuides = (companyId: string | null) => {
  return useQuery({
    queryKey: ["stage-guides", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stage_guides")
        .select("*")
        .or(`company_id.eq.${companyId},is_default.eq.true`)
        .order("order_index");

      if (error) throw error;

      // Merge: prioritize company-specific, fallback to default
      const guidesByStage = new Map<string, StageGuide>();
      
      // First add defaults
      data?.filter(g => g.is_default).forEach(guide => {
        guidesByStage.set(guide.stage_id, {
          ...guide,
          mental_triggers: parseJsonArray(guide.mental_triggers),
          common_mistakes: parseJsonArray(guide.common_mistakes),
        } as StageGuide);
      });
      
      // Override with company-specific
      data?.filter(g => !g.is_default && g.company_id === companyId).forEach(guide => {
        guidesByStage.set(guide.stage_id, {
          ...guide,
          mental_triggers: parseJsonArray(guide.mental_triggers),
          common_mistakes: parseJsonArray(guide.common_mistakes),
        } as StageGuide);
      });

      return Array.from(guidesByStage.values());
    },
    enabled: !!companyId,
  });
};

export const useAdvancementCriteria = (companyId: string | null, stageId: string | null) => {
  return useQuery({
    queryKey: ["advancement-criteria", companyId, stageId],
    queryFn: async () => {
      let query = supabase
        .from("stage_advancement_criteria")
        .select("*")
        .or(`company_id.eq.${companyId},is_default.eq.true`)
        .order("order_index");

      if (stageId) {
        query = query.eq("stage_id", stageId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Merge: prioritize company-specific
      const criteriaMap = new Map<string, AdvancementCriteria>();
      
      data?.filter(c => c.is_default).forEach(criteria => {
        criteriaMap.set(criteria.id, criteria as AdvancementCriteria);
      });
      
      data?.filter(c => !c.is_default && c.company_id === companyId).forEach(criteria => {
        // For company criteria, use their own ID
        criteriaMap.set(criteria.id, criteria as AdvancementCriteria);
      });

      return Array.from(criteriaMap.values());
    },
    enabled: !!companyId,
  });
};

export const useStageScripts = (companyId: string | null, stageId: string | null) => {
  return useQuery({
    queryKey: ["stage-scripts", companyId, stageId],
    queryFn: async () => {
      let query = supabase
        .from("stage_scripts")
        .select("*")
        .or(`company_id.eq.${companyId},is_default.eq.true`)
        .order("order_index");

      if (stageId) {
        query = query.eq("stage_id", stageId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(script => ({
        ...script,
        tags: parseJsonArray(script.tags),
      })) as StageScript[];
    },
    enabled: !!companyId,
  });
};

// Mutations
export const useUpdateStageGuide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guide, companyId }: { guide: Partial<StageGuide> & { stage_id: string }; companyId: string }) => {
      // Check if company-specific guide exists
      const { data: existing } = await supabase
        .from("pipeline_stage_guides")
        .select("id")
        .eq("stage_id", guide.stage_id)
        .eq("company_id", companyId)
        .maybeSingle();

      const guideData = {
        stage_id: guide.stage_id,
        stage_name: guide.stage_name || STAGES.find(s => s.id === guide.stage_id)?.name || guide.stage_id,
        objective: guide.objective || "",
        mindset: guide.mindset,
        what_to_say: guide.what_to_say,
        mental_triggers: guide.mental_triggers as unknown as Json,
        common_mistakes: guide.common_mistakes as unknown as Json,
        ideal_time_days: guide.ideal_time_days,
        how_to_advance: guide.how_to_advance,
        how_not_to_advance: guide.how_not_to_advance,
        company_id: companyId,
        is_default: false,
        order_index: guide.order_index || 0,
      };

      if (existing) {
        const { error } = await supabase
          .from("pipeline_stage_guides")
          .update(guideData)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pipeline_stage_guides")
          .insert(guideData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stage-guides"] });
      toast.success("Guia salvo com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar guia: " + error.message);
    },
  });
};

export const useCreateCriteria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ criteria, companyId }: { criteria: Partial<AdvancementCriteria>; companyId: string }) => {
      const { error } = await supabase
        .from("stage_advancement_criteria")
        .insert({
          stage_id: criteria.stage_id!,
          description: criteria.description!,
          check_type: criteria.check_type || "manual",
          mandatory: criteria.mandatory || false,
          blocking: criteria.blocking || false,
          company_id: companyId,
          is_default: false,
          order_index: criteria.order_index || 0,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advancement-criteria"] });
      toast.success("Critério criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar critério: " + error.message);
    },
  });
};

export const useUpdateCriteria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, criteria }: { id: string; criteria: Partial<AdvancementCriteria> }) => {
      const { error } = await supabase
        .from("stage_advancement_criteria")
        .update({
          description: criteria.description,
          check_type: criteria.check_type,
          mandatory: criteria.mandatory,
          blocking: criteria.blocking,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advancement-criteria"] });
      toast.success("Critério atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar critério: " + error.message);
    },
  });
};

export const useDeleteCriteria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("stage_advancement_criteria")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advancement-criteria"] });
      toast.success("Critério removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover critério: " + error.message);
    },
  });
};

export const useCreateScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ script, companyId }: { script: Partial<StageScript>; companyId: string }) => {
      const { error } = await supabase
        .from("stage_scripts")
        .insert({
          stage_id: script.stage_id!,
          title: script.title!,
          situation: script.situation,
          script_content: script.script_content!,
          tags: script.tags as unknown as Json,
          is_active: script.is_active ?? true,
          company_id: companyId,
          is_default: false,
          order_index: script.order_index || 0,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stage-scripts"] });
      toast.success("Script criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar script: " + error.message);
    },
  });
};

export const useUpdateScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, script }: { id: string; script: Partial<StageScript> }) => {
      const { error } = await supabase
        .from("stage_scripts")
        .update({
          title: script.title,
          situation: script.situation,
          script_content: script.script_content,
          tags: script.tags as unknown as Json,
          is_active: script.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stage-scripts"] });
      toast.success("Script atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar script: " + error.message);
    },
  });
};

export const useDeleteScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("stage_scripts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stage-scripts"] });
      toast.success("Script removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover script: " + error.message);
    },
  });
};

// Helper function
function parseJsonArray(json: Json | null): string[] | null {
  if (!json) return null;
  if (Array.isArray(json)) return json as string[];
  return null;
}
