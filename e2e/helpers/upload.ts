import { expect, type Page } from "@playwright/test";
import { uploadPayload } from "./image";

/** What a Playwright file chooser accepts. */
export type UploadFile =
  | string
  | { name: string; mimeType: string; buffer: Buffer };

/**
 * Click "Browse files" and hand the chooser a file.
 *
 * The click is retried until the file chooser actually opens. On a production
 * build the button exists in the server-rendered HTML before React has
 * hydrated, so a click that lands in that window hits no handler and the
 * chooser never appears — the test would then hang until timeout. Retrying is
 * the honest fix: it waits for the app to become interactive rather than
 * sleeping for an arbitrary duration.
 */
export async function chooseFile(
  page: Page,
  files: UploadFile = uploadPayload(),
): Promise<void> {
  const browse = page.getByRole("button", { name: "Browse files" });
  await expect(browse).toBeVisible();

  await expect(async () => {
    const chooserPromise = page.waitForEvent("filechooser", { timeout: 2_000 });
    await browse.click();
    const chooser = await chooserPromise;
    await chooser.setFiles(files);
  }).toPass({ timeout: 30_000 });
}

/** Upload a valid image and run the analysis, landing on the result panel. */
export async function analyzeSample(page: Page, name = "sample.bmp"): Promise<void> {
  await chooseFile(page, uploadPayload(name));
  const analyze = page.getByRole("button", { name: "Analyze image" });
  await expect(analyze).toBeVisible();
  await analyze.click();
  await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 30_000 });
}
