"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./ModeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/rides", label: "Rides" },
];

/** Pure view: no hooks, so it can also be used as the Suspense fallback. */
function NavLinksView({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
      {links.map((link) => {
        const active =
          pathname !== null &&
          (link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-on-primary",
              active ? "bg-m-on-primary/15" : "hover:bg-m-on-primary/10",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Only this small piece reads the URL, so only it needs to be inside <Suspense>. */
function NavLinks() {
  const pathname = usePathname();
  return <NavLinksView pathname={pathname} />;
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-m-primary text-m-on-primary">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        {/* Brand + navigation */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-full text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-m-on-primary"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-m-on-primary text-m-primary">
              <Car className="h-5 w-5" />
            </span>
            Pew Pew
          </Link>

          <Suspense fallback={<NavLinksView pathname={null} />}>
            <NavLinks />
          </Suspense>
        </div>

        {/* Theme + auth */}
        <div className="flex items-center gap-2">
          <ModeToggle />

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex h-10 cursor-pointer items-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-m-on-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-on-primary"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="inline-flex h-10 cursor-pointer items-center rounded-full bg-m-on-primary px-5 text-sm font-medium text-m-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-on-primary"
              >
                Sign up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
          </Show>
        </div>
      </div>
    </header>
  );
}
