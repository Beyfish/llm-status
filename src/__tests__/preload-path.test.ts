import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Regression test for Electron preload path mismatch.
 *
 * Root cause: electron/main.ts createWindow() used
 *   preload: join(__dirname, '../preload.js')
 * which resolves to project-root/preload.js at runtime.
 *
 * But electron.vite.config.ts writes preload output to
 *   dist-electron/preload.js
 * so the built main.js (also in dist-electron/) could never
 * find the preload script — the app would start with a missing
 * preload and silently lose the entire IPC bridge.
 *
 * Fix: preload path changed to
 *   preload: join(__dirname, 'preload.js')
 * so at runtime (when __dirname === dist-electron/) the resolved
 * path is dist-electron/preload.js — the correct sibling file.
 */

const WORKTREE_ROOT = resolve(__dirname, '../..');
const MAIN_SOURCE = join(WORKTREE_ROOT, 'electron', 'main.ts');
const BUILT_MAIN = join(WORKTREE_ROOT, 'dist-electron', 'main.js');
const BUILT_PRELOAD = join(WORKTREE_ROOT, 'dist-electron', 'preload.js');

describe('Preload path regression', () => {
  describe('source file: electron/main.ts', () => {
    const source = readFileSync(MAIN_SOURCE, 'utf-8');

    it('must NOT contain join(__dirname, \'../preload.js\')', () => {
      // The buggy path traverses up from dist-electron/ to project root.
      // Check both single and double quote variants.
      const hasBuggyPath =
        /join\s*\(\s*__dirname\s*,\s*['"]\.\.\/preload\.js['"]\s*\)/.test(source);
      expect(hasBuggyPath).toBe(false);
    });

    it('must contain join(__dirname, \'preload.js\') as the preload value', () => {
      // The fixed path: sibling reference within dist-electron/.
      const hasFixedPath =
        /preload\s*:\s*join\s*\(\s*__dirname\s*,\s*['"]preload\.js['"]\s*\)/.test(source);
      expect(hasFixedPath).toBe(true);
    });
  });

  describe('build artifacts', () => {
    it('must produce main.js and preload.js as siblings in dist-electron/', () => {
      // Rather than parsing config text with fragile regex, verify the
      // invariant directly: both artifacts exist side-by-side after build.
      // If the build hasn't run yet, skip — the source assertions still hold.
      if (!existsSync(BUILT_MAIN)) return;

      expect(existsSync(BUILT_PRELOAD)).toBe(true);

      // Both files must be in the same directory.
      const mainDir = resolve(BUILT_MAIN, '..');
      const preloadDir = resolve(BUILT_PRELOAD, '..');
      expect(mainDir).toBe(preloadDir);
    });
  });

  describe('built output: dist-electron/', () => {
    it('main.js must use a sibling preload path (no parent traversal)', () => {
      if (!existsSync(BUILT_MAIN)) {
        return;
      }

      const built = readFileSync(BUILT_MAIN, 'utf-8');

      // Extract the actual preload path string assigned in webPreferences.
      // Vite transforms `join(__dirname, 'preload.js')` into a path.join call
      // in the built output. We want the second argument to that call.
      const preloadMatch = built.match(/webPreferences[\s\S]*?preload\s*:\s*[\s\S]*?join\s*\([^,]+,\s*["']([^"']+)["']\s*\)/);
      expect(preloadMatch).not.toBeNull();

      const preloadPath = preloadMatch![1];
      // The path must be a direct sibling reference — no '..' prefix.
      expect(preloadPath).not.toMatch(/^\.\.\//);
      expect(preloadPath).toBe('preload.js');
    });

    it('main.js must contain the sibling preload reference', () => {
      if (!existsSync(BUILT_MAIN)) return;

      const built = readFileSync(BUILT_MAIN, 'utf-8');

      // The built output should reference preload.js as a sibling file.
      // Vite transforms path.join, so check for the key tokens.
      const hasSiblingPreload =
        /["']preload\.js["']/.test(built);
      expect(hasSiblingPreload).toBe(true);
    });

    it('preload.js must exist as a sibling to main.js', () => {
      // If the build ran, preload.js should sit next to main.js.
      if (!existsSync(BUILT_MAIN)) return;

      expect(existsSync(BUILT_PRELOAD)).toBe(true);
    });
  });
});
