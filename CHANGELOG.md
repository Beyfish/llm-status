# Changelog

All notable changes to this project will be documented in this file.

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
