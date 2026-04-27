// Stripe webhook route.
// Upgrades users to Pro when subscription checkout succeeds.
// Downgrades users to Free when subscription is cancelled.

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateUserPlan({
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
  subscriptionStatus?: string | null;
}) {
  const { error } = await supabaseAdmin.from("usage_limits").upsert(
    {
      user_id: userId,
      plan,
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId || null,
      subscription_status: subscriptionStatus || "inactive",
    },
    {
      onConflict: "user_id",
    }
  );

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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;

      const customerId =
        typeof session.customer === "string" ? session.customer : null;

      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (!userId) {
        return Response.json(
          { error: "Missing user_id in Stripe checkout metadata." },
          { status: 400 }
        );
      }

      await updateUserPlan({
        userId,
        plan: "pro",
        customerId,
        subscriptionId,
        subscriptionStatus: "active",
      });

      return Response.json({
        received: true,
        upgraded: true,
        user_id: userId,
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.user_id;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : null;

      if (!userId) {
        return Response.json(
          { error: "Missing user_id in Stripe subscription metadata." },
          { status: 400 }
        );
      }

      await updateUserPlan({
        userId,
        plan: "free",
        customerId,
        subscriptionId: subscription.id,
        subscriptionStatus: "cancelled",
      });

      return Response.json({
        received: true,
        downgraded: true,
        user_id: userId,
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json(
      { error: `Webhook handler failed: ${String(error)}` },
      { status: 500 }
    );
  }
}