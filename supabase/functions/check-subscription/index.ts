import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Mapeamento de Product IDs para tipos de plano
const PRODUCT_TO_PLAN: Record<string, { planType: string; userLimit: number }> = {
  "prod_TXsZymZqCP2Nwg": { planType: "individual_monthly", userLimit: 1 },
  "prod_TXsZAM0U5ZXWUO": { planType: "individual_yearly", userLimit: 1 },
  "prod_TXsZtWAGUvYmwN": { planType: "team_monthly", userLimit: 10 },
  "prod_TXsZuwUczG89lH": { planType: "team_yearly", userLimit: 10 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's company_id from profiles
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("User profile not found");
    }
    logStep("User profile found", { companyId: profile.company_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning free plan");
      return new Response(JSON.stringify({
        subscribed: false,
        planType: "free",
        userLimit: 1,
        subscriptionEnd: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let planType = "free";
    let userLimit = 1;
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      const productId = subscription.items.data[0].price.product as string;
      const planInfo = PRODUCT_TO_PLAN[productId];
      
      if (planInfo) {
        planType = planInfo.planType;
        userLimit = planInfo.userLimit;
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        planType, 
        userLimit,
        endDate: subscriptionEnd 
      });

      // Update or create subscription record in database
      const { error: upsertError } = await supabaseClient
        .from("subscriptions")
        .upsert({
          company_id: profile.company_id,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
          plan_type: planType,
          status: "active",
          user_limit: userLimit,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: subscriptionEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, {
          onConflict: "company_id",
        });

      if (upsertError) {
        logStep("Error updating subscription record", { error: upsertError.message });
      } else {
        logStep("Subscription record updated");
      }
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      planType,
      userLimit,
      subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
