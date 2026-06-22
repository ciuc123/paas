"use client";

import { useEffect, useRef, useState } from "react";
import { useUser, SignOutButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function HamburgerMenu() {
  const { isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative md:hidden" ref={menuRef}>
      <button
        type="button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full border border-[#312a22]/15 bg-white/70 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]"
      >
        <span
          aria-hidden="true"
          className={`block h-0.5 w-4 bg-[#1d1a17] transition-transform ${isOpen ? "translate-y-2 rotate-45" : ""}`}
        />
        <span
          aria-hidden="true"
          className={`block h-0.5 w-4 bg-[#1d1a17] transition-opacity ${isOpen ? "opacity-0" : ""}`}
        />
        <span
          aria-hidden="true"
          className={`block h-0.5 w-4 bg-[#1d1a17] transition-transform ${isOpen ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          id="mobile-menu"
          role="menu"
          aria-label="Mobile navigation"
          className="absolute top-11 z-50 w-[220px] rounded-2xl border border-[#312a22]/15 bg-[#fffaf2] p-2 shadow-[0_8px_24px_rgba(68,49,31,0.12)]"
        >
          {/* User area at the top of the menu when signed in */}
          {isSignedIn && (
            <div className="px-3 py-2">
              <UserButton />
            </div>
          )}

          <div className="flex flex-col gap-2 px-2">
            <Link
              href="/roadmap"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-[#f4efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]"
            >
              <span className="mr-3 flex h-4 w-4 items-center justify-center text-[#1d1a17]" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="3" rx="1" fill="currentColor" />
                  <rect x="3" y="10.5" width="18" height="3" rx="1" fill="currentColor" />
                  <rect x="3" y="17" width="10" height="3" rx="1" fill="currentColor" />
                </svg>
              </span>
              Roadmap
            </Link>
            <Link
              href="/projects"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-[#f4efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]"
            >
              <span className="mr-3 flex h-4 w-4 items-center justify-center text-[#1d1a17]" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" />
                  <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" />
                  <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" />
                  <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" />
                </svg>
              </span>
              Projects
            </Link>
          </div>

          <div className="mt-3 border-t border-[#312a22]/10 pt-3 px-2">
            {isSignedIn ? (
              <SignOutButton>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-[#f4efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]"
                >
                  Logout
                </button>
              </SignOutButton>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/sign-in"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-[#f4efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center rounded-xl px-4 py-2 bg-[#245c4f] text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
