/**
 * The report drawer and the PDF download, in a real browser — where <dialog>'s
 * focus trap, Escape handling, and the actual file download can be observed
 * (jsdom can only approximate them).
 *
 * Runs against the mock backend, so it asserts the machinery, not medicine.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { analyzeSample } from "../helpers/upload";

async function analyze(page: Page) {
  await page.goto("/");
  await analyzeSample(page);
}

test.describe("report drawer", () => {
  test("opens from the result, traps focus, and closes with Escape restoring focus", async ({
    page,
  }) => {
    await analyze(page);

    const trigger = page.getByTestId("open-report");
    await trigger.click();

    const drawer = page.getByTestId("report-drawer");
    await expect(drawer).toBeVisible();

    // A modal <dialog> makes the rest of the page inert: focus cannot escape.
    await page.keyboard.press("Tab");
    const focusInsideDrawer = await page.evaluate(() => {
      const dialog = document.querySelector('[data-testid="report-drawer"]');
      return dialog?.contains(document.activeElement) ?? false;
    });
    expect(focusInsideDrawer).toBe(true);

    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("renders the full report contents", async ({ page }) => {
    await analyze(page);
    await page.getByTestId("open-report").click();

    const drawer = page.getByTestId("report-drawer");
    await expect(drawer.getByText("Analysis report")).toBeVisible();
    await expect(drawer.getByText(/ARC-\d{14}-[A-Z0-9]{4}/)).toBeVisible();
    await expect(drawer.getByText(/not a diagnosis/i)).toBeVisible();
    await expect(drawer.getByText(/Privacy/i).first()).toBeVisible();

    // Every class is present in the distribution.
    const rows = drawer.getByTestId("probability-list").getByRole("listitem");
    await expect(rows).toHaveCount(4); // mock model has 4 classes
  });

  test("downloads a PDF with a deterministic filename", async ({ page }) => {
    await analyze(page);
    await page.getByTestId("open-report").click();

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("download-report").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^arcus-analysis-report-\d{4}-\d{2}-\d{2}-\d{4}\.pdf$/,
    );
    await expect(page.getByText("Report downloaded.")).toBeVisible();
  });

  test("generating the report makes no network request (the image is not re-uploaded)", async ({
    page,
  }) => {
    await analyze(page);
    await page.getByTestId("open-report").click();

    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") requests.push(request.url());
    });

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("download-report").click();
    await downloadPromise;

    expect(requests).toEqual([]);
  });

  test("has no serious or critical accessibility violations while open", async ({ page }) => {
    await analyze(page);
    await page.getByTestId("open-report").click();
    await expect(page.getByTestId("report-drawer")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(severe).toEqual([]);
  });

  test("does not overflow horizontally on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await analyze(page);
    await page.getByTestId("open-report").click();
    await expect(page.getByTestId("report-drawer")).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });
});
