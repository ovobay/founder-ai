// Stripe webhook route.
// Handles subscription lifecycle:
// - checkout.session.completed → Pro
// - customer.subscription.updated → active/cancelling/past_due/unpaid
// - customer.subscription.deleted → Free

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateUsageByUserId({
  userId,
  plan,
  customerId,
  subscriptionId,
  subscriptionStatus,
}: {
  userId: string;
  plan: "free" | "pro";
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus: string;
}) {
  const { error } = await supabaseAdmin.from("usage_limits").upsert(
    {
      user_id: userId,
      plan,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      subscription_status: subscriptionStatus,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function updateUsageBySubscriptionId({
  subscriptionId,
  plan,
  subscriptionStatus,
  cancelAtPeriodEnd,
}: {
  subscriptionId: string;
  plan: "free" | "pro";
  subscriptionStatus: string;
  cancelAtPeriodEnd?: boolean;
}) {
  const finalStatus = cancelAtPeriodEnd ? "cancelling" : subscriptionStatus;

  const { error } = await supabaseAdmin
    .from("usage_limits")
    .update({
      plan,
      subscription_status: finalStatus,
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return Response.json(
      { error: `Webhook verification failed: ${String(error)}` },
      { status: 400 }
    );
  }

  try {
    // User completed Stripe Checkout successfully
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;

      const customerId =
        typeof session.customer === "string" ? session.customer : null;

      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (!userId) {
        return Response.json(
          { error: "Missing user_id in checkout metadata." },
          { status: 400 }
        );
      }

      await updateUsageByUserId({
        userId,
        plan: "pro",
        customerId,
        subscriptionId,
        subscriptionStatus: "active",
      });

      return Response.json({
        received: true,
        event: event.type,
        action: "upgraded_to_pro",
      });
    }

    // Subscription changed: cancelled at period end, resumed, past due, unpaid, etc.
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.user_id;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : null;

      const subscriptionId = subscription.id;

      const isCancelling = subscription.cancel_at_period_end === true;

      const isActive =
        subscription.status === "active" || subscription.status === "trialing";

      const plan = isActive ? "pro" : "free";

      const subscriptionStatus = isCancelling
        ? "cancelling"
        : subscription.status;

      if (userId) {
        await updateUsageByUserId({
          userId,
          plan,
          customerId,
          subscriptionId,
          subscriptionStatus,
        });
      } else {
        // Fallback: update using stored subscription ID
        await updateUsageBySubscriptionId({
          subscriptionId,
          plan,
          subscriptionStatus,
          cancelAtPeriodEnd: isCancelling,
        });
      }

      return Response.json({
        received: true,
        event: event.type,
        action: "subscription_updated",
        subscription_status: subscriptionStatus,
      });
    }

    // Subscription fully ended
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.user_id;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : null;

      const subscriptionId = subscription.id;

      if (userId) {
        await updateUsageByUserId({
          userId,
          plan: "free",
          customerId,
          subscriptionId,
          subscriptionStatus: "cancelled",
        });
      } else {
        await updateUsageBySubscriptionId({
          subscriptionId,
          plan: "free",
          subscriptionStatus: "cancelled",
        });
      }

      return Response.json({
        received: true,
        event: event.type,
        action: "downgraded_to_free",
      });
    }

    return Response.json({
      received: true,
      event: event.type,
      action: "ignored",
    });
  } catch (error) {
    return Response.json(
      { error: `Webhook handler failed: ${String(error)}` },
      { status: 500 }
    );
  }
}