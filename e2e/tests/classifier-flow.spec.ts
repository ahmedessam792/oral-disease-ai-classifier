import { expect, test } from "@playwright/test";
import { uploadPayload } from "../helpers/image";
import { classifierAlert } from "../helpers/locators";
import { chooseFile } from "../helpers/upload";

test.describe("classifier happy path (mock mode)", () => {
  test("upload → analyze → result → analyze another", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Drop an oral image here")).toBeVisible();
    await chooseFile(page);

    // Preview state
    await expect(page.getByAltText("Preview of sample.bmp")).toBeVisible();
    await expect(page.getByText("sample.bmp")).toBeVisible();

    // Analyze
    await page.getByRole("button", { name: "Analyze image" }).click();
    await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 30_000 });

    // Full result contract rendered
    await expect(page.getByText("AI classification result")).toBeVisible();
    // One confidence figure, rounded down — never a second, disagreeing value.
    await expect(page.getByText(/^\d{1,3}%$/).first()).toBeVisible();
    await expect(page.getByTestId("probability-list").getByRole("listitem")).toHaveCount(4);
    await expect(page.getByTestId("provenance")).toContainText("mock-development-model");

    // Mock results must be visibly labeled
    await expect(page.getByTestId("mock-banner")).toBeVisible();

    // Reset
    await page.getByRole("button", { name: /Analyze another/ }).click();
    await expect(page.getByText("Drop an oral image here")).toBeVisible();
    await expect(page.getByTestId("result-panel")).not.toBeVisible();
  });

  test("remove and replace an image before analyzing", async ({ page }) => {
    await page.goto("/");

    await chooseFile(page, uploadPayload("first.bmp"));
    await expect(page.getByText("first.bmp")).toBeVisible();

    await page.getByRole("button", { name: "Remove image" }).click();
    await expect(page.getByText("Drop an oral image here")).toBeVisible();

    await chooseFile(page, uploadPayload("second.bmp"));
    await expect(page.getByText("second.bmp")).toBeVisible();
  });
});

test.describe("invalid upload", () => {
  test("rejects a text file with a visible alert", async ({ page }) => {
    await page.goto("/");

    await chooseFile(page, {
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

    await chooseFile(page);
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

    await chooseFile(page);
    await page.getByRole("button", { name: "Analyze image" }).click();

    await expect(classifierAlert(page)).toContainText(
      "The classification model isn't available yet",
    );
  });
});
