"use client";

import { useState } from "react";

export function CheckoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Could not create checkout session");
      }

      const payload = (await response.json()) as { url?: string };
      if (!payload.url) {
        throw new Error("Checkout URL is missing from response");
      }

      window.location.assign(payload.url);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Checkout failed";
      setError(message);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className="rounded-full bg-[#245c4f] px-6 py-3 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Redirecting to checkout..." : "Upgrade with Stripe"}
      </button>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}