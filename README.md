# LLM Status Manager

> **One dashboard for all your LLM API keys.** Know which keys are alive, which are expiring, and how much you're spending — before production breaks.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-71%20passing-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](#)

## Why

You use 5+ LLM providers. Your API keys are scattered across `.env` files, browser bookmarks, Notion notes, and chat messages. Nobody knows which key expired until production throws a 401.

LLM Status Manager gives you **one place to see every key's health** — with instant verification, encrypted storage, and cross-device sync.

## Features

### Core
- **Provider Management** — 12+ providers (OpenAI, Anthropic, Google, Azure OpenAI, AWS Bedrock, Zhipu, DashScope, Qianfan, vLLM, Ollama, LocalAI, Custom) with 6 credential types
- **One-Click Health Check** — Verify all your API keys in seconds. See which are valid, slow, or expired.
- **Per-Provider Latency** — Lightweight (HEAD) and full (API request) modes with trend charts
- **Key Expiry Tracking** — Visual indicators and desktop notifications for expiring keys

### Security
- **OS-Level Encryption** — Credentials stored via Electron `safeStorage` (Keychain on macOS, DPAPI on Windows, libsecret on Linux)
- **Encrypted Cloud Sync** — Application-layer AES-256-GCM encryption before upload
- **Passphrase-Based Backup** — Cross-machine credential migration with scrypt + AES-256-GCM
- **OAuth CSRF Protection** — State token validation on all OAuth callbacks
- **Clipboard Redaction** — Secrets automatically masked before clipboard export

### Cloud & Sync
- **Cloud Sync** — WebDAV, S3-compatible, Google Drive, OneDrive with conflict detection
- **Export** — 13 targets: One API, New API, sub2api, LiteLLM, OpenRouter, Cherry Studio, LobeChat, ChatGPT Next Web, Dify, AnythingLLM, JSON
- **Environment Grouping** — Organize providers by personal / work / production / staging

### Developer Experience
- **Smart Import** — AI-powered config parsing from JSON, text, URLs, and screenshots (OCR)
- **Prompt Quick-Test** — Send test prompts directly from ProviderDetail to verify keys work
- **One-Click Copy curl** — Generate ready-to-use curl commands for API testing
- **Inline Key Validation** — Real-time format detection and error feedback as you paste keys
- **Command Palette** — Keyboard-first navigation (Cmd+K)
- **System Tray** — Aggregate health status in OS tray (green/yellow/red)
- **Webhook Alerts** — DingTalk, WeCom, Feishu, Slack, Discord

### UI/UX
- **Sidebar-Detail Architecture** — Focused provider detail view, no duplicate information
- **Responsive Design** — Works on any window size (375px to ultrawide)
- **Dark/Light/System Themes** — Apple-quality design system with smooth transitions
- **i18n** — Chinese (zh-CN) and English (en-US) with complete coverage
- **Accessibility** — Keyboard navigation, ARIA roles, 44px touch targets, focus-visible rings

## Screenshots

> *Coming soon — app screenshots will be added after first release.*

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Electron 32 |
| **Frontend** | React 18 + TypeScript |
| **Build** | electron-vite + Vite 6 |
| **State** | Zustand |
| **Charts** | Chart.js + react-chartjs-2 |
| **Encryption** | Electron safeStorage + Node.js crypto (AES-256-GCM) |
| **i18n** | i18next + react-i18next |
| **Testing** | Vitest (71 tests) |
| **Packaging** | electron-builder |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ or [Bun](https://bun.sh/) 1.3+
- Git

### Install & Run

```bash
# Clone the repository
git clone https://github.com/Beyfish/llm-status.git
cd llm-status

# Install dependencies
npm install
# or: bun install

# Start development mode
npm run dev
```

### Build

```bash
# Windows portable executable
npm run build:win

# macOS (requires code signing)
npm run build:mac

# Linux AppImage
npm run build:linux
```

Built artifacts appear in the `release/` directory.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + F` | Focus search |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + D` | Toggle theme |
| `Escape` | Close modal/panel |

## Project Structure

```
llm-status/
├── electron/
│   ├── main.ts                 # Electron main process entry
│   ├── preload.ts              # Secure IPC bridge (contextIsolation)
│   └── ipc/
│       ├── config.ts           # Configuration persistence with encrypted secrets
│       ├── credentialFile.ts   # Passphrase-based backup/restore
│       ├── encryption.ts       # safeStorage IPC handlers
│       ├── export.ts           # Export to third-party tools
│       ├── latency.ts          # Provider latency detection
│       ├── oauth.ts            # OAuth 2.0 flow with CSRF protection
│       ├── promptTest.ts       # Live prompt testing
│       ├── sync.ts             # Cloud sync with conflict detection
│       ├── usage.ts            # Usage tracking and cost estimation
│       └── webhook.ts          # Webhook notifications
├── src/
│   ├── components/             # React components (17 total)
│   ├── store/                  # Zustand state management
│   ├── styles/                 # CSS tokens and global styles
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions (key validation, etc.)
│   ├── i18n/                   # Internationalization (zh-CN, en-US)
│   ├── __tests__/              # Test suite (71 tests)
│   ├── App.tsx                 # Root component (sidebar-detail layout)
│   └── main.tsx                # React entry point
├── public/
│   └── index.html              # HTML entry point
├── DESIGN.md                   # Design system documentation
├── TODOS.md                    # Work tracking
├── CHANGELOG.md                # Version history
└── package.json
```

## Configuration

LLM Status Manager stores data in `~/.llm-status/`:

| File | Description | Encrypted? |
|------|-------------|------------|
| `config.json` | Provider metadata, settings, UI state | No (no secrets) |
| `secrets.enc.json` | Encrypted credential values | Yes (safeStorage) |
| `usage.json` | Usage tracking data | No (non-sensitive) |

## Security Model

See [SECURITY.md](SECURITY.md) for the complete security model, including:
- Credential storage architecture
- Cloud sync encryption
- Threat model
- Audit findings

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing guidelines, and PR workflow.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system diagrams, IPC communication, and data flow.

## License

MIT — see [LICENSE](LICENSE) for details.
