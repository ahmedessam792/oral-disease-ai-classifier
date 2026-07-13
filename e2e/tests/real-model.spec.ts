/**
 * Real-model end-to-end flow — runs against a backend serving the actual
 * ResNet50V2 (MODEL_MODE=real), using a real sample image.
 *
 * Skipped by default so the standard suite stays fast and TF-free. Run with:
 *
 *   ARCUS_REAL_MODEL=1 npx playwright test tests/real-model.spec.ts
 *
 * Requires: an API with the real model on :8000 and the web app on :3000.
 * The sample image is read in place from model/samples/ and never modified.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { classifierAlert } from "../helpers/locators";

const REPO_ROOT = path.resolve(__dirname, "../..");
const SAMPLE = path.join(REPO_ROOT, "model", "samples", "Mouth_Ulcer", "366.jpg");

test.skip(
  !process.env.ARCUS_REAL_MODEL,
  "real-model e2e: set ARCUS_REAL_MODEL=1 with a real-model backend running",
);

test.beforeAll(() => {
  if (!existsSync(SAMPLE)) {
    throw new Error(`Sample image not found: ${SAMPLE}`);
  }
});

async function uploadSample(page: import("@playwright/test").Page) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Browse files" }).click();
  await (await chooser).setFiles(SAMPLE);
}

test("real model: upload → analyze → result, with no mock banner", async ({ page }) => {
  await page.goto("/");

  // The frontend is talking to a real-model backend.
  const info = await page.request.get("http://localhost:8000/api/v1/model/info");
  const body = await info.json();
  expect(body.mock).toBe(false);
  expect(body.model_name).toBe("ResNet50V2");
  expect(body.classes).toHaveLength(6);

  await uploadSample(page);
  await page.getByRole("button", { name: "Analyze image" }).click();

  await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 60_000 });
  await expect(classifierAlert(page)).toHaveCount(0);

  // The defining assertion: no mock banner in real-model mode.
  await expect(page.getByTestId("mock-banner")).toHaveCount(0);
  await expect(page.getByText(/Development mock/i)).toHaveCount(0);

  // Real metadata and a full, real distribution.
  await expect(page.getByText(/ResNet50V2 · v/)).toBeVisible();
  await expect(page.getByTestId("probability-list").getByRole("listitem")).toHaveCount(6);
  await expect(page.getByText(/confidence \d+\.\d%/)).toBeVisible();

  // The predicted class is one of the real classes.
  const predicted = await page
    .getByTestId("result-panel")
    .locator("p")
    .first()
    .textContent();
  expect(predicted).toBeTruthy();

  // The disclaimer survives on a real result.
  await expect(
    page.getByText(/not a substitute for professional medical advice/i).first(),
  ).toBeVisible();
});

test("real model: long class labels render without breaking the layout", async ({ page }) => {
  await page.goto("/");
  await uploadSample(page);
  await page.getByRole("button", { name: "Analyze image" }).click();
  await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 60_000 });

  const rows = page.getByTestId("probability-list").getByRole("listitem");
  await expect(rows).toHaveCount(6);

  // Every real label — including "Tooth Discoloration" and "Mouth Ulcer" — is
  // present, and nothing overflows the page horizontally.
  for (const label of [
    "Calculus",
    "Caries",
    "Gingivitis",
    "Hypodontia",
    "Mouth Ulcer",
    "Tooth Discoloration",
  ]) {
    await expect(page.getByTestId("probability-list").getByText(label, { exact: true })).toBeVisible();
  }

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflows, "page must not scroll horizontally").toBe(false);
});
