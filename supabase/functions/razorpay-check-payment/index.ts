import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_LIMITS: Record<string, { max_domains: number; max_emails: number }> = {
  starter: { max_domains: 5, max_emails: 2 },
  professional: { max_domains: 10, max_emails: 5 },
  unlimited: { max_domains: 999, max_emails: 999 },
};

async function getRazorpayConfig() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.from("razorpay_settings").select("*").maybeSingle();
  if (error || !data) throw new Error("Razorpay settings not configured.");

  return { keyId: data.key_id, keySecret: data.key_secret };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, user_id } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { keyId, keySecret } = await getRazorpayConfig();
    const authHeader = {
      "Authorization": `Basic ${btoa(`${keyId}:${keySecret}`)}`,
    };

    const [orderRes, paymentsRes] = await Promise.all([
      fetch(`https://api.razorpay.com/v1/orders/${order_id}`, {
        headers: authHeader,
      }),
      fetch(`https://api.razorpay.com/v1/orders/${order_id}/payments`, {
        headers: authHeader,
      }),
    ]);

    const orderData = await orderRes.json();
    const paymentsData = await paymentsRes.json();

    if (!orderRes.ok) {
      throw new Error(`Razorpay order fetch failed: ${JSON.stringify(orderData)}`);
    }

    if (!paymentsRes.ok) {
      throw new Error(`Razorpay payment fetch failed: ${JSON.stringify(paymentsData)}`);
    }

    const capturedPayment = paymentsData.items?.find((payment: { status?: string }) => payment.status === "captured");
    const isPaid = orderData.status === "paid" || Boolean(capturedPayment);

    if (!isPaid) {
      return new Response(JSON.stringify({
        status: orderData.status,
        payment_statuses: paymentsData.items?.map((payment: { status?: string }) => payment.status) ?? [],
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: paymentRecord } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", order_id)
      .maybeSingle();

    if (!paymentRecord) {
      return new Response(JSON.stringify({ status: "not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (paymentRecord.status === "completed") {
      return new Response(JSON.stringify({
        status: "paid",
        plan: paymentRecord.plan,
        already_processed: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = paymentRecord.plan;
    const limits = PLAN_LIMITS[plan!];

    if (!limits) {
      throw new Error(`Unknown plan: ${plan}`);
    }

    await supabase
      .from("payments")
      .update({
        status: "completed",
        transaction_id: capturedPayment?.id || paymentRecord.transaction_id,
        metadata: {
          ...((paymentRecord.metadata as Record<string, unknown>) || {}),
          razorpay_order_status: orderData.status,
          razorpay_payment_status: capturedPayment?.status || null,
        },
      })
      .eq("order_id", order_id);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const actualUserId = user_id || paymentRecord.user_id;

    await supabase
      .from("user_subscriptions")
      .update({
        plan,
        status: "active",
        payment_provider: "razorpay",
        max_domains: limits.max_domains,
        max_emails: limits.max_emails,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq("user_id", actualUserId);

    await supabase
      .from("websites")
      .update({ tracking_enabled: true })
      .eq("user_id", actualUserId);

    return new Response(JSON.stringify({
      status: "paid",
      plan,
      transaction_id: capturedPayment?.id || paymentRecord.transaction_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Razorpay check payment error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});