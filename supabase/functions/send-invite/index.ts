import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInviteRequest {
  inviteId: string;
  email: string;
  role: string;
  companyName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteId, email, role, companyName }: SendInviteRequest = await req.json();

    console.log('Sending invite email:', { inviteId, email, role, companyName });

    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:5173'}/accept-invite?token=${inviteId}`;
    
    const roleLabel = role === "gestor" ? "Gestor" : "Vendedor";

    const emailResponse = await resend.emails.send({
      from: "CRM System <onboarding@resend.dev>",
      to: [email],
      subject: `Convite para ${companyName}`,
      html: `
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
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
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
