"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { routeFor } from "@/lib/routes";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * "Title Settle" — the route-level page intro.
 *
 * On a route change a porcelain panel wipes down over the page, the
 * destination's name appears large, then the panel wipes away while the title
 * scales down and rises out — settling into the real <h1> as the page fades in
 * beneath it. ~640ms total (180 wipe-in · 200 hold · 260 settle + reveal).
 *
 * Rules this component enforces:
 * - Fires on ROUTE changes only. Uploading, analyzing, opening the report
 *   drawer, and expanding an accordion never touch it — none change the path.
 * - Transform / opacity / clip-path only. No layout properties.
 * - The overlay is aria-hidden: it is decoration. Assistive tech gets a polite
 *   route announcement, and focus moves to the destination heading.
 * - prefers-reduced-motion: no overlay, no movement, and no delay to navigation.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const route = routeFor(pathname);

  // Derive the transition from the path change during render (not in an
  // effect): this is React's supported "adjust state when props change"
  // pattern and avoids a cascading re-render.
  // Seeded with the current path, so this only ever fires on a real route
  // CHANGE — never on cold load, where a curtain would just be a loading screen.
  const [renderedPath, setRenderedPath] = useState(pathname);
  const [playing, setPlaying] = useState(false);
  // True once the user has actually navigated within the app.
  const [navigated, setNavigated] = useState(false);

  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setNavigated(true);
    setPlaying(!prefersReducedMotion());
  }

  // Title + focus are external syncs, which is exactly what effects are for.
  useEffect(() => {
    document.title = route.documentTitle;

    // Move focus to the destination heading ONLY after a real navigation. On a
    // cold load the heading is already where the user is, and focusing it just
    // paints a focus ring around the h1 for no reason.
    if (!navigated) return;
    const frame = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, route.documentTitle, navigated]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setPlaying(false), 700);
    return () => window.clearTimeout(timer);
  }, [playing]);

  return (
    <>
      {playing && (
        <div
          aria-hidden="true"
          data-testid="route-curtain"
          className="route-curtain pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-porcelain"
        >
          <span className="route-title font-display text-[clamp(2.25rem,7vw,4.5rem)] font-semibold tracking-[-0.03em] text-ink">
            {route.title}
          </span>
        </div>
      )}

      {/* Route announcement for assistive tech; the overlay itself is hidden. */}
      <p aria-live="polite" className="sr-only" data-testid="route-announcer">
        {`${route.title}. Page loaded.`}
      </p>

      <main key={pathname} className={playing ? "page-enter flex-1" : "flex-1"}>
        {children}
      </main>
    </>
  );
}
