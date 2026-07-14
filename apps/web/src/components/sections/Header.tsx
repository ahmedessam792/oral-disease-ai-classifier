"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { ROUTES } from "@/lib/routes";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-porcelain/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="rounded-sm" aria-label="Arcus — home">
          <Wordmark />
        </Link>

        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            {ROUTES.map((route) => {
              const isCurrent = pathname === route.href;
              return (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex h-11 items-center rounded-md px-4 text-sm transition-colors duration-200 ${
                      isCurrent
                        ? "bg-teal-wash font-medium text-teal-deep"
                        : "text-ink-soft hover:bg-teal-wash/60 hover:text-teal-deep"
                    }`}
                  >
                    {route.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
