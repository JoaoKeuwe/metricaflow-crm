import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🧹 Iniciando limpeza de dados antigos...");

    // 1. Limpar tarefas concluídas há mais de 30 dias
    const taskCutoffDate = new Date();
    taskCutoffDate.setDate(taskCutoffDate.getDate() - 30);

    const { data: deletedTasks, error: taskError } = await supabase
      .from("tasks")
      .delete()
      .eq("status", "concluida")
      .lt("created_at", taskCutoffDate.toISOString())
      .select("id");

    if (taskError) {
      console.error("❌ Erro ao limpar tarefas:", taskError);
      throw taskError;
    }

    const taskCount = deletedTasks?.length || 0;
    console.log(`✅ ${taskCount} tarefas concluídas removidas (>30 dias)`);

    // 2. Limpar tarefas abertas/em andamento muito antigas (>90 dias)
    const oldTaskCutoffDate = new Date();
    oldTaskCutoffDate.setDate(oldTaskCutoffDate.getDate() - 90);

    const { data: deletedOldTasks, error: oldTaskError } = await supabase
      .from("tasks")
      .delete()
      .in("status", ["aberta", "em_andamento"])
      .lt("created_at", oldTaskCutoffDate.toISOString())
      .select("id");

    if (oldTaskError) {
      console.error("❌ Erro ao limpar tarefas antigas:", oldTaskError);
      throw oldTaskError;
    }

    const oldTaskCount = deletedOldTasks?.length || 0;
    console.log(`✅ ${oldTaskCount} tarefas não concluídas muito antigas removidas (>90 dias)`);

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      cleaned: {
        completedTasks: taskCount,
        oldTasks: oldTaskCount,
        total: taskCount + oldTaskCount,
      },
      message: "Limpeza de dados antigos concluída com sucesso",
    };

    console.log("🎉 Limpeza concluída:", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Erro na limpeza de dados:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
