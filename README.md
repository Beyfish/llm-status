# LLM Status

Desktop app for managing all your LLM API providers in one place.

## Features

- **Provider Management** — 12 providers (OpenAI, Anthropic, Google, Azure OpenAI, AWS Bedrock, Zhipu, DashScope, Qianfan, vLLM, Ollama, LocalAI, Custom) with 6 credential types
- **Latency Detection** — Lightweight (HEAD) and full (API request) modes with trend charts
- **Cloud Sync** — WebDAV, S3-compatible, Google Drive, OneDrive
- **Export** — 13 targets: One API, New API, sub2api, LiteLLM, OpenRouter, Cherry Studio, LobeChat, ChatGPT Next Web, Dify, AnythingLLM, JSON
- **Smart Import** — AI-powered config parsing from JSON, text, URLs
- **Webhook Alerts** — DingTalk, WeCom, Feishu, Slack, Discord
- **i18n** — Chinese (zh-CN) and English (en-US)
- **Theme** — Dark, Light, System

## Tech Stack

- Electron + React + TypeScript + Vite
- Zustand (state management)
- Chart.js (latency charts)
- Electron safeStorage (encryption)

## Quick Start

```bash
npm install
npm run dev          # Development mode
npm test             # Run tests
npm run build:win    # Build Windows installer
npm run build:mac    # Build macOS installer
npm run build:linux  # Build Linux AppImage
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Command palette |
| `Ctrl/Cmd + F` | Focus search |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + D` | Toggle theme |
| `Escape` | Close modal/panel |

## License

MIT
