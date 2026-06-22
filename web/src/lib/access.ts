import { currentUser } from "@clerk/nextjs/server";

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
    // If Clerk throws, fall back to anonymous access (auth optional).
    return { userId: null, hasPaidAccess: true, stripeStatus: null };
  }

  if (!user) {
    // Auth is optional: allow anonymous users full access.
    return { userId: null, hasPaidAccess: true, stripeStatus: null };
  }

  const privateMetadata = user.privateMetadata as Record<string, unknown>;
  const statusFromMetadata =
    typeof privateMetadata?.stripeStatus === "string"
      ? privateMetadata.stripeStatus
      : null;

  // Auth is optional and paid gating is disabled: everyone has access.
  const hasPaidAccess = true;

  return {
    userId: user.id,
    hasPaidAccess,
    stripeStatus: statusFromMetadata,
  };
}