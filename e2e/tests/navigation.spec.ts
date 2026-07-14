/**
 * Route-level navigation: the About page, the simplified homepage, and the
 * accessibility contract around navigating between them.
 *
 * There is deliberately no page-transition overlay to assert. The old "Title
 * Settle" curtain was removed; navigation now swaps content with a 180ms
 * crossfade that never covers or delays it. What still matters — and what is
 * tested here — is that the title, focus, and announcement follow the route.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { chooseFile } from "../helpers/upload";

test.describe("route navigation", () => {
  test("navigates without any overlay covering the page", async ({ page }) => {
    await page.goto("/");

    // Watch for anything full-screen mounting over the content during the
    // navigation. Nothing should: content is never occluded.
    await page.evaluate(() => {
      const win = window as unknown as { __overlay?: boolean };
      win.__overlay = false;
      new MutationObserver(() => {
        for (const el of document.querySelectorAll("body > div, body > *")) {
          const style = getComputedStyle(el as Element);
          if (style.position === "fixed" && style.inset === "0px") win.__overlay = true;
        }
      }).observe(document.body, { childList: true, subtree: true });
    });

    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "About" })
      .click();

    await expect(page.getByRole("heading", { level: 1, name: "About Arcus" })).toBeVisible();
    await expect(page).toHaveURL(/\/about$/);

    const overlay = await page.evaluate(
      () => (window as unknown as { __overlay: boolean }).__overlay,
    );
    expect(overlay, "no full-screen overlay may mount during a route change").toBe(false);
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

  test("in-page interactions (upload) do not re-run the page transition", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");
    await chooseFile(page);

    await expect(page.getByRole("button", { name: "Analyze image" })).toBeVisible();
    // <main> is keyed on the pathname: uploading must not remount it.
    await expect(main).toHaveCount(1);
  });
});

test.describe("reduced motion", () => {
  test("navigates with no animation and no delay", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "About Arcus" })).toBeVisible();
    await expect(page.locator("main")).toHaveCSS("opacity", "1");
  });
});

test.describe("homepage", () => {
  test("is simplified: no trust chips, no long explainer", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /Upload an oral image/ }),
    ).toBeVisible();

    // The three chips are gone and are not replaced by another chip row.
    for (const chip of ["In-memory only", "Never stored", "Educational use"]) {
      await expect(page.getByText(chip, { exact: true })).toHaveCount(0);
    }

    // The model is named quietly, and the analyzer is present as the main element.
    await expect(page.getByText("ResNet50V2 · 6 classes")).toBeVisible();
    await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible();
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

    // The page must still state plainly that the output is never a diagnosis.
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

test.describe("medical wording", () => {
  // The safety statement stays; the "educational" framing is gone from the UI.
  for (const path of ["/", "/about"]) {
    test(`${path} shows no "educational" wording`, async ({ page }) => {
      await page.goto(path);
      const body = await page.locator("body").innerText();
      expect(body).not.toMatch(/educational/i);
    });
  }

  test("the safety statement survives in the footer", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/not a substitute for professional medical advice/i).first(),
    ).toBeVisible();
  });
});
