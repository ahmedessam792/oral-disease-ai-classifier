import { expect, test } from "@playwright/test";
import { uploadPayload } from "../helpers/image";
import { classifierAlert } from "../helpers/locators";

test.describe("classifier happy path (mock mode)", () => {
  test("upload → analyze → result → analyze another", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Drop an oral image here")).toBeVisible();

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Browse files" }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles(uploadPayload());

    // Preview state
    await expect(page.getByAltText("Preview of sample.bmp")).toBeVisible();
    await expect(page.getByText("sample.bmp")).toBeVisible();

    // Analyze
    await page.getByRole("button", { name: "Analyze image" }).click();
    await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 15_000 });

    // Full result contract rendered
    await expect(page.getByText("AI classification result")).toBeVisible();
    await expect(page.getByText(/confidence \d+\.\d%/)).toBeVisible();
    await expect(page.getByTestId("probability-list").getByRole("listitem")).toHaveCount(4);
    await expect(page.getByText("mock-development-model · v0.0.0-mock")).toBeVisible();

    // Mock results must be visibly labeled
    await expect(page.getByTestId("mock-banner")).toBeVisible();

    // Reset
    await page.getByRole("button", { name: "Analyze another image" }).click();
    await expect(page.getByText("Drop an oral image here")).toBeVisible();
    await expect(page.getByTestId("result-panel")).not.toBeVisible();
  });

  test("remove and replace an image before analyzing", async ({ page }) => {
    await page.goto("/");

    const first = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Browse files" }).click();
    await (await first).setFiles(uploadPayload("first.bmp"));
    await expect(page.getByText("first.bmp")).toBeVisible();

    await page.getByRole("button", { name: "Remove image" }).click();
    await expect(page.getByText("Drop an oral image here")).toBeVisible();

    const second = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Browse files" }).click();
    await (await second).setFiles(uploadPayload("second.bmp"));
    await expect(page.getByText("second.bmp")).toBeVisible();
  });
});

test.describe("invalid upload", () => {
  test("rejects a text file with a visible alert", async ({ page }) => {
    await page.goto("/");

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Browse files" }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });

    await expect(classifierAlert(page)).toContainText("Unsupported file type");
    await expect(page.getByRole("button", { name: "Choose another image" })).toBeVisible();
  });
});

test.describe("backend unavailable", () => {
  test("shows the service-unreachable state when the API is down", async ({ page }) => {
    await page.route("**/api/v1/predict", (route) => route.abort("connectionrefused"));
    await page.goto("/");

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Browse files" }).click();
    await (await chooserPromise).setFiles(uploadPayload());

    await page.getByRole("button", { name: "Analyze image" }).click();
    await expect(classifierAlert(page)).toContainText("Can't reach the analysis service", {
      timeout: 40_000,
    });
    // Preview is kept so the user can retry.
    await expect(page.getByRole("button", { name: "Analyze image" })).toBeEnabled();
  });

  test("shows the missing-model state on a 503 from the API", async ({ page }) => {
    await page.route("**/api/v1/predict", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "MODEL_NOT_AVAILABLE",
            message: "The classification model is not available. Please try again later.",
          },
        }),
      }),
    );
    await page.goto("/");

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Browse files" }).click();
    await (await chooserPromise).setFiles(uploadPayload());

    await page.getByRole("button", { name: "Analyze image" }).click();
    await expect(classifierAlert(page)).toContainText(
      "The classification model isn't available yet",
    );
  });
});
