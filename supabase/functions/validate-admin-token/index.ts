import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { token } = await req.json();
    
    if (!token || typeof token !== 'string') {
      console.log("Invalid token format provided");
      return new Response(
        JSON.stringify({ valid: false, error: "Token inválido" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token exists and is not expired or revoked
    const { data: session, error } = await supabaseAdmin
      .from("admin_sessions")
      .select("*")
      .eq("token", token)
      .eq("revoked", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session) {
      console.log("Token validation failed:", error?.message || "Token not found/expired");
      return new Response(
        JSON.stringify({ valid: false, error: "Token inválido ou expirado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin token validated successfully for: ${session.email}`);
    return new Response(
      JSON.stringify({ 
        valid: true, 
        email: session.email,
        expiresAt: session.expires_at 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    // Log detailed error server-side only
    console.error("Validate admin token error:", error);
    // Return generic error to client to prevent information disclosure
    return new Response(
      JSON.stringify({ valid: false, error: "Erro ao validar sessão" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
