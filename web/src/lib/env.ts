/// <reference types="node" />

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getStripeSecretKey(): string {
  return requireEnv("STRIPE_SECRET_KEY");
}

export function getStripePriceId(): string {
  return requireEnv("STRIPE_PRICE_ID");
}

export function shouldSkipStripeWebhookSignatureVerification(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.SKIP_STRIPE_WEBHOOK_SIGNATURE_VERIFICATION === "true"
  );
}

export function getStripeWebhookSecret(): string {
  if (shouldSkipStripeWebhookSignatureVerification()) {
    return "";
  }

  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

export function getDatabaseUrl(): string {
  return requireEnv("DATABASE_URL");
}

export function getDirectDatabaseUrl(): string {
  return process.env.DATABASE_URL_DIRECT || getDatabaseUrl();
}
