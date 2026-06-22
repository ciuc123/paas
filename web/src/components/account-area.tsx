"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

export default function AccountArea() {
  // Read both isSignedIn and user from Clerk so we can display the name
  const { isSignedIn, user } = useUser();

  return (
    // Show a compact account area on desktop (hidden on small screens).
    // When signed in, display avatar + name inline next to the header buttons.
    <div className="hidden md:flex items-center gap-3">
      {isSignedIn ? (
        <div className="flex items-center gap-2">
          <UserButton />
          <span className="text-sm text-[#1d1a17]">
            {/* fullName may be undefined for some Clerk users; fall back to a generic label */}
            {user?.fullName || user?.firstName || "Account"}
          </span>
        </div>
      ) : (
        <>
          <Link
            href="/sign-in"
            className="rounded-full border border-[#312a22]/15 bg-[#fff8f2] px-3 py-1 text-sm font-semibold text-[#1d1a17] hover:bg-white"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-[#245c4f] px-3 py-1 text-sm font-semibold text-[#fff8f2] hover:bg-[#1f4f44]"
          >
            Create account
          </Link>
        </>
      )}
    </div>
  );
}
