import { defineConfig } from '@playwright/test';
import { join } from 'path';

/**
 * Playwright E2E configuration for Electron app.
 *
 * Electron apps require special handling - we test against the built app,
 * not the dev server. This ensures production behavior is validated.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Electron can't run parallel tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Electron requires single worker
  reporter: 'html',

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'electron',
      use: {
        executablePath: join(process.cwd(), 'release', 'win-unpacked', 'LLM Status.exe'),
      },
    },
  ],
});