/** Route-level destinations. Each one gets the Title Settle transition and a
 * document title; nothing else in the app does. */
export interface RouteMeta {
  href: string;
  /** Nav label. */
  label: string;
  /** The large title shown by the transition, which then settles into the h1. */
  title: string;
  /** <title> for the document. */
  documentTitle: string;
}

export const ROUTES: RouteMeta[] = [
  {
    href: "/",
    label: "Analyze",
    title: "Analyze",
    documentTitle: "Arcus — AI oral image classification",
  },
  {
    href: "/about",
    label: "About",
    title: "About Arcus",
    documentTitle: "About Arcus — how the model and the system work",
  },
];

export function routeFor(pathname: string): RouteMeta {
  return ROUTES.find((route) => route.href === pathname) ?? ROUTES[0];
}
