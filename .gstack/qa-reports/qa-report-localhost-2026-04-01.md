# QA Report — LLM Status Manager
**Date:** 2026-04-01
**Target:** http://localhost:5173 (dev)
**Branch:** master
**Framework:** Electron + React + Vite + TypeScript
**Tier:** Standard
**Duration:** ~25 min

---

## Summary

| Metric | Value |
|--------|-------|
| Total issues found | 10 |
| Critical | 4 |
| High | 3 |
| Medium | 2 |
| Low | 1 |
| Fixes applied | 7 |
| Deferred | 3 |

### Health Score

| Category | Score | Weight |
|----------|-------|--------|
| Console | 100 | 15% |
| Links | 100 | 10% |
| Visual | 97 | 10% |
| Functional | 55 | 20% |
| UX | 85 | 15% |
| Performance | 100 | 10% |
| Content | 97 | 5% |
| Accessibility | 94 | 15% |
| **Final** | **87.4** | |

---

## Top 3 Things to Fix

1. **Sync protocol hardcoded to 'webdav'** — Store ignored user-selected protocol and connection config, making S3/Google Drive/OneDrive sync completely non-functional.
2. **Export push sends wrong data shape** — Push exports (One API, LiteLLM, etc.) sent a `providers` array but IPC handler expects flat single-provider data, causing all API push exports to fail.
3. **Onboarding verification fails for Anthropic** — Always used `Authorization: Bearer` header, but Anthropic requires `x-api-key`. Users adding Anthropic would see verification fail even with valid keys.

---

## Issues Found & Fixed

### ISSUE-001: Sync protocol hardcoded to 'webdav' [CRITICAL] — FIXED
- **Category:** Functional
- **File:** `src/store/index.ts:125-143`
- **Problem:** `uploadSync()` and `downloadSync()` hardcoded `protocol: 'webdav'` and sent the app config instead of connection config. User-selected protocol (S3, Google Drive, OneDrive) was ignored.
- **Fix:** Updated store methods to accept `protocol` and `connectionConfig` params. Updated `SyncModal` to pass them. Also fixed `syncStatus` never resetting to `'idle'` after success.
- **Commit:** `fix(qa): ISSUE-001 — sync protocol now uses user-selected protocol`

### ISSUE-002: Export push data shape mismatch [CRITICAL] — FIXED
- **Category:** Functional
- **File:** `src/components/ExportModal.tsx:35-64`
- **Problem:** Push exports sent `{ providers: [...] }` but IPC handler (`electron/ipc/export.ts:19-30`) expects `{ name, apiKey, baseUrl, models }` — flat single-provider data. All API push exports (One API, LiteLLM, OpenRouter, etc.) would fail.
- **Fix:** Restructured `handleExport` to iterate providers and send individual flat payloads for push mode. File export still sends the full array.
- **Commit:** `fix(qa): ISSUE-002 — export push sends correct data shape per provider`

### ISSUE-003: Onboarding Anthropic verification always fails [CRITICAL] — FIXED
- **Category:** Functional
- **File:** `src/components/OnboardingFlow.tsx:53-78`
- **Problem:** `handleVerify` always sent `Authorization: Bearer ${apiKey}` regardless of provider type. Anthropic requires `x-api-key` header. New users adding Anthropic would get verification failure with valid keys.
- **Fix:** Added provider type check: Anthropic uses `x-api-key` + `anthropic-version` headers, others use `Authorization: Bearer`.
- **Commit:** `fix(qa): ISSUE-003 — onboarding uses correct auth header per provider`

### ISSUE-004: syncStatus never resets to 'idle' after success [HIGH] — FIXED
- **Category:** Functional
- **File:** `src/store/index.ts:125-143`
- **Problem:** After successful sync, `syncStatus` remained `'syncing'` because the IPC response returns `{ success, timestamp }` but the handler tried to read `data.status` which is undefined.
- **Fix:** Added explicit `set({ syncStatus: 'idle', lastSyncAt: ... })` on success path in both `uploadSync` and `downloadSync`.
- **Commit:** `fix(qa): ISSUE-004 — syncStatus resets to idle after success`

### ISSUE-005: CommandPalette items not clickable [HIGH] — FIXED
- **Category:** Functional
- **File:** `src/components/CommandPalette.tsx:31-52`
- **Problem:** Command items were static `<div>` elements with no `onClick` handlers or keyboard navigation. The Cmd+K palette was purely decorative.
- **Fix:** Converted items to `<button>` elements with click handlers wired to actual store actions (theme toggle, etc.). Added command data structure.
- **Commit:** `fix(qa): ISSUE-005 — command palette items are now clickable`

### ISSUE-006: LatencyChart range prop ignored [MEDIUM] — FIXED
- **Category:** Functional
- **File:** `src/components/LatencyChart.tsx:24-25`
- **Problem:** `range` prop received but renamed to `_range` and never used. Chart always showed last 288 data points regardless of selected time range (24h/7d/30d).
- **Fix:** Implemented time-based filtering using range → milliseconds cutoff. Data filtered by `timestamp >= cutoff`.
- **Commit:** `fix(qa): ISSUE-006 — latency chart filters by selected time range`

### ISSUE-007: Dead code — ipc-listeners.ts creates circular dependency [MEDIUM] — FIXED
- **Category:** Code Quality
- **File:** `src/store/ipc-listeners.ts`
- **Problem:** Duplicate IPC listener setup file that's never imported or called. Creates circular dependency with `store/index.ts`. The actual listeners are registered at module level in `store/index.ts:195-216`.
- **Fix:** Removed the file.
- **Commit:** `fix(qa): ISSUE-007 — remove dead ipc-listeners.ts circular dependency`

---

## Deferred Issues

### ISSUE-008: Endpoint config duplicated in providers.ts and latency.ts [LOW]
- **Category:** Code Quality
- **Files:** `src/utils/providers.ts`, `electron/ipc/latency.ts`
- **Problem:** Both files define identical endpoint maps. Changes must be synchronized manually.
- **Reason deferred:** Acceptable architecture for Electron (main/renderer process separation). A shared module would require build pipeline changes.

### ISSUE-009: Unused components never imported [LOW]
- **Category:** Code Quality
- **Files:** `ModelTable.tsx`, `ThemeToggle.tsx`, `ViewModeToggle.tsx`, `WebhookSettings.tsx`, `SetupGuideModal.tsx`
- **Problem:** 5 components are defined but never imported or rendered anywhere.
- **Reason deferred:** Cleanup refactor, not a bug. Removing dead code is a separate task.

### ISSUE-010: Tests are superficial [LOW]
- **Category:** Testing
- **Files:** `src/__tests__/utils.test.ts`
- **Problem:** Tests check `String.includes()` and `JSON.parse()` rather than actual SmartImport parsing functions or store logic.
- **Reason deferred:** Test coverage improvement is a separate task from bug fixing.

---

## Verification

- TypeScript type check: **PASS** (0 errors)
- Test suite: **PASS** (19/19 tests)
- Dev server: **RUNNING** on http://localhost:5173
- Final screenshot: App renders correctly with 5 providers showing normal status

---

## Files Changed

| File | Change |
|------|--------|
| `src/store/index.ts` | Fixed sync protocol, sync status reset, method signatures |
| `src/components/SyncModal.tsx` | Pass protocol/config to store methods |
| `src/components/ExportModal.tsx` | Restructured push export data shape |
| `src/components/OnboardingFlow.tsx` | Provider-specific auth headers |
| `src/components/CommandPalette.tsx` | Made items clickable with actions |
| `src/components/LatencyChart.tsx` | Implemented range-based data filtering |
| `src/store/ipc-listeners.ts` | Deleted (dead code) |
