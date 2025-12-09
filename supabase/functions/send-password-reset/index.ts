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

    // Get user by email using admin API
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    // Se não encontrar usuário, retornar sucesso genérico (segurança)
    if (!user) {
      console.log("User not found, returning generic success");
      return new Response(
        JSON.stringify({ success: true, message: "Se o email existir, enviaremos um link de recuperação." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate custom reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira em 1 hora

    // Save token to database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error saving reset token:", tokenError);
      throw new Error("Erro ao criar token de recuperação");
    }

    // Build reset link using the redirect URL's origin
    const urlOrigin = new URL(redirectUrl).origin;
    const resetLink = `${urlOrigin}/reset-password?token=${resetToken}`;

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const brevoFromEmail = Deno.env.get("BREVO_FROM_EMAIL");
    const brevoFromName = Deno.env.get("BREVO_FROM_NAME") || "WorkFlow360 CRM";
    
    console.log("Brevo config:", { 
      hasApiKey: !!brevoApiKey, 
      fromEmail: brevoFromEmail,
      fromName: brevoFromName
    });
    
    if (!brevoApiKey || !brevoFromEmail) {
      console.error("BREVO_API_KEY or BREVO_FROM_EMAIL not configured");
      throw new Error("BREVO_API_KEY e BREVO_FROM_EMAIL são obrigatórios");
    }

    console.log("Sending password reset email to:", email);
    
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
          },
        ],
        subject: "Redefinir sua senha - WorkFlow360 CRM",
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: 'Poppins', Arial, sans-serif;
                  line-height: 1.6;
                  color: #111111;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .container {
                  background-color: #F8F8F8;
                  border-radius: 10px;
                  padding: 30px;
                  border: 1px solid #e0e0e0;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .header h1 {
                  color: #FF3B99;
                  margin: 0;
                  font-weight: 700;
                }
                .content {
                  background-color: white;
                  padding: 20px;
                  border-radius: 5px;
                }
                .button {
                  display: inline-block;
                  padding: 15px 30px;
                  background-color: #FF3B99;
                  color: white !important;
                  text-decoration: none;
                  border-radius: 8px;
                  margin: 20px 0;
                  font-weight: 600;
                  transition: background-color 0.3s;
                }
                .button:hover {
                  background-color: #FF6FBF;
                }
                .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 12px;
                  color: #333333;
                }
                .warning-box {
                  background-color: #FFF4E6;
                  border-left: 4px solid #FF3B99;
                  padding: 15px;
                  margin: 20px 0;
                  border-radius: 4px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 WorkFlow360 CRM</h1>
                </div>
                <div class="content">
                  <h2 style="color: #111111;">Recuperação de Senha</h2>
                  <p>Olá!</p>
                  <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>WorkFlow360 CRM</strong>.</p>
                  <p>Para criar uma nova senha, clique no botão abaixo:</p>
                  <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
                  </div>
                  <div class="warning-box">
                    <p style="margin: 0; font-weight: 600;">⚠️ Importante:</p>
                    <ul style="margin: 10px 0;">
                      <li>Este link é válido por 1 hora</li>
                      <li>Se você não solicitou esta alteração, ignore este email</li>
                      <li>Sua senha atual continuará funcionando</li>
                    </ul>
                  </div>
                  <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                  <p style="word-break: break-all; color: #666; font-size: 12px; background-color: #F8F8F8; padding: 10px; border-radius: 4px;">${resetLink}</p>
                </div>
                <div class="footer">
                  <p>Este é um email automático, por favor não responda.</p>
                  <p style="color: #FF3B99; font-weight: 600;">&copy; ${new Date().getFullYear()} WorkFlow360 CRM - Sistema de Gestão de Vendas</p>
                </div>
              </div>
            </body>
          </html>
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
            error: "Erro de autenticação",
            details: "API key da Brevo inválida ou expirada. Verifique a configuração do secret BREVO_API_KEY."
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      // Erro 400/422: Outros erros (retorna sucesso para não revelar se email existe)
      if (emailResponse.status === 400 || emailResponse.status === 422) {
        console.log("Brevo validation error (returning success for security):", errorData);
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Se o email existir no sistema, você receberá um link de recuperação."
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
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
  } catch (error: unknown) {
    // Log detailed error server-side only
    console.error("Error in send-password-reset function:", error);
    // Return generic success message to prevent email enumeration
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Se o email existir no sistema, você receberá um link de recuperação." 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
