import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getAppUrl, getStripePriceId } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = getStripeClient();
    const appUrl = getAppUrl();
    const priceId = getStripePriceId();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      metadata: {
        clerkUserId: userId,
      },
      subscription_data: {
        metadata: {
          clerkUserId: userId,
        },
      },
      success_url: `${appUrl}/roadmap?checkout=success`,
      cancel_url: `${appUrl}/upgrade?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to create Stripe checkout session" },
      { status: 500 },
    );
  }
}