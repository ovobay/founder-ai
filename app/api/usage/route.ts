// Secure usage API.
// Loads the logged-in user's usage.
// If the user has a Stripe subscription, this route syncs the latest Stripe status first.

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

function getSubscriptionStatus(subscription: Stripe.Subscription) {
  if (subscription.cancel_at_period_end) {
    return "cancelling";
  }

  return subscription.status;
}

function getPlan(subscription: Stripe.Subscription) {
  if (subscription.status === "active" || subscription.status === "trialing") {
    return "pro";
  }

  return "free";
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    let { data, error } = await supabaseAdmin
      .from("usage_limits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json({
        plan: "free",
        generations: 0,
        remaining: 5,
        subscription_status: "inactive",
      });
    }

    // If we have a Stripe subscription ID, ask Stripe for the latest truth.
    if (data.stripe_subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(
        data.stripe_subscription_id
      );

      const syncedPlan = getPlan(subscription);
      const syncedStatus = getSubscriptionStatus(subscription);

      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from("usage_limits")
        .update({
          plan: syncedPlan,
          subscription_status: syncedStatus,
        })
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }

      data = updatedData;
    }

    const plan = data.plan || "free";
    const generations = data.generations || 0;
    const subscriptionStatus = data.subscription_status || "inactive";

    return Response.json({
      plan,
      generations,
      subscription_status: subscriptionStatus,
      remaining: plan === "pro" ? "unlimited" : Math.max(0, 5 - generations),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}