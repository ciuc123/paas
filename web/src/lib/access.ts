import { currentUser } from "@clerk/nextjs/server";

import { isPaidStatus } from "@/lib/plans";

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
    return { userId: null, hasPaidAccess: false, stripeStatus: null };
  }

  if (!user) {
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

  return {
    userId: user.id,
    hasPaidAccess: paidFlagFromMetadata || isPaidStatus(statusFromMetadata),
    stripeStatus: statusFromMetadata,
  };
}