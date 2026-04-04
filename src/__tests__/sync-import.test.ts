import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Regression test for Electron main-process WebDAV ESM/CJS startup crash.
 *
 * Root cause (fixed): electron/ipc/sync.ts had a top-level
 *   import { createClient } from 'webdav'
 * which bundled into dist-electron/main.js as require('webdav').
 * Since webdav v5.3.0 is ESM-only (type: module), the CommonJS
 * Electron main process crashed at startup.
 *
 * Fix: webdav is now dynamically imported at call-site via
 *   const { createClient } = await import('webdav')
 * so the built output must NOT contain a top-level require('webdav').
 */

const WORKTREE_ROOT = resolve(__dirname, '../..');
const BUILT_MAIN = join(WORKTREE_ROOT, 'dist-electron', 'main.js');
const SYNC_SOURCE = join(WORKTREE_ROOT, 'electron', 'ipc', 'sync.ts');

describe('WebDAV ESM/CJS crash regression', () => {
  describe('source file: electron/ipc/sync.ts', () => {
    it('must NOT have a top-level static import from "webdav" (single or multi-line)', () => {
      const source = readFileSync(SYNC_SOURCE, 'utf-8');

      // Strip all dynamic import('webdav') calls first — those are the fix, not the bug.
      // This prevents false positives from the legitimate lazy-loader pattern.
      const withoutDynamicImports = source.replace(
        /import\s*\(\s*['"]webdav['"]\s*\)/g,
        ''
      );

      // Now check: no remaining content should match `from 'webdav'` or `from "webdav"`.
      // This catches multi-line imports like:
      //   import {
      //     createClient
      //   } from 'webdav';
      // because `from 'webdav'` still appears in the text regardless of line breaks.
      const hasStaticWebdavImport = /from\s+['"]webdav['"]/.test(withoutDynamicImports);
      expect(hasStaticWebdavImport).toBe(false);
    });

    it('must use dynamic import() for webdav', () => {
      const source = readFileSync(SYNC_SOURCE, 'utf-8');
      expect(source).toMatch(/import\s*\(\s*['"]webdav['"]\s*\)/);
    });

    it('must implement a cached lazy-loader (not raw import() at every call-site)', () => {
      // Verify the fix uses a caching pattern, not just scattered await import() calls.
      // This ensures the lazy-loader is efficient (loads webdav once, reuses).
      const source = readFileSync(SYNC_SOURCE, 'utf-8');

      // Check for a cached variable pattern: something like `let _webdavCreateClient` or similar
      const hasCacheVariable = /let\s+_?\w*[Ww]ebdav\w*\s*[:=]/.test(source);
      expect(hasCacheVariable).toBe(true);

      // Check that the cache is populated from the dynamic import
      const hasCacheAssignment = /await\s+import\s*\(\s*['"]webdav['"]\s*\)/.test(source);
      expect(hasCacheAssignment).toBe(true);
    });
  });

  describe('built output: dist-electron/main.js', () => {
    it('must NOT contain any require("webdav") or require(\'webdav\')', () => {
      if (!existsSync(BUILT_MAIN)) {
        // Built output not available — skip gracefully.
        // The build verification step will catch this separately.
        return;
      }

      const built = readFileSync(BUILT_MAIN, 'utf-8');

      // Check full content (not line-by-line) for any require('webdav') pattern.
      // This catches minified output where everything is on one line.
      const hasRequireWebdav = /require\s*\(\s*["']webdav["']\s*\)/.test(built);
      expect(hasRequireWebdav).toBe(false);
    });

    it('must contain a dynamic import pattern for webdav (proves the fix shipped)', () => {
      if (!existsSync(BUILT_MAIN)) return;

      const built = readFileSync(BUILT_MAIN, 'utf-8');

      // The built output should contain a dynamic import for webdav, proving the
      // lazy-loader pattern made it into the bundle. Vite transforms import() into
      // various patterns depending on config — check for the most common ones.
      const hasDynamicWebdavImport =
        /import\s*\(\s*["']webdav["']\s*\)/.test(built) ||
        /__vite_ssr_dynamic_import__\s*\(\s*["']webdav["']\s*\)/.test(built) ||
        /await\s+import\s*\(\s*["']webdav["']\s*\)/.test(built);

      expect(hasDynamicWebdavImport).toBe(true);
    });
  });
});
