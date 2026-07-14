"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { routeFor } from "@/lib/routes";

/**
 * Route-level plumbing: document title, focus, and the screen-reader
 * announcement. Plus a 180ms crossfade — that is the whole transition.
 *
 * There used to be a full-screen curtain here that wiped in, held the
 * destination's name, and wiped out (~640ms). It was page-load choreography in
 * front of a user who came to upload an image, so it is gone. What remains
 * never covers content and never delays navigation.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const route = routeFor(pathname);

  // Derived during render (React's supported "adjust state when props change"
  // pattern), not in an effect. Seeded with the current path, so a cold load is
  // never treated as a navigation.
  const [renderedPath, setRenderedPath] = useState(pathname);
  const [navigated, setNavigated] = useState(false);

  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setNavigated(true);
  }

  // Title + focus are external syncs, which is exactly what effects are for.
  useEffect(() => {
    document.title = route.documentTitle;

    // Only after a real navigation. On a cold load the heading is already where
    // the user is, and focusing it just paints a ring around the h1 for nothing.
    if (!navigated) return;
    const frame = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, route.documentTitle, navigated]);

  return (
    <>
      <p aria-live="polite" className="sr-only" data-testid="route-announcer">
        {`${route.title}. Page loaded.`}
      </p>

      {/* flex column so a short page (the analyzer) can center itself in the
          viewport instead of leaving a dead band above the footer. */}
      <main key={pathname} className="page-enter flex flex-1 flex-col">
        {children}
      </main>
    </>
  );
}
