import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Regression test for localhost leakage in build artifacts.
 *
 * Root cause: During development, electron/main.ts may contain
 * localhost URLs for dev server (e.g., http://localhost:5173).
 * If these leak into production build, the app shows a black screen
 * because it tries to load from localhost instead of the built files.
 *
 * Fix: Build process should replace localhost URLs with proper paths.
 * This test asserts dist-electron/main.js contains no localhost references.
 *
 * Note: This test requires a prior build step. It skips gracefully when
 * dist-electron/main.js doesn't exist. For CI, run build before tests
 * or use a separate post-build verification step.
 */

const WORKTREE_ROOT = resolve(__dirname, '../..');
const BUILT_MAIN = join(WORKTREE_ROOT, 'dist-electron', 'main.js');

let built: string | undefined;

beforeAll(() => {
  if (!existsSync(BUILT_MAIN)) {
    // Skip all tests in this suite when build artifact doesn't exist.
    // This happens in CI when tests run before build, or locally
    // when build hasn't been run yet.
    return;
  }
  built = readFileSync(BUILT_MAIN, 'utf-8');
});

describe('Build artifacts localhost check', () => {
  describe('dist-electron/main.js', () => {
    it('must NOT contain hardcoded dev server localhost URLs', () => {
      if (!built) return; // skipped (local, no build)

      // Dev server URLs cause black screen in production
      // OAuth localhost URLs (http://localhost:17171/oauth/callback) are OK
      const badLocalhostPatterns = [
        /http:\/\/localhost:5173/, // Vite dev server default port
        /http:\/\/localhost:3000/, // Alternative dev server port
        /http:\/\/127\.0\.0\.1:5173/,
        /http:\/\/127\.0\.0\.1:3000/,
      ];

      for (const pattern of badLocalhostPatterns) {
        expect(built).not.toMatch(pattern);
      }
    });

    it('must NOT contain VITE_DEV_SERVER_URL placeholder', () => {
      if (!built) return; // skipped (local, no build)

      // If electron-vite fails to replace the env variable, the literal
      // string "VITE_DEV_SERVER_URL" would remain in the bundle.
      expect(built).not.toContain('VITE_DEV_SERVER_URL');
    });

    it('must NOT contain import.meta.env.DEV unreplaced', () => {
      if (!built) return; // skipped (local, no build)

      // After build, import.meta.env.DEV should be replaced with false.
      // If it remains as a string, the dev/prod switch is broken.
      expect(built).not.toContain('import.meta.env.DEV');
    });

    it('must use proper file paths for production', () => {
      if (!built) return; // skipped (local, no build)

      // In production, should reference built files, not dev server URLs
      // Check for file:// protocol or relative file references
      const hasFileReference =
        built.includes('file://') ||
        built.includes('index.html') ||
        built.includes('dist/renderer');

      expect(hasFileReference).toBe(true);
    });
  });
});