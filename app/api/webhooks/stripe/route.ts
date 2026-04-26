// Receives Stripe webhook events and upgrades user to Pro after payment

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.user_id;

    if (!userId) {
      return Response.json(
        { error: "Missing user_id in Stripe metadata." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("usage_limits")
      .upsert(
        {
          user_id: userId,
          plan: "pro",
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ received: true, upgraded: true });
  }

  return Response.json({ received: true });
}