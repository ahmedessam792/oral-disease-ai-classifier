import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against the local dev stack in mock mode. Both servers are started
 * automatically (reused if already running).
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: 4,
  timeout: 60_000, // first navigation includes the dev server's cold compile
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    navigationTimeout: 45_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } } },
  ],
  webServer: [
    {
      // Windows dev machines use the project venv; CI installs into system python.
      command:
        process.platform === "win32"
          ? "cd ../apps/api && .venv\\Scripts\\python.exe -m uvicorn app.main:app --port 8000"
          : "cd ../apps/api && python -m uvicorn app.main:app --port 8000",
      url: "http://localhost:8000/health",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "cd ../apps/web && npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
