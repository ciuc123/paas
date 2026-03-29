"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

type HamburgerMenuProps = {
  isSignedIn: boolean;
};

export function HamburgerMenu({ isSignedIn }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
          className="absolute right-0 top-11 z-50 min-w-[180px] rounded-2xl border border-[#312a22]/15 bg-[#fffaf2] p-2 shadow-[0_8px_24px_rgba(68,49,31,0.12)]"
        >
          <Link
            href="/roadmap"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm text-[#1d1a17] transition hover:bg-[#f4efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]"
          >
            My content
          </Link>
          {isSignedIn ? (
            <SignOutButton>
              <button
                type="button"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm text-[#1d1a17] transition hover:bg-[#f4efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]"
              >
                Logout
              </button>
            </SignOutButton>
          ) : (
            <Link
              href="/sign-in"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm text-[#1d1a17] transition hover:bg-[#f4efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
