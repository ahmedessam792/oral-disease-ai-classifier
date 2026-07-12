import type { Locator, Page } from "@playwright/test";

/** The app's alert inside the classifier — excludes Next.js's hidden
 * route-announcer, which also carries role="alert". */
export function classifierAlert(page: Page): Locator {
  return page.locator("#classifier").getByRole("alert");
}
