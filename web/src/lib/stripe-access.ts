import { clerkClient } from "@clerk/nextjs/server";

import { getStripeClient } from "@/lib/stripe";

type GrantAccessParams = {
  sessionId: string;
  clerkUserId: string;
};

export async function grantAccessFromCheckoutSession(
  params: GrantAccessParams,
): Promise<boolean> {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(params.sessionId);

  const sessionUserId =
    session.metadata?.clerkUserId || session.client_reference_id || null;
  const isOwner = sessionUserId === params.clerkUserId;
  const isPaid = session.payment_status === "paid";

  if (!isOwner || !isPaid) {
    return false;
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(params.clerkUserId, {
    privateMetadata: {
      stripeStatus: "active",
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      paidAccess: true,
      paidAccessUpdatedAt: new Date().toISOString(),
    },
  });

  return true;
}