import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Helper para logging
const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Gerar senha temporária segura
const generateTemporaryPassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Mapear price IDs para planos
const getPlanFromPriceId = (priceId: string): { planType: string; userLimit: number } => {
  const planMapping: Record<string, { planType: string; userLimit: number }> = {
    // Individual Mensal
    "price_1SamlRCkhjlgO62pLLGBR0pJ": { planType: "individual", userLimit: 1 },
    // Individual Anual
    "price_1SammgCkhjlgO62pZLHvN2sy": { planType: "individual", userLimit: 1 },
    // Equipe Mensal
    "price_1Samn6CkhjlgO62p9ERe1H0N": { planType: "team", userLimit: 10 },
    // Equipe Anual
    "price_1SamoaCkhjlgO62pbIhPcttD": { planType: "team", userLimit: 10 },
  };
  
  return planMapping[priceId] || { planType: "individual", userLimit: 1 };
};

// Enviar email de confirmação de plano ativado (para usuários existentes)
const sendPlanActivatedEmail = async (
  email: string,
  userName: string,
  planType: string
): Promise<void> => {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const fromEmail = Deno.env.get("BREVO_FROM_EMAIL") || "noreply@workflow360.com";
  const fromName = Deno.env.get("BREVO_FROM_NAME") || "WorkFlow360";
  
  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY não configurada");
  }

  const planName = planType === "team" ? "WorkFlow360 Equipe" : "WorkFlow360 Individual";
  const loginUrl = "https://myworkflow360.com/auth";

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0F1624; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0F1624;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, rgba(93, 123, 255, 0.1) 0%, rgba(143, 174, 255, 0.05) 100%); border: 1px solid rgba(93, 123, 255, 0.2); border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #5D7BFF 0%, #8FAEFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                🎉 Seu plano foi ativado!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; color: #ECF4FF; font-size: 16px; line-height: 1.6;">
                Olá${userName ? ` ${userName}` : ""}!
              </p>
              
              <p style="margin: 0 0 20px; color: #ECF4FF; font-size: 16px; line-height: 1.6;">
                Sua assinatura do <strong style="color: #8FAEFF;">${planName}</strong> foi ativada com sucesso!
              </p>

              <p style="margin: 0 0 20px; color: #ECF4FF; font-size: 16px; line-height: 1.6;">
                Você já pode acessar o sistema normalmente com seu email e senha atuais.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #5D7BFF 0%, #8FAEFF 100%); color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 20px rgba(93, 123, 255, 0.4);">
                      Acessar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Success Box -->
              <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center;">
                <p style="margin: 0; color: #22C55E; font-size: 15px;">
                  ✨ Aproveite todas as funcionalidades do seu plano!
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(93, 123, 255, 0.2);">
              <p style="margin: 0; color: #6B7280; font-size: 13px; text-align: center; line-height: 1.5;">
                Precisa de ajuda? Responda este email ou acesse nosso suporte.<br>
                © 2024 WorkFlow360. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email }],
      subject: "🎉 Seu plano WorkFlow360 foi ativado!",
      htmlContent: emailHtml,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Erro ao enviar email de plano ativado", { status: response.status, error: errorText });
    throw new Error(`Falha ao enviar email: ${response.status}`);
  }

  logStep("Email de plano ativado enviado com sucesso", { email });
};

// Enviar email de boas-vindas via Brevo (para novos usuários)
const sendWelcomeEmail = async (
  email: string, 
  temporaryPassword: string,
  planType: string
): Promise<void> => {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const fromEmail = Deno.env.get("BREVO_FROM_EMAIL") || "noreply@workflow360.com";
  const fromName = Deno.env.get("BREVO_FROM_NAME") || "WorkFlow360";
  
  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY não configurada");
  }

  const planName = planType === "team" ? "WorkFlow360 Equipe" : "WorkFlow360 Individual";
  const loginUrl = "https://myworkflow360.com/auth";

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0F1624; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0F1624;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, rgba(93, 123, 255, 0.1) 0%, rgba(143, 174, 255, 0.05) 100%); border: 1px solid rgba(93, 123, 255, 0.2); border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #5D7BFF 0%, #8FAEFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                🎉 Bem-vindo ao WorkFlow360!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; color: #ECF4FF; font-size: 16px; line-height: 1.6;">
                Sua assinatura do <strong style="color: #8FAEFF;">${planName}</strong> foi confirmada com sucesso!
              </p>
              
              <p style="margin: 0 0 20px; color: #ECF4FF; font-size: 16px; line-height: 1.6;">
                Criamos sua conta automaticamente. Use as credenciais abaixo para acessar o sistema:
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(93, 123, 255, 0.1); border: 1px solid rgba(93, 123, 255, 0.3); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #8FAEFF; font-size: 14px;">📧 Email:</span>
                          <span style="color: #ECF4FF; font-size: 16px; font-weight: 600; margin-left: 12px;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #8FAEFF; font-size: 14px;">🔑 Senha temporária:</span>
                          <span style="color: #ECF4FF; font-size: 16px; font-weight: 600; font-family: monospace; margin-left: 12px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #5D7BFF 0%, #8FAEFF 100%); color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 20px rgba(93, 123, 255, 0.4);">
                      Acessar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; padding: 16px; margin-top: 24px;">
                <p style="margin: 0; color: #FFC107; font-size: 14px; line-height: 1.5;">
                  ⚠️ <strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso. Vá em Configurações > Alterar Senha.
                </p>
              </div>
            </td>
          </tr>

          <!-- Trial Info -->
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #22C55E; font-size: 15px;">
                  ✨ Você tem <strong>14 dias grátis</strong> para explorar todas as funcionalidades!
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(93, 123, 255, 0.2);">
              <p style="margin: 0; color: #6B7280; font-size: 13px; text-align: center; line-height: 1.5;">
                Precisa de ajuda? Responda este email ou acesse nosso suporte.<br>
                © 2024 WorkFlow360. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email }],
      subject: "🎉 Bem-vindo ao WorkFlow360 - Suas credenciais de acesso",
      htmlContent: emailHtml,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Erro ao enviar email", { status: response.status, error: errorText });
    throw new Error(`Falha ao enviar email: ${response.status}`);
  }

  logStep("Email de boas-vindas enviado com sucesso", { email });
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook recebido");

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    // Verificar assinatura do webhook (se configurado)
    if (webhookSecret && signature) {
      try {
        // Usar constructEventAsync para Deno (SubtleCryptoProvider requer async)
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Assinatura do webhook verificada");
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Falha na verificação da assinatura", { error: errorMessage });
        return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Em desenvolvimento, aceitar sem verificação
      event = JSON.parse(body);
      logStep("Webhook aceito sem verificação de assinatura (desenvolvimento)");
    }

    logStep("Evento recebido", { type: event.type, id: event.id });

    // Processar apenas checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const customerEmail = session.customer_email || session.customer_details?.email;
      
      if (!customerEmail) {
        logStep("Email do cliente não encontrado na sessão");
        return new Response(JSON.stringify({ received: true, message: "Email não encontrado" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      logStep("Processando compra", { 
        email: customerEmail, 
        sessionId: session.id,
        subscriptionId: session.subscription 
      });

      // Inicializar Supabase com service role para criar usuários
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Verificar se usuário já existe
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === customerEmail);

      if (userExists) {
        logStep("Usuário já existe, atualizando assinatura e enviando email", { email: customerEmail });
        
        // Buscar usuário existente
        const existingUser = existingUsers?.users?.find(u => u.email === customerEmail);
        
        if (existingUser) {
          // Obter informações do plano
          let planInfo = { planType: "individual", userLimit: 1 };
          
          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            const priceId = subscription.items.data[0]?.price?.id;
            if (priceId) {
              planInfo = getPlanFromPriceId(priceId);
            }
          }
          
          logStep("Plano identificado para usuário existente", planInfo);
          
          // Buscar company_id e nome do usuário existente
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("company_id, name")
            .eq("id", existingUser.id)
            .single();
          
          if (profile?.company_id) {
            // Atualizar subscription IMEDIATAMENTE
            const { error: subError } = await supabaseAdmin
              .from("subscriptions")
              .upsert({
                company_id: profile.company_id,
                status: "active",
                plan_type: planInfo.planType,
                user_limit: planInfo.userLimit,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              }, {
                onConflict: "company_id",
              });

            if (subError) {
              logStep("Erro ao atualizar subscription", { error: subError.message });
            } else {
              logStep("Subscription atualizada com sucesso para usuário existente");
            }
          }
          
          // Enviar email de confirmação de plano ativado
          try {
            await sendPlanActivatedEmail(customerEmail, profile?.name || "", planInfo.planType);
            logStep("Email de plano ativado enviado para usuário existente");
          } catch (emailError: unknown) {
            const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
            logStep("Erro ao enviar email de plano ativado (não crítico)", { error: errorMessage });
          }
        }
        
        return new Response(JSON.stringify({ 
          received: true, 
          message: "Usuário existente - assinatura atualizada e email enviado" 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Gerar senha temporária
      const temporaryPassword = generateTemporaryPassword();
      logStep("Senha temporária gerada");

      // Obter informações do plano a partir da subscription
      let planInfo = { planType: "individual", userLimit: 1 };
      
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price?.id;
        if (priceId) {
          planInfo = getPlanFromPriceId(priceId);
        }
      }

      logStep("Plano identificado", planInfo);

      // Criar usuário no Supabase Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          name: customerEmail.split("@")[0],
          company_name: "Minha Empresa",
          source: "stripe_checkout",
        },
      });

      if (createError) {
        logStep("Erro ao criar usuário", { error: createError.message });
        throw new Error(`Falha ao criar usuário: ${createError.message}`);
      }

      logStep("Usuário criado com sucesso", { userId: newUser.user.id });

      // Aguardar trigger criar profile e company
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Atualizar profile para forçar troca de senha no primeiro login
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({ must_change_password: true })
        .eq("id", newUser.user.id);

      if (updateProfileError) {
        logStep("Erro ao atualizar must_change_password", { error: updateProfileError.message });
      } else {
        logStep("Profile atualizado com must_change_password = true");
      }

      // Buscar company_id do usuário
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("company_id")
        .eq("id", newUser.user.id)
        .single();

      if (profile?.company_id) {
        // Criar/atualizar registro de subscription
        const { error: subError } = await supabaseAdmin
          .from("subscriptions")
          .upsert({
            company_id: profile.company_id,
            status: "active",
            plan_type: planInfo.planType,
            user_limit: planInfo.userLimit,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }, {
            onConflict: "company_id",
          });

        if (subError) {
          logStep("Erro ao criar subscription", { error: subError.message });
        } else {
          logStep("Subscription criada com sucesso");
        }
      }

      // Enviar email de boas-vindas com credenciais
      try {
        await sendWelcomeEmail(customerEmail, temporaryPassword, planInfo.planType);
      } catch (emailError: unknown) {
        const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
        logStep("Erro ao enviar email (não crítico)", { error: errorMessage });
        // Não falhar o webhook por causa do email
      }

      return new Response(JSON.stringify({ 
        received: true, 
        message: "Conta criada e email enviado com sucesso",
        userId: newUser.user.id,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Para outros eventos, apenas confirmar recebimento
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    // Log detailed error server-side only
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Erro no webhook", { error: errorMessage });
    // Return generic error to Stripe (they will retry)
    return new Response(JSON.stringify({ error: "Erro interno ao processar webhook" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
