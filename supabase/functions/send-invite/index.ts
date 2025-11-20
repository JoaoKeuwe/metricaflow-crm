import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInviteRequest {
  inviteId: string;
  email: string;
  role: string;
  companyName: string;
  appUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== send-invite invoked ===");

  try {
    const { inviteId, email, role, companyName, appUrl }: SendInviteRequest = await req.json();
    console.log("Invite request:", { inviteId, email, role, companyName, appUrl });
    
    // Input validation
    if (!inviteId || !email || !role || !companyName || !appUrl) {
      return new Response(
        JSON.stringify({ error: "Dados obrigatórios não fornecidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    if (!["gestor", "vendedor"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Função inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const brevoFromEmail = Deno.env.get("BREVO_FROM_EMAIL");
    const brevoFromName = Deno.env.get("BREVO_FROM_NAME") || "WORKFLOWB";
    
    console.log("Brevo config:", { 
      hasApiKey: !!brevoApiKey, 
      from: brevoFromEmail,
      name: brevoFromName
    });
    
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not configured");
      throw new Error("BREVO_API_KEY is required");
    }
    
    if (!brevoFromEmail) {
      console.error("BREVO_FROM_EMAIL not configured");
      throw new Error("BREVO_FROM_EMAIL is required");
    }
    
    const inviteUrl = `${appUrl}/accept-invite?token=${inviteId}`;
    
    console.log('🔗 Invite URL gerado:', inviteUrl);
    console.log('📧 Brevo config:', { 
      hasApiKey: !!brevoApiKey, 
      from: brevoFromEmail,
      name: brevoFromName,
      clickTracking: false
    });
    console.log('Sending invite email:', { inviteId, email, role, companyName });
    
    const roleLabel = role === "gestor" ? "Gestor" : "Vendedor";

    // Send email using Brevo API
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: brevoFromName,
          email: brevoFromEmail,
        },
        to: [
          {
            email: email,
            name: email.split('@')[0], // Use email prefix as name
          }
        ],
        subject: `Convite para ${companyName}`,
        params: {
          CLICK_ALL: false  // Desabilita tracking de links do Brevo
        },
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Você foi convidado!</h1>
            <p>Você foi convidado para fazer parte de <strong>${companyName}</strong> como <strong>${roleLabel}</strong>.</p>
            <p>Clique no botão abaixo para aceitar o convite e definir sua senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Aceitar Convite
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Este convite expira em 7 dias.<br/>
              Se você não solicitou este convite, pode ignorar este e-mail.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">
              Ou copie e cole este link no seu navegador:<br/>
              <a href="${inviteUrl}" style="color: #0070f3;">${inviteUrl}</a>
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Brevo API error:", {
        status: emailResponse.status,
        error: errorData
      });
      
      // Erro 401: API key inválida
      if (emailResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: "Configuração de email incompleta",
            details: `A chave de API do Brevo não é válida ou está expirada. Verifique se BREVO_API_KEY está configurado corretamente.`,
            hint: "Obtenha uma nova API key em https://app.brevo.com/settings/keys/api"
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
