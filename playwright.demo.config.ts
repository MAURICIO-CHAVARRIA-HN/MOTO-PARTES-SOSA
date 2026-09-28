import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/demo",
  outputDir: "test-results-demo",
  fullyParallel: true,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "CATALOG_DEMO=true npm run dev -- -p 3001",
    url: "http://127.0.0.1:3001",
    env: {
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
    },
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
});
