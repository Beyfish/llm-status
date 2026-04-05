# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0.7] - 2026-04-05

### Changed
- Release notes generation now prefers the explicit version argument and no longer mistakes branch names like `master` for a release version

## [0.2.0.0] - 2026-04-03

### Added
- You can now see all your API key statuses at a glance with the redesigned sidebar-detail layout
- You can now verify all your API keys in one click with real-time per-provider progress
- You can now track when API keys are about to expire, with visual indicators and desktop notifications
- You can now organize providers by environment (personal, work, production, staging)
- You can now see aggregate provider health in your system tray (green/yellow/red)
- You can now test API keys with live prompts directly from the provider detail view
- You can now generate ready-to-use curl commands for any provider with one click
- You can now validate API key formats in real-time as you paste them
- You can now back up and restore all credentials with passphrase-based encryption
- You can now track API usage and estimated costs over the last 30 days
- You can now resolve cloud sync conflicts by choosing which version to keep
- Full Chinese (zh-CN) and English (en-US) translations for all new features
- DESIGN.md design system documentation
- 71 automated tests (up from 2) — later migrated to Vitest, now 84 tests

### Fixed
- Production app no longer loads localhost renderer — now uses bundled files
- API keys are now encrypted separately from config using OS-level safeStorage
- Cloud sync now encrypts data at the application layer before upload
- OAuth flows now validate state tokens to prevent CSRF attacks
- Clipboard export now redacts secrets instead of copying raw values
- IPC listeners now clean up properly on HMR reload (no more accumulation)
- Modal close buttons now meet 44px minimum touch target size
- Onboarding now uses consistent CSS variables instead of hardcoded pixel values
- App now adapts to mobile viewports (375px+) with responsive breakpoints
- Keyboard navigation now works on all interactive elements (Enter/Space support)
- Settings tabs now have proper ARIA roles for screen readers

## [0.2.0.2] - 2026-04-04

### Added
- You can now protect credentials from screen capture on macOS with the screen recording protection toggle
- Audit log tab in Settings to track all credential access events (view, copy, export, modify)

### Changed
- Test framework now excludes nested worktree and submodule directories to prevent false failures

## [0.2.0.1] - 2026-04-04

### Added
- You can now auto-clear the clipboard 30 seconds after copying credentials — no more accidental key leaks from clipboard history

### Fixed
- Electron main process no longer crashes on startup when WebDAV (ESM-only) is loaded — now uses dynamic import instead of static require
- Preload script path corrected so the IPC bridge works reliably in packaged builds
- Onboarding flow now advances to the credential type screen after selecting a provider (was stuck on provider selection)
- Local builds no longer attempt GitHub publishing by default — use `npm run publish:*` for releases
- Windows Chromium startup log noise suppressed (configurable via `LLM_STATUS_VERBOSE_CHROMIUM_LOGS=1`)
- Missing `@electron-toolkit/utils` dependency declared explicitly in package.json

### Changed
- Migrated all 84 tests from `bun:test` to Vitest — now runs under a single test framework
- Added source-level regression tests for WebDAV import safety, preload path correctness, and onboarding step progression
- CI/CD pipeline now runs typecheck, tests, and multi-platform builds on every PR

## [0.1.0.0] - 2026-04-01

### Added
- Electron desktop app for managing LLM API provider statuses
- 12 provider integrations: OpenAI, Anthropic, Google, Azure OpenAI, AWS Bedrock, Zhipu, DashScope, Qianfan, vLLM, Ollama, LocalAI, Custom OpenAI-compatible
- 6 credential types: API Key, OAuth 2.0, Service Account JSON, AWS IAM, Azure Entra ID, Anthropic Setup-Token
- Latency detection with lightweight (HEAD) and full (API request) modes
- Cloud sync via WebDAV, S3-compatible, Google Drive, and OneDrive
- Export to 13 third-party tools: One API, New API, sub2api, LiteLLM, OpenRouter, Cherry Studio, LobeChat, ChatGPT Next Web, Dify, AnythingLLM, Generic JSON
- Smart Import — AI-powered config parsing from JSON, plain text, URLs, and screenshots
- Webhook alerts for DingTalk, WeCom, Feishu, Slack, and Discord
- Model comparison across providers
- Onboarding flow with step-by-step provider setup
- Command palette (Cmd+K) with keyboard-first navigation
- Dark/Light/System theme with Apple-quality design system
- i18n with zh-CN and en-US
- API usage and cost tracking
- Proxy support for restricted regions

### Fixed
- Sync protocol hardcoded to WebDAV — now uses selected protocol
- Export data shape mismatch between push and file modes
- Onboarding verification missing Anthropic auth headers
- Command palette commands not wired to actual actions
- Latency chart range filter ignored (always showed 24h)
- Dead code (ipc-listeners.ts) removed
- Export push stops on first failure without partial success reporting
