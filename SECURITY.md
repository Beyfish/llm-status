# Security Model

LLM Status Manager handles sensitive API credentials. This document describes our security architecture, threat model, and known limitations.

## Credential Storage

### At Rest

Credentials are stored using **Electron safeStorage**, which delegates to the OS's native credential storage:

| Platform | Backend | Hardware Support |
|----------|---------|-----------------|
| macOS | Keychain | T2 chip / Secure Enclave (M-series) |
| Windows | DPAPI | TPM (modern hardware) |
| Linux | libsecret | GNOME Keyring / KDE Wallet |

### File Separation

Data is split into two files to minimize exposure:

| File | Contents | Encrypted? |
|------|----------|------------|
| `~/.llm-status/config.json` | Provider metadata, settings, UI state | No (contains no secrets) |
| `~/.llm-status/secrets.enc.json` | Encrypted credential values | Yes (safeStorage) |

### Cross-Machine Migration

Since safeStorage is machine-specific, we provide passphrase-based backup for migration:

- **Export:** Credentials encrypted with AES-256-GCM using a user-provided passphrase (key derived via scrypt with random 16-byte salt)
- **Import:** Decrypted with the same passphrase on the target machine
- **Safety:** Passphrase is never stored — it must be provided each time

## Cloud Sync Security

### Encryption in Transit and at Rest

Cloud sync uses **application-layer encryption** in addition to transport-layer TLS:

```
Local → AES-256-GCM (safeStorage) → Base64 → TLS → Cloud Storage
Cloud → TLS → Base64 → AES-256-GCM decrypt (safeStorage) → Local
```

This means even if cloud storage is compromised, credential data remains encrypted.

### Conflict Detection

Sync includes version tracking (`schemaVersion`, `lastModifiedAt`) to detect concurrent modifications:
- Before upload: check remote version against local
- If conflict: present user with choice (keep local vs. keep remote)
- No automatic overwriting — user always decides

### Supported Protocols

| Protocol | Auth | Transport Encryption |
|----------|------|---------------------|
| WebDAV | Basic/Digest | HTTPS (user-configured) |
| S3-compatible | AWS IAM / Access Key | HTTPS |
| Google Drive | OAuth 2.0 | HTTPS |
| OneDrive | OAuth 2.0 (MSAL) | HTTPS |

## OAuth Security

### Authorization Code Flow

OAuth uses the standard authorization code flow with:
- **State token validation** — prevents CSRF attacks
- **Random state generation** — `Math.random()` + timestamp (sufficient for desktop app context)
- **Local callback server** — listens on configurable port (default 17171)

### Token Storage

OAuth tokens (access tokens, refresh tokens) are stored with the same safeStorage encryption as API keys.

## Threat Model

### STRIDE Analysis

| Threat | Risk | Mitigation |
|--------|------|------------|
| **Spoofing** — Malicious renderer process | Medium | `sandbox: true`, `contextIsolation: true` |
| **Tampering** — Config file modification | Low | safeStorage encryption prevents meaningful tampering |
| **Repudiation** — No audit trail | Medium | Not implemented yet (see Known Limitations) |
| **Information Disclosure** — Clipboard leak | Low | Clipboard export redacts secrets |
| **Denial of Service** — Rate limiting | Low | Not applicable (local app) |
| **Elevation of Privilege** — IPC handler abuse | Medium | Preload bridge exposes only specific handlers |

### Attack Surface

| Component | Risk Level | Notes |
|-----------|-----------|-------|
| `window.open` handler | **Fixed** | Now validates http/https scheme only |
| Clipboard export | **Fixed** | Secrets redacted before copy |
| Cloud sync upload | **Fixed** | Application-layer encryption added |
| OAuth callback | **Fixed** | State token validation added |
| IPC listener registration | **Fixed** | Proper lifecycle management (setup/cleanup) |

## Security Audit Findings

### Resolved (v0.2.0)

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| 1 | **CRITICAL** | Production loads localhost renderer | Environment-aware loading (dev server vs. bundled file) |
| 2 | **HIGH** | Secrets stored plaintext on disk | Separated secrets with safeStorage encryption |
| 3 | **HIGH** | Cloud sync uploads plaintext secrets | Application-layer AES-256-GCM encryption |
| 4 | **MEDIUM** | OAuth state not validated | State token generation and validation |
| 5 | **MEDIUM** | Clipboard exports raw secrets | Automatic redaction of sensitive fields |

### Known Limitations

| # | Severity | Issue | Planned Fix |
|---|----------|-------|-------------|
| 1 | **MEDIUM** | No audit logging for credential access | v0.3.0 |
| 2 | **LOW** | Memory not zeroed after decryption | v0.3.0 (Node.js limitation) |
| 3 | **LOW** | No screen recording protection (macOS) | v0.3.0 |
| 4 | **LOW** | Clipboard not auto-cleared after copy | v0.3.0 |

## Dependency Security

### Supply Chain

- All dependencies installed via `npm install` / `bun install` with lockfile
- No postinstall scripts from untrusted packages
- Electron version pinned to 32.3.3

### Sensitive Dependencies

| Package | Purpose | Risk Assessment |
|---------|---------|----------------|
| `@aws-sdk/*` | S3 sync | Official AWS SDK, well-maintained |
| `@azure/msal-node` | OneDrive OAuth | Official Microsoft SDK |
| `googleapis` | Google Drive sync | Official Google SDK |
| `tesseract.js` | OCR smart import | Popular, but large attack surface (WASM) |
| `webdav` | WebDAV client | Well-maintained, minimal dependencies |

## Reporting Vulnerabilities

If you discover a security vulnerability, please:

1. **Do not** open a public issue
2. Email: [your-security-email@example.com]
3. Include: steps to reproduce, affected version, potential impact

We aim to respond within 48 hours and release a fix within 7 days for critical issues.
