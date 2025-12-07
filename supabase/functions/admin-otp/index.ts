import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "supaworkflow@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, email, code } = await req.json();
    console.log(`Admin OTP action: ${action}, email: ${email}`);

    if (action === "request") {
      // Verificar se é o email autorizado
      if (email !== ADMIN_EMAIL) {
        console.log(`Unauthorized email attempt: ${email}`);
        return new Response(
          JSON.stringify({ success: false, error: "Email não autorizado" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Gerar código de 6 dígitos
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Invalidar códigos anteriores
      await supabaseAdmin
        .from("admin_otp_codes")
        .update({ used: true })
        .eq("email", email)
        .eq("used", false);

      // Salvar novo código
      const { error: insertError } = await supabaseAdmin
        .from("admin_otp_codes")
        .insert({
          email,
          code: otpCode,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error("Error inserting OTP:", insertError);
        throw insertError;
      }

      // Enviar email via Brevo
      const brevoApiKey = Deno.env.get("BREVO_API_KEY");
      const brevoFromEmail = Deno.env.get("BREVO_FROM_EMAIL") || "noreply@workflow360.com";
      const brevoFromName = Deno.env.get("BREVO_FROM_NAME") || "WorkFlow360";

      const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": brevoApiKey || "",
        },
        body: JSON.stringify({
          sender: { name: brevoFromName, email: brevoFromEmail },
          to: [{ email: ADMIN_EMAIL }],
          subject: "🔐 Código de Acesso - Painel Admin WorkFlow360",
          htmlContent: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0F1624; color: #ECF4FF; margin: 0; padding: 40px 20px; }
                .container { max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a2332 0%, #0d1117 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(93, 123, 255, 0.2); }
                .logo { text-align: center; margin-bottom: 30px; }
                .logo h1 { color: #5D7BFF; font-size: 28px; margin: 0; }
                .code-box { background: rgba(93, 123, 255, 0.1); border: 2px solid #5D7BFF; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
                .code { font-size: 42px; font-weight: bold; color: #5D7BFF; letter-spacing: 8px; font-family: monospace; }
                .info { color: #8FAEFF; font-size: 14px; text-align: center; margin-top: 20px; }
                .warning { color: #ff6b6b; font-size: 12px; text-align: center; margin-top: 15px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <h1>🔧 WorkFlow360 Admin</h1>
                </div>
                <p style="text-align: center; color: #ECF4FF;">Seu código de acesso ao painel de administração:</p>
                <div class="code-box">
                  <div class="code">${otpCode}</div>
                </div>
                <p class="info">Este código expira em <strong>10 minutos</strong>.</p>
                <p class="warning">⚠️ Se você não solicitou este código, ignore este email.</p>
                <div class="footer">
                  <p>WorkFlow360 - Sistema de Gestão de Vendas</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("Brevo error:", errorText);
        throw new Error(`Failed to send email: ${errorText}`);
      }

      console.log("OTP email sent successfully");
      return new Response(
        JSON.stringify({ success: true, message: "Código enviado para o email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "verify") {
      // Verificar código
      const { data: otpData, error: otpError } = await supabaseAdmin
        .from("admin_otp_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpData) {
        console.log("Invalid or expired OTP");
        return new Response(
          JSON.stringify({ success: false, error: "Código inválido ou expirado" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Marcar código como usado
      await supabaseAdmin
        .from("admin_otp_codes")
        .update({ used: true })
        .eq("id", otpData.id);

      // Gerar token de sessão admin (válido por 24h)
      const adminToken = crypto.randomUUID();
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      console.log("OTP verified successfully");
      return new Response(
        JSON.stringify({ 
          success: true, 
          adminToken,
          tokenExpiry,
          message: "Acesso autorizado" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Ação inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error("Admin OTP error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
