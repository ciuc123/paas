import { redirect } from "next/navigation";

import { CheckoutButton } from "@/components/checkout-button";
import { getCurrentAccess } from "@/lib/access";
import { PRODUCT_CONFIG } from "@/lib/plans";

export const dynamic = "force-dynamic";

type UpgradeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpgradePage({ searchParams }: UpgradeProps) {
  const access = await getCurrentAccess();

  if (access.hasPaidAccess) {
    redirect("/roadmap");
  }

  const params = await searchParams;
  const checkoutState = params.checkout;
  const canceled = checkoutState === "cancel";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_28%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_52%,#efe7db_100%)] p-6">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-10 shadow-[0_24px_60px_rgba(68,49,31,0.14)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
          Subscription required
        </p>
        <h1 className="mt-3 text-5xl leading-[0.95] text-[#1d1a17]">Unlock roadmap access</h1>
        <p className="mt-4 text-[#5f584f]">
          This product is sold as a paid membership. Complete checkout to unlock
          the private roadmap page.
        </p>

        {canceled ? (
          <p className="mt-4 rounded-2xl border border-[#c2410c]/25 bg-[#ffedd5] p-4 text-sm text-[#9a3412]">
            Checkout was canceled. You can retry when ready.
          </p>
        ) : null}

        <section className="mt-8 rounded-2xl border border-[#312a22]/15 bg-white/65 p-6">
          <h2 className="text-2xl text-[#1d1a17]">{PRODUCT_CONFIG.name}</h2>
          <p className="mt-1 text-lg font-semibold text-[#245c4f]">
            {PRODUCT_CONFIG.priceLabel}
          </p>
          <p className="mt-2 text-sm text-[#5f584f]">{PRODUCT_CONFIG.description}</p>
          <div className="mt-6">
            <CheckoutButton />
          </div>
        </section>
      </div>
    </main>
  );
}