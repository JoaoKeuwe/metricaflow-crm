import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");

    if (!SERPER_API_KEY) {
      throw new Error("SERPER_API_KEY não configurada");
    }

    console.log("Buscando leads para:", query);

    const results: SearchResult[] = [];

    // Busca no Google
    try {
      const googleQuery = `${query} contato telefone`;
      const googleResponse = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: googleQuery,
          num: 10,
        }),
      });

      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        console.log("Resultados Google:", googleData.organic?.length || 0);

        // Processa resultados do Google
        for (const item of googleData.organic || []) {
          const phoneMatch = item.snippet?.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/);
          const cityMatch = query.match(/([\w\s]+)(?:\s*-\s*[A-Z]{2})?$/i);

          if (phoneMatch) {
            results.push({
              nome: item.title,
              telefone: phoneMatch[0],
              cidade: cityMatch ? cityMatch[1].trim() : "",
              estado: "",
              source: "Google",
              link: item.link,
              snippet: item.snippet?.substring(0, 200),
            });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar no Google:", error);
    }

    // Busca no LinkedIn (usando Google site:linkedin.com)
    try {
      const linkedinQuery = `site:linkedin.com ${query}`;
      const linkedinResponse = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: linkedinQuery,
          num: 10,
        }),
      });

      if (linkedinResponse.ok) {
        const linkedinData = await linkedinResponse.json();
        console.log("Resultados LinkedIn:", linkedinData.organic?.length || 0);

        for (const item of linkedinData.organic || []) {
          // Extrai nome do título (geralmente está no formato "Nome - Cargo | LinkedIn")
          const nameMatch = item.title?.match(/^([^-|]+)/);
          
          results.push({
            nome: nameMatch ? nameMatch[1].trim() : item.title,
            telefone: "",
            cidade: "",
            estado: "",
            source: "LinkedIn",
            link: item.link,
            snippet: item.snippet?.substring(0, 200),
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar no LinkedIn:", error);
    }

    // Busca no Instagram (usando Google site:instagram.com)
    try {
      const instagramQuery = `site:instagram.com ${query}`;
      const instagramResponse = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: instagramQuery,
          num: 10,
        }),
      });

      if (instagramResponse.ok) {
        const instagramData = await instagramResponse.json();
        console.log("Resultados Instagram:", instagramData.organic?.length || 0);

        for (const item of instagramData.organic || []) {
          // Extrai handle do Instagram do link
          const handleMatch = item.link?.match(/instagram\.com\/([^/]+)/);
          
          results.push({
            nome: handleMatch ? `@${handleMatch[1]}` : item.title,
            telefone: "",
            cidade: "",
            estado: "",
            source: "Instagram",
            link: item.link,
            snippet: item.snippet?.substring(0, 200),
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar no Instagram:", error);
    }

    console.log(`Total de leads encontrados: ${results.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        leads: results,
        total: results.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na busca de leads:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
