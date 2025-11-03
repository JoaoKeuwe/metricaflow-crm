import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== send-password-reset invoked ===");
  
  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();
    console.log("Password reset requested for:", email);

    if (!email) {
      throw new Error("Email é obrigatório");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate password reset using Supabase Auth
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${redirectUrl}?reset=true`,
      },
    });

    if (error) {
      console.error("Erro ao gerar link de recuperação:", error);
      const status = (error as any)?.status || (error as any)?.code;
      if (status === 404 || String(error.message).toLowerCase().includes('not found')) {
        // Não revelar se o email existe: responder 200 de forma genérica
        return new Response(
          JSON.stringify({ success: true, message: "Se o email existir, enviaremos um link de recuperação." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      throw new Error(`Erro ao gerar link: ${error.message}`);
    }

    const resetLink = data.properties?.action_link;
    if (!resetLink) {
      throw new Error("Link de recuperação não foi gerado");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "CRM System <onboarding@resend.dev>";
    
    console.log("Resend config:", { 
      hasApiKey: !!resendApiKey, 
      from: resendFrom 
    });
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY is required");
    }

    console.log("Sending password reset email to:", email);
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject: "Redefinir sua senha",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Redefinir sua senha</h2>
            <p>Você solicitou a redefinição de senha para sua conta.</p>
            <p>Clique no botão abaixo para redefinir sua senha:</p>
            <div style="margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Se você não solicitou esta redefinição, pode ignorar este email com segurança.
            </p>
            <p style="color: #666; font-size: 14px;">
              Este link expira em 1 hora.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", {
        status: emailResponse.status,
        error: errorData
      });
      
      // Erro 403: Domínio não verificado
      if (emailResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: "Configuração de email incompleta",
            details: `O domínio usado para envio de emails não foi verificado no Resend. Configure o domínio em https://resend.com/domains e adicione os registros DNS necessários.`,
            hint: "Durante testes, você pode usar 'onboarding@resend.dev' no secret RESEND_FROM."
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      // Erro 422: Domain verification (retorna sucesso para não revelar se email existe)
      if (emailResponse.status === 422) {
        console.log("Domain verification error (returning success for security):", errorData);
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "If this email exists in our system, you will receive a password reset link."
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Password reset email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado com sucesso" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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
