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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await supabase.from("razorpay_settings").select("*").maybeSingle();
  if (error || !data) throw new Error("Razorpay settings not configured.");
  return { keySecret: data.key_secret };
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const expectedSignature = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expectedSignature === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing payment details" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { keySecret } = await getRazorpayConfig();

    // Verify signature
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Payment verification failed. Invalid signature." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update payment record
    const { data: paymentRecord } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", razorpay_order_id)
      .maybeSingle();

    if (!paymentRecord) throw new Error("Payment record not found");

    const plan = paymentRecord.plan;
    const limits = PLAN_LIMITS[plan!];
    if (!limits) throw new Error(`Unknown plan: ${plan}`);

    // Update payment status
    await supabase
      .from("payments")
      .update({
        status: "completed",
        transaction_id: razorpay_payment_id,
        metadata: { ...((paymentRecord.metadata as any) || {}), razorpay_signature },
      })
      .eq("order_id", razorpay_order_id);

    // Update user subscription
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

    // Re-enable tracking
    await supabase
      .from("websites")
      .update({ tracking_enabled: true })
      .eq("user_id", actualUserId);

    return new Response(JSON.stringify({ success: true, plan, period_end: periodEnd.toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
