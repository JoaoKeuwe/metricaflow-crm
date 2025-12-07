import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-STRIPE-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify user is super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);

    const userId = userData.user?.id;
    if (!userId) throw new Error("User not found");

    // Check if user is super admin
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("is_super_admin")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.is_super_admin) {
      throw new Error("Acesso negado: usuário não é super admin");
    }

    logStep("Super admin verified", { userId });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch all data in parallel
    const [customers, subscriptions, invoices, paymentIntents, balance] = await Promise.all([
      stripe.customers.list({ limit: 100 }),
      stripe.subscriptions.list({ limit: 100, status: "all" }),
      stripe.invoices.list({ limit: 100 }),
      stripe.paymentIntents.list({ limit: 100 }),
      stripe.balance.retrieve(),
    ]);

    logStep("Stripe data fetched", {
      customers: customers.data.length,
      subscriptions: subscriptions.data.length,
      invoices: invoices.data.length,
      paymentIntents: paymentIntents.data.length,
    });

    // Calculate MRR from active subscriptions
    const activeSubscriptions = subscriptions.data.filter((sub: Stripe.Subscription) => sub.status === "active");
    let mrr = 0;
    for (const sub of activeSubscriptions) {
      for (const item of sub.items.data) {
        const price = item.price;
        if (price.recurring) {
          const amount = price.unit_amount || 0;
          if (price.recurring.interval === "year") {
            mrr += amount / 12;
          } else if (price.recurring.interval === "month") {
            mrr += amount;
          }
        }
      }
    }

    // Calculate total revenue from paid invoices
    const paidInvoices = invoices.data.filter((inv: Stripe.Invoice) => inv.status === "paid");
    const totalRevenue = paidInvoices.reduce((sum: number, inv: Stripe.Invoice) => sum + (inv.amount_paid || 0), 0);

    // Format customers data
    const formattedCustomers = customers.data.map((cust: Stripe.Customer) => ({
      id: cust.id,
      email: cust.email,
      name: cust.name,
      created: cust.created,
      metadata: cust.metadata,
    }));

    // Format subscriptions data
    const formattedSubscriptions = subscriptions.data.map((sub: Stripe.Subscription) => ({
      id: sub.id,
      customer: sub.customer,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      items: sub.items.data.map((item: Stripe.SubscriptionItem) => ({
        price_id: item.price.id,
        product_id: item.price.product,
        amount: item.price.unit_amount,
        currency: item.price.currency,
        interval: item.price.recurring?.interval,
      })),
    }));

    // Format invoices data
    const formattedInvoices = invoices.data.map((inv: Stripe.Invoice) => ({
      id: inv.id,
      number: inv.number,
      customer: inv.customer,
      customer_email: inv.customer_email,
      status: inv.status,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created,
      paid_at: inv.status_transitions?.paid_at,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
    }));

    // Format payment intents data
    const formattedPayments = paymentIntents.data.map((pi: Stripe.PaymentIntent) => ({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      created: pi.created,
      customer: pi.customer,
      description: pi.description,
    }));

    // Balance info
    const balanceInfo = {
      available: balance.available.map((b: Stripe.Balance.Available) => ({ amount: b.amount, currency: b.currency })),
      pending: balance.pending.map((b: Stripe.Balance.Pending) => ({ amount: b.amount, currency: b.currency })),
    };

    const response = {
      metrics: {
        totalCustomers: customers.data.length,
        activeSubscriptions: activeSubscriptions.length,
        totalSubscriptions: subscriptions.data.length,
        mrr: mrr / 100, // Convert from cents
        totalRevenue: totalRevenue / 100,
        paidInvoices: paidInvoices.length,
        totalInvoices: invoices.data.length,
      },
      customers: formattedCustomers,
      subscriptions: formattedSubscriptions,
      invoices: formattedInvoices,
      payments: formattedPayments,
      balance: balanceInfo,
    };

    logStep("Response prepared", { metrics: response.metrics });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
