import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, getClientIP } from "../_shared/rate-limit.ts";
import { mapGenericError } from "../_shared/error-mapping.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchResult {
  nome: string;
  telefone: string;
  cidade: string;
  estado: string;
  source: string;
  link?: string;
  snippet?: string;
  website?: string;
}

// Regex mais abrangente para telefones brasileiros
function extractPhoneBR(text: string): string | null {
  const phoneRegex = /(\+?55\s?)?(\(?\d{2}\)?[\s.\-]?)?\d{4,5}[\s.\-]?\d{4}/g;
  const match = text.match(phoneRegex);
  if (!match) return null;
  // Normaliza: remove espaços, pontos, hífens
  return match[0].replace(/[\s.\-()]/g, "");
}

const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Query é obrigatória').max(500, 'Query muito longa'),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Validate JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('Missing Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's JWT to validate it
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.warn('Invalid JWT token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: 10 requests per minute per user
    const rateLimit = await checkRateLimit(supabase, user.id, {
      maxRequests: 10,
      windowSeconds: 60,
      endpoint: 'search-leads'
    });

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Limite de requisições excedido. Tente novamente mais tarde.',
          retryAfter: rateLimit.retryAfter
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter || 60)
          }
        }
      );
    }

    const rawPayload = await req.json();
    const validationResult = SearchQuerySchema.safeParse(rawPayload);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors[0].message;
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query } = validationResult.data;
    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");

    if (!SERPER_API_KEY) {
      throw new Error("SERPER_API_KEY não configurada");
    }

    // Log masked key prefix for debugging
    const keyPrefix = SERPER_API_KEY.substring(0, 4);
    const keySuffix = SERPER_API_KEY.substring(SERPER_API_KEY.length - 4);
    console.log(`SERPER_API_KEY: ${keyPrefix}...${keySuffix}`);

    // Test Serper API key with a simple ping
    console.log("Testando chave do Serper...");
    try {
      const pingResponse = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: "test", num: 1 }),
      });

      if (pingResponse.status === 403) {
        const errorText = await pingResponse.text();
        console.error("Chave do Serper inválida ou sem permissão:", errorText);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Chave do Serper inválida, expirada ou sem créditos. Status: 403 Unauthorized",
            details: errorText,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!pingResponse.ok) {
        const errorText = await pingResponse.text();
        console.warn("Ping do Serper retornou erro:", pingResponse.status, errorText);
      } else {
        console.log("Chave do Serper OK");
      }
    } catch (pingError) {
      console.error("Erro ao testar chave do Serper:", pingError);
    }

    console.log("Buscando leads para:", query);

    const errors: Record<string, string> = {};

    const results: SearchResult[] = [];
    const cityMatch = query.match(/([\w\s]+)(?:\s*-?\s*[A-Z]{2})?$/i);
    const cidade = cityMatch ? cityMatch[1].trim() : "";

    // 1) Busca no Google Places (melhor para estabelecimentos)
    try {
      console.log("Buscando no Google Places...");
      const placesResponse = await fetch("https://google.serper.dev/places", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: query,
          num: 10,
          gl: "br",
        }),
      });

      if (placesResponse.ok) {
        const placesData = await placesResponse.json();
        console.log("Resultados Google Places:", placesData.places?.length || 0);

        for (const place of placesData.places || []) {
          const phone = place.phoneNumber ? place.phoneNumber.replace(/[\s.\-()]/g, "") : "";
          
          results.push({
            nome: place.title || "Estabelecimento",
            telefone: phone,
            cidade: place.address || cidade,
            estado: "",
            source: "Google Places",
            link: place.cid ? `https://www.google.com/maps?cid=${place.cid}` : "",
            website: place.website || "",
            snippet: place.address || "",
          });
        }
      } else {
        const errorText = await placesResponse.text();
        console.error("Erro Google Places (status:", placesResponse.status, "):", errorText);
        errors["Google Places"] = `Status ${placesResponse.status}: ${errorText}`;
      }
    } catch (error) {
      console.error("Erro ao buscar no Google Places:", error);
    }

    // 2) Buscas no Google Search (múltiplas variações)
    const searchQueries = [
      `${query} telefone whatsapp`,
      `${query} contato +55`,
      `${query} contato telefone`,
    ];

    for (const searchQuery of searchQueries) {
      try {
        console.log("Buscando no Google:", searchQuery);
        const googleResponse = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: searchQuery,
            num: 5,
          }),
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          console.log(`Resultados Google Search (${searchQuery}):`, googleData.organic?.length || 0);

          for (const item of googleData.organic || []) {
            const fullText = `${item.title} ${item.snippet || ""}`;
            const phone = extractPhoneBR(fullText);

            if (phone) {
              results.push({
                nome: item.title,
                telefone: phone,
                cidade: cidade,
                estado: "",
                source: "Google",
                link: item.link,
                website: item.link,
                snippet: item.snippet?.substring(0, 200),
              });
            }
          }
        } else {
          const errorText = await googleResponse.text();
          console.error("Erro Google Search (status:", googleResponse.status, "):", errorText);
          errors[`Google Search (${searchQuery})`] = `Status ${googleResponse.status}: ${errorText}`;
        }
      } catch (error) {
        console.error("Erro ao buscar no Google:", error);
      }
    }

    // 3) Busca no LinkedIn (usando Google site:linkedin.com)
    try {
      const linkedinQuery = `site:linkedin.com ${query}`;
      console.log("Buscando no LinkedIn...");
      const linkedinResponse = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: linkedinQuery,
          num: 5,
        }),
      });

      if (linkedinResponse.ok) {
        const linkedinData = await linkedinResponse.json();
        console.log("Resultados LinkedIn:", linkedinData.organic?.length || 0);

        for (const item of linkedinData.organic || []) {
          const nameMatch = item.title?.match(/^([^-|]+)/);
          
          results.push({
            nome: nameMatch ? nameMatch[1].trim() : item.title,
            telefone: "",
            cidade: cidade,
            estado: "",
            source: "LinkedIn",
            link: item.link,
            website: item.link,
            snippet: item.snippet?.substring(0, 200),
          });
        }
      } else {
        const errorText = await linkedinResponse.text();
        console.error("Erro LinkedIn (status:", linkedinResponse.status, "):", errorText);
        errors["LinkedIn"] = `Status ${linkedinResponse.status}: ${errorText}`;
      }
    } catch (error) {
      console.error("Erro ao buscar no LinkedIn:", error);
    }

    // 4) Busca no Instagram (usando Google site:instagram.com)
    try {
      const instagramQuery = `site:instagram.com ${query}`;
      console.log("Buscando no Instagram...");
      const instagramResponse = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: instagramQuery,
          num: 5,
        }),
      });

      if (instagramResponse.ok) {
        const instagramData = await instagramResponse.json();
        console.log("Resultados Instagram:", instagramData.organic?.length || 0);

        for (const item of instagramData.organic || []) {
          const handleMatch = item.link?.match(/instagram\.com\/([^/]+)/);
          
          results.push({
            nome: handleMatch ? `@${handleMatch[1]}` : item.title,
            telefone: "",
            cidade: cidade,
            estado: "",
            source: "Instagram",
            link: item.link,
            website: item.link,
            snippet: item.snippet?.substring(0, 200),
          });
        }
      } else {
        const errorText = await instagramResponse.text();
        console.error("Erro Instagram (status:", instagramResponse.status, "):", errorText);
        errors["Instagram"] = `Status ${instagramResponse.status}: ${errorText}`;
      }
    } catch (error) {
      console.error("Erro ao buscar no Instagram:", error);
    }

    console.log(`Total de leads encontrados: ${results.length}`);

    // Se todos os provedores falharam e não temos resultados
    if (results.length === 0 && Object.keys(errors).length > 0) {
      const errorSummary = Object.entries(errors)
        .map(([provider, error]) => `${provider}: ${error}`)
        .join("\n");
      
      console.error("Todos os provedores falharam:", errorSummary);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "Todas as fontes de busca falharam",
          details: errorSummary,
          errors,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        leads: results,
        total: results.length,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na busca de leads:", error);
    const errorResponse = mapGenericError(error);
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
