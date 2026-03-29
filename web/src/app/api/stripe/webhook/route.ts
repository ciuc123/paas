import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripeWebhookSecret } from "@/lib/env";
import { isPaidStatus } from "@/lib/plans";
import { getStripeClient } from "@/lib/stripe";

const webhookEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

async function updateClerkMetadata(params: {
  clerkUserId: string;
  stripeStatus: string;
  stripeCustomerId: string | null;
}) {
  const client = await clerkClient();
  await client.users.updateUserMetadata(params.clerkUserId, {
    privateMetadata: {
      stripeStatus: params.stripeStatus,
      stripeCustomerId: params.stripeCustomerId,
      paidAccess: isPaidStatus(params.stripeStatus),
      paidAccessUpdatedAt: new Date().toISOString(),
    },
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clerkUserId =
    session.metadata?.clerkUserId || session.client_reference_id || null;

  if (!clerkUserId) {
    throw new Error("checkout.session.completed missing clerkUserId");
  }

  await updateClerkMetadata({
    clerkUserId,
    stripeStatus: "active",
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : null,
  });
}

async function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  const clerkUserId = subscription.metadata?.clerkUserId || null;

  if (!clerkUserId) {
    throw new Error("subscription event missing clerkUserId in metadata");
  }

  await updateClerkMetadata({
    clerkUserId,
    stripeStatus: subscription.status,
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : null,
  });
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const payload = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!webhookEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await handleSubscriptionChanged(event.data.object as Stripe.Subscription);
    }
  } catch (error) {
    console.error("Stripe webhook handling error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}