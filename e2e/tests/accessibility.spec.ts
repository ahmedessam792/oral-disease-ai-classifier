import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { makeBmp } from "../helpers/image";
import { analyzeSample, chooseFile } from "../helpers/upload";

test.describe("keyboard navigation", () => {
  test("the whole analyze flow works with keyboard only", async ({ page }) => {
    await page.goto("/");

    // Tab until the Browse files button has focus, then activate with Enter.
    const browse = page.getByRole("button", { name: "Browse files" });
    await expect(browse).toBeVisible();

    await expect(async () => {
      for (let i = 0; i < 30; i++) {
        if (await browse.evaluate((el) => el === document.activeElement)) return;
        await page.keyboard.press("Tab");
      }
      throw new Error("Browse files never received focus");
    }).toPass({ timeout: 20_000 });

    await expect(browse).toBeFocused();

    // Enter opens the chooser (retried: the production build may still be
    // hydrating when the first key lands).
    await expect(async () => {
      const chooserPromise = page.waitForEvent("filechooser", { timeout: 2_000 });
      await page.keyboard.press("Enter");
      const chooser = await chooserPromise;
      await chooser.setFiles({
        name: "sample.bmp",
        mimeType: "image/bmp",
        buffer: makeBmp(),
      });
    }).toPass({ timeout: 30_000 });

    const analyze = page.getByRole("button", { name: "Analyze image" });
    await expect(analyze).toBeVisible();
    await analyze.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 30_000 });

    // The result is where the keyboard user lands — not back at <body>.
    await expect(page.getByText("AI classification result", { exact: true })).toBeFocused();
  });
});

test.describe("semantic structure", () => {
  test("landmarks, single h1, and live result region", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    // Two polite regions: the route announcer, and the analyzer's report panel.
    await expect(page.locator("[aria-live='polite']")).toHaveCount(2);
    await expect(page.getByTestId("route-announcer")).toHaveAttribute("aria-live", "polite");
  });
});

test.describe("axe scans", () => {
  test("empty state has no serious or critical violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(severe).toEqual([]);
  });

  test("result state has no serious or critical violations", async ({ page }) => {
    await page.goto("/");
    await analyzeSample(page);

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(severe).toEqual([]);
  });

  test("preview state is reachable and has no severe violations", async ({ page }) => {
    await page.goto("/");
    await chooseFile(page);
    await expect(page.getByRole("button", { name: "Analyze image" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(severe).toEqual([]);
  });
});
