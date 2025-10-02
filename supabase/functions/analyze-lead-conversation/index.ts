import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId } = await req.json();
    
    if (!leadId) {
      throw new Error("leadId é obrigatório");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Buscar dados do lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*, profiles(name)")
      .eq("id", leadId)
      .single();

    if (leadError) throw leadError;

    // Buscar notas do lead
    const { data: notes, error: notesError } = await supabase
      .from("lead_observations")
      .select(`
        *,
        profiles:user_id (name)
      `)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });

    if (notesError) throw notesError;

    // Montar contexto para IA
    const conversationContext = notes?.map(note => 
      `[${new Date(note.created_at).toLocaleString('pt-BR')}] ${note.profiles?.name} (${note.note_type}): ${note.content}`
    ).join('\n\n') || "Nenhuma nota disponível";

    const statusMap: Record<string, string> = {
      novo: "Novo",
      contato_feito: "Contato Feito",
      proposta: "Proposta Enviada",
      negociacao: "Em Negociação",
      ganho: "Ganho",
      perdido: "Perdido"
    };

    const prompt = `Você é um especialista em análise de CRM e gestão de relacionamento com clientes. Analise a seguinte conversa de vendas:

**Informações do Lead:**
- Nome: ${lead.name}
- Empresa: ${lead.company || "Não informado"}
- Email: ${lead.email || "Não informado"}
- Telefone: ${lead.phone || "Não informado"}
- Status Atual: ${statusMap[lead.status] || lead.status}
- Origem: ${lead.source || "Não informado"}
- Valor Estimado: ${lead.estimated_value ? `R$ ${Number(lead.estimated_value).toLocaleString('pt-BR')}` : "Não informado"}
- Vendedor Responsável: ${lead.profiles?.name || "Não atribuído"}

**Histórico de Interações:**
${conversationContext}

Com base nessas informações, forneça uma análise detalhada e estruturada sobre:

1. **Resumo do Atendimento** (2-3 frases)
   - Resumo objetivo da situação atual

2. **Pontos Positivos**
   - Liste 3-4 aspectos positivos do atendimento
   - Destaque o que está sendo bem feito

3. **Pontos de Atenção**
   - Liste 3-4 aspectos que precisam de atenção
   - Identifique possíveis problemas ou riscos

4. **Recomendações de Melhoria**
   - 4-5 ações concretas e específicas para melhorar o atendimento
   - Priorize ações de maior impacto

5. **Próximos Passos Sugeridos**
   - 3-4 ações imediatas recomendadas
   - Seja específico e prático

6. **Análise de Temperatura do Lead**
   - Classifique como: Quente, Morno ou Frio
   - Justifique brevemente

Seja objetivo, prático e focado em ações concretas. Use uma linguagem profissional mas acessível.`;

    console.log("Enviando prompt para IA:", prompt);

    // Chamar Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise de CRM e gestão comercial. Forneça análises detalhadas, objetivas e acionáveis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da IA:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns instantes.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes. Adicione créditos na sua workspace.");
      }
      throw new Error("Erro ao gerar análise");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error("Resposta da IA vazia");
    }

    console.log("Análise gerada com sucesso");

    return new Response(
      JSON.stringify({ 
        analysis,
        lead: {
          name: lead.name,
          status: lead.status,
          company: lead.company,
          notesCount: notes?.length || 0
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
