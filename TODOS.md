# TODOS.md

Generated: 2026-04-03
Updated: 2026-04-04

## Completed

### TODO #1: Add inline API key validation

**Completed:** v0.2.0 (2026-04-03) — Implemented in `src/utils/keyValidation.ts` with real-time format detection, provider pattern matching, and common issue detection (whitespace, Bearer prefix, quotes).

---

### TODO #2: Add sync conflict resolution

**Completed:** v0.2.0 (2026-04-03) — Implemented version-based conflict detection in `electron/ipc/sync.ts` with UI in `SyncModal.tsx` for user to choose local vs. remote version.

---

### TODO #3: Implement credentialFile import/export

**Completed:** v0.2.0 (2026-04-03) — Implemented passphrase-based AES-256-GCM encryption in `electron/ipc/credentialFile.ts` with UI in `SettingsModal.tsx` advanced tab.

---

### TODO #4: Add API usage dashboard

**Completed:** v0.2.0 (2026-04-03) — Basic implementation in `src/components/UsageDashboard.tsx` with 30-day cost tracking, per-provider breakdown, and summary cards.

---

### TODO #5: Add prompt quick-test

**Completed:** v0.2.0 (2026-04-03) — Implemented in `src/components/ProviderDetail.tsx` with textarea input, send button, response display, and latency tracking.

---

### TODO #6: Add system tray status indicator

**Completed:** v0.2.0 (2026-04-03) — Implemented in `electron/main.ts` with dynamic icon colors (green/yellow/red/gray), click-to-focus, and "Check All Providers" menu item.

---

### TODO #7: Add key expiry预警 notifications

**Completed:** v0.2.0 (2026-04-03) — Implemented expiry date input in `OnboardingFlow.tsx`, visual indicators in `ProviderDetail.tsx`, and desktop notifications in `App.tsx`.

---

### TODO #8: Add one-click copy auth curl

**Completed:** v0.2.0 (2026-04-03) — Implemented in `ProviderDetail.tsx` with provider-specific curl command generation (OpenAI, Anthropic, Google formats).

---

### TODO #9: Add environment/project grouping

**Completed:** v0.2.0 (2026-04-03) — Implemented environment selector in onboarding, filter buttons in sidebar, and environment badges in ProviderDetail header.

---

### TODO #10: Add config backup with encryption

**Completed:** v0.2.0 (2026-04-03) — Implemented in `credentialFile.ts` with scrypt key derivation + AES-256-GCM encryption for cross-machine portability.

---

## Open Items

### TODO #11: Set up CI/CD pipeline

**Completed:** v0.2.0.1 (2026-04-04) — Implemented GitHub Actions workflow in `.github/workflows/ci-cd.yml` with typecheck, test, and multi-platform builds (Windows/macOS/Linux) on every PR.

---

### TODO #12: Add audit logging for credential access

**What:** Log when credentials are accessed, modified, or exported
**Why:** Security compliance and incident investigation
**Pros:** Trace credential access, detect unauthorized access, compliance readiness
**Cons:** Adds storage overhead, needs log rotation
**Context:** Identified in SECURITY.md as a known limitation.
**Effort:** M (human: ~2 days / CC: ~30 min)
**Priority:** P2
**Depends on:** None

---

### TODO #13: Add clipboard auto-clear after copy

**Completed:** v0.2.0.2 (2026-04-04) — Implemented in `electron/ipc/clipboard.ts` with main-process IPC handler that writes to clipboard and auto-clears after 30 seconds. Includes clipboard content verification before clearing, timer cleanup on app quit, and 16 unit tests + 3 integration tests.

---

### TODO #14: Add screen recording protection (macOS)

**What:** Request screen recording permission and mask credential fields
**Why:** Prevents credentials from being captured by screen recording software
**Pros:** Additional security layer for macOS users
**Cons:** macOS-only, requires user permission grant
**Context:** Identified in SECURITY.md as a known limitation.
**Effort:** S (human: ~4 hours / CC: ~15 min)
**Priority:** P2
**Depends on:** macOS only

---

### TODO #15: Improve OAuth state token randomness

**Completed:** v0.2.0 (2026-04-03) — Replaced `Math.random()` with `crypto.randomBytes()` for OAuth state generation.
