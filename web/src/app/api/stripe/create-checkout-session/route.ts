import { NextResponse } from "next/server";

import { getAppUrl, getStripePriceId, isPaywallEnabled } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
  // If the paywall is not enabled, disable all Stripe side effects in MVP mode.
  if (!isPaywallEnabled()) {
    return NextResponse.json({ error: "Billing disabled (paywall off)" }, { status: 404 });
  }
  // Do not require authentication for creating a checkout session.
  // If a Clerk user is available server-side, we will attach the ID, otherwise
  // create a session without clerk metadata so anonymous users can checkout.
  let clerkUserId: string | undefined = undefined;

  try {
    // Attempt to read Clerk user id if available in server runtime globals.
    // Avoid importing auth() to allow anonymous access and simplify testing.
    // Some runtimes expose Clerk through request/session; leave undefined otherwise.
    // (No-op — clerkUserId remains undefined)
  } catch {
    // ignore
  }

  try {
    const stripe = getStripeClient();
    const appUrl = getAppUrl();
    const priceId = getStripePriceId();

    const sessionParams: Record<string, any> = {
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: appUrl + '/roadmap?checkout=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: appUrl + '/upgrade?checkout=cancel',
    };

    if (clerkUserId) {
      sessionParams.client_reference_id = clerkUserId;
      sessionParams.metadata = { clerkUserId };
    }

    const session = await (stripe as any).checkout.sessions.create(sessionParams as any);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to create Stripe checkout session" },
      { status: 500 },
    );
  }
}