import { currentUser } from "@clerk/nextjs/server";

import { isPaidStatus } from "@/lib/plans";
import { isPaywallEnabled } from "@/lib/env";

type AccessResult = {
  userId: string | null;
  hasPaidAccess: boolean;
  stripeStatus: string | null;
};

export async function getCurrentAccess(): Promise<AccessResult> {
  let user;
  try {
    user = await currentUser();
  } catch {
    // If the paywall is disabled, allow anonymous access.
    if (!isPaywallEnabled()) {
      return { userId: null, hasPaidAccess: true, stripeStatus: null };
    }

    return { userId: null, hasPaidAccess: false, stripeStatus: null };
  }

  if (!user) {
    // No authenticated user: if paywall is disabled, allow access to anonymous users.
    if (!isPaywallEnabled()) {
      return { userId: null, hasPaidAccess: true, stripeStatus: null };
    }

    return {
      userId: null,
      hasPaidAccess: false,
      stripeStatus: null,
    };
  }

  const privateMetadata = user.privateMetadata as Record<string, unknown>;
  const statusFromMetadata =
    typeof privateMetadata?.stripeStatus === "string"
      ? privateMetadata.stripeStatus
      : null;

  const paidFlagFromMetadata = privateMetadata?.paidAccess === true;

  // Determine access based on metadata / stripe status
  let hasPaidAccess = paidFlagFromMetadata || isPaidStatus(statusFromMetadata);

  // If paywall is disabled (default), treat all authenticated users as having access.
  // This allows turning the paywall back on later by setting PAYWALL_ENABLED=true.
  if (!isPaywallEnabled()) {
    hasPaidAccess = true;
  }

  return {
    userId: user.id,
    hasPaidAccess,
    stripeStatus: statusFromMetadata,
  };
}