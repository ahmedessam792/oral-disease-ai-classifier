import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { uploadPayload } from "../helpers/image";

test.describe("keyboard navigation", () => {
  test("the whole analyze flow works with keyboard only", async ({ page }) => {
    await page.goto("/");

    // Tab until the Browse files button has focus, then activate with Enter.
    const browse = page.getByRole("button", { name: "Browse files" });
    for (let i = 0; i < 25; i++) {
      if (await browse.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(browse).toBeFocused();

    const chooserPromise = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");
    await (await chooserPromise).setFiles(uploadPayload());

    const analyze = page.getByRole("button", { name: "Analyze image" });
    await expect(analyze).toBeVisible();
    await analyze.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("semantic structure", () => {
  test("landmarks, single h1, and live result region", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("[aria-live='polite']")).toHaveCount(1);
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
    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Browse files" }).click();
    await (await chooserPromise).setFiles(uploadPayload());
    await page.getByRole("button", { name: "Analyze image" }).click();
    await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 15_000 });

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(severe).toEqual([]);
  });
});
