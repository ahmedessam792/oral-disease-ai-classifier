/**
 * Route-level navigation: the Title Settle transition, the About page, and the
 * accessibility contract around them.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { chooseFile } from "../helpers/upload";

test.describe("Title Settle route transition", () => {
  test("shows the destination title, then reveals the page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("route-curtain")).toHaveCount(0); // never on cold load

    // The curtain only lives ~700ms, so record it as it happens rather than
    // racing to catch it with a poll.
    await page.evaluate(() => {
      const win = window as unknown as { __curtain?: { seen: boolean; text: string; hidden: string | null } };
      win.__curtain = { seen: false, text: "", hidden: null };
      new MutationObserver(() => {
        const el = document.querySelector('[data-testid="route-curtain"]');
        if (el && !win.__curtain!.seen) {
          win.__curtain = {
            seen: true,
            text: el.textContent ?? "",
            hidden: el.getAttribute("aria-hidden"),
          };
        }
      }).observe(document.body, { childList: true, subtree: true });
    });

    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "About" })
      .click();

    // The destination content is there…
    await expect(page.getByRole("heading", { level: 1, name: "About Arcus" })).toBeVisible();
    await expect(page).toHaveURL(/\/about$/);

    // …and the curtain carried the destination's name, hidden from assistive tech.
    const curtain = await page.evaluate(
      () => (window as unknown as { __curtain: { seen: boolean; text: string; hidden: string | null } }).__curtain,
    );
    expect(curtain.seen).toBe(true);
    expect(curtain.text).toContain("About Arcus");
    expect(curtain.hidden).toBe("true");

    // …then it clears itself.
    await expect(page.getByTestId("route-curtain")).toHaveCount(0, { timeout: 3000 });
  });

  test("updates the document title and moves focus to the destination heading", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" }).click();

    await expect(page).toHaveTitle(/About Arcus/);
    await expect(page.getByTestId("route-announcer")).toContainText("About Arcus");

    // Focus lands on the new page's h1, not back at the top of the document.
    await expect(page.getByRole("heading", { level: 1, name: "About Arcus" })).toBeFocused();
  });

  test("marks the current page in the nav", async ({ page }) => {
    await page.goto("/about");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Analyze" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("is keyboard navigable", async ({ page }) => {
    await page.goto("/");
    const about = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" });
    await about.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: "About Arcus" })).toBeVisible();
  });

  test("does NOT run for in-page interactions (upload)", async ({ page }) => {
    await page.goto("/");
    await chooseFile(page);

    await expect(page.getByRole("button", { name: "Analyze image" })).toBeVisible();
    await expect(page.getByTestId("route-curtain")).toHaveCount(0);
  });
});

test.describe("reduced motion", () => {
  test("navigates with no curtain and no delay", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" }).click();

    // No overlay is mounted at all under reduced motion.
    await expect(page.getByTestId("route-curtain")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "About Arcus" })).toBeVisible();
  });
});

test.describe("About page", () => {
  test("renders every required section", async ({ page }) => {
    await page.goto("/about");

    await expect(page.getByRole("heading", { level: 1, name: "About Arcus" })).toBeVisible();
    for (const heading of [
      "How a reading happens",
      "The model",
      "Architecture",
      "Before you rely on a reading",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }

    await expect(page.getByText(/Educational and research use only/i).first()).toBeVisible();
    // The page must state plainly that the output is never a diagnosis.
    await expect(page.getByText(/never a diagnosis/i).first()).toBeVisible();
  });

  test("accordions expand and collapse by keyboard", async ({ page }) => {
    await page.goto("/about");
    const limits = page.getByRole("group").filter({ hasText: "What this system cannot do" });
    const summary = limits.locator("summary");

    await expect(limits).not.toHaveAttribute("open", "");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(limits).toHaveAttribute("open", "");
    await expect(page.getByText(/It only knows its training/)).toBeVisible();
  });

  test("has no serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/about");
    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(severe).toEqual([]);
  });

  test("does not overflow horizontally", async ({ page }) => {
    await page.goto("/about");
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });
});
