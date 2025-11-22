import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { mapGenericError } from '../_shared/error-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LeadAnalysisSchema = z.object({
  lead: z.object({
    nome: z.string().min(1, 'Nome do lead é obrigatório'),
    telefone: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    site: z.string().optional(),
    notas: z.string().optional(),
    status: z.string().optional(),
  }),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawPayload = await req.json();
    const validationResult = LeadAnalysisSchema.safeParse(rawPayload);
    
    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors[0].message;
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorMsg,
          details: validationResult.error.flatten().fieldErrors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lead } = validationResult.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir contexto do lead
    const leadContext = `
Nome: ${lead.nome}
Telefone: ${lead.telefone || 'Não informado'}
Cidade: ${lead.cidade || 'Não informada'}
Estado: ${lead.estado || 'Não informado'}
Site: ${lead.site || 'Não informado'}
Notas/Fonte: ${lead.notas || 'Sem informações'}
Status Atual: ${lead.status || 'novo'}
    `.trim();

    const prompt = `Você é um especialista em análise de leads para vendas B2B e B2C. Analise este lead e forneça insights acionáveis:

${leadContext}

Gere uma análise estruturada em JSON com:

1. **qualityScore** (0-100): Score de qualidade baseado em:
   - Completude dos dados (telefone válido, localização, site)
   - Relevância da fonte (Google Places > LinkedIn > Instagram)
   - Potencial de conversão estimado

2. **approachSuggestions** (array de 3 strings): Sugestões ESPECÍFICAS de abordagem:
   - Primeira frase para quebrar o gelo
   - Argumento de valor baseado no contexto
   - Call-to-action recomendada

3. **bestContactTime**: Melhor horário para contato (ex: "Terça 14h-16h") baseado no tipo de negócio

4. **probableObjections** (array de 2-3 strings): Objeções prováveis e como contorná-las

5. **insights**: Observações adicionais sobre o lead (oportunidades, riscos, contexto)

Retorne APENAS o JSON, sem markdown ou texto extra.`;

    console.log('Chamando Lovable AI para analisar lead:', lead.nome);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um analista de leads expert. Retorne SEMPRE em JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro da Lovable AI:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta da IA vazia');
    }

    // Extrair JSON da resposta (remover markdown se houver)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(jsonStr);

    console.log('Análise gerada com sucesso:', analysis.qualityScore);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          qualityScore: analysis.qualityScore || 50,
          approachSuggestions: analysis.approachSuggestions || [],
          bestContactTime: analysis.bestContactTime || 'Horário comercial',
          probableObjections: analysis.probableObjections || [],
          insights: analysis.insights || 'Análise indisponível',
          analyzedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao analisar lead:', error);
    const errorResponse = mapGenericError(error);
    return new Response(
      JSON.stringify({ ...errorResponse, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
