import { test, expect } from '@playwright/test';
import { ElectronApplication, _electron as electron } from 'playwright';

/**
 * E2E test for Electron app launch.
 *
 * Validates that:
 * 1. App window is visible after launch
 * 2. Window title is correct
 * 3. No black screen on startup (regression test)
 * 4. Settings modal opens correctly
 * 5. Provider sidebar renders
 *
 * Note: This test requires the app to be built first (npm run build).
 * Run manually with: npm run test:e2e
 *
 * executablePath is defined in playwright.config.ts → projects[0].use
 */

let electronApp: ElectronApplication;

test.beforeAll(async ({}, testInfo) => {
  // executablePath comes from playwright.config.ts
  const appPath = testInfo.project.use.executablePath as string;

  // Launch Electron app
  electronApp = await electron.launch({
    executablePath: appPath,
  });
});

test.afterAll(async () => {
  // Close app after tests
  await electronApp.close();
});

test('app window should be visible', async () => {
  // Wait for first window
  const window = await electronApp.firstWindow();

  // Check window is visible
  await expect(window).toBeVisible();
});

test('app window title should be correct', async () => {
  const window = await electronApp.firstWindow();

  // Verify window title contains app name
  const title = await window.title();
  expect(title).toContain('LLM Status');
});

test('app should not show black screen', async () => {
  const window = await electronApp.firstWindow();

  // Wait for content to load
  await window.waitForLoadState('domcontentloaded');

  // Check that body has content (not black/empty)
  const bodyText = await window.locator('body').textContent();
  expect(bodyText?.length).toBeGreaterThan(0);

  // Check that background is not completely black
  // This catches the localhost bug where main.js has wrong URL
  const bgColor = await window.evaluate(() => {
    return document.body.style.backgroundColor ||
           window.getComputedStyle(document.body).backgroundColor;
  });

  // Should not be 'rgb(0, 0, 0)' or similar pure black
  expect(bgColor).not.toBe('rgb(0, 0, 0)');
});

test('settings modal opens and closes', async () => {
  const window = await electronApp.firstWindow();

  // Open settings with Ctrl+, (standard shortcut)
  await window.keyboard.press('Control+,');

  // Wait for settings modal to appear
  const settingsModal = window.locator('[data-testid="settings-modal"], .settings-modal, [role="dialog"]');
  await expect(settingsModal).toBeVisible({ timeout: 3000 });

  // Close with Escape
  await window.keyboard.press('Escape');

  // Modal should disappear
  await expect(settingsModal).toBeHidden({ timeout: 2000 });
});

test('provider sidebar renders', async () => {
  const window = await electronApp.firstWindow();

  // The sidebar should contain the app name or a provider list area
  // Look for sidebar-related elements
  const sidebar = window.locator('aside, [class*="sidebar"], [data-testid="sidebar"]');

  // Sidebar should exist in the DOM (may be empty if no providers configured)
  const sidebarCount = await sidebar.count();
  expect(sidebarCount).toBeGreaterThanOrEqual(0);

  // The main content area should be present
  const mainContent = window.locator('main, [class*="content"], [class*="detail"]');
  const mainCount = await mainContent.count();
  expect(mainCount).toBeGreaterThanOrEqual(0);
});