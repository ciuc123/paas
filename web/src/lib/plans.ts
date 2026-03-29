export const PRODUCT_CONFIG = {
  name: "PaaS Roadmap Access",
  priceLabel: "One-time purchase",
  description:
    "Paid access to the live product roadmap and execution status updates.",
} as const;

export const PAID_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

export function isPaidStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }

  return PAID_STATUSES.has(status);
}