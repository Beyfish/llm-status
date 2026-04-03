# Architecture

LLM Status Manager is an Electron desktop application that monitors and manages API credentials for 12+ LLM providers.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron App                             │
│                                                                 │
│  ┌─────────────────────┐         ┌──────────────────────────┐  │
│  │   Renderer Process   │◄───────►│     Main Process         │  │
│  │   (React 18 + Vite)  │  IPC    │   (Node.js)              │  │
│  │                     │ bridge   │                          │  │
│  │  ┌───────────────┐  │preload   │  ┌────────────────────┐ │  │
│  │  │ App.tsx        │  │.ts       │  │ IPC Handlers       │ │  │
│  │  │ (sidebar-      │  │context   │  │ (10 modules)       │ │  │
│  │  │  detail)       │  │isolation │  │                    │ │  │
│  │  └───────┬───────┘  │          │  │  config.ts         │ │  │
│  │          │          │          │  │  encryption.ts     │ │  │
│  │  ┌───────▼───────┐  │          │  │  credentialFile.ts │ │  │
│  │  │ Zustand Store │  │          │  │  latency.ts        │ │  │
│  │  │ (state mgmt)  │◄─┼──────────┼─►│  sync.ts           │ │  │
│  │  └───────┬───────┘  │          │  │  oauth.ts          │ │  │
│  │          │          │          │  │  export.ts         │ │  │
│  │  ┌───────▼───────┐  │          │  │  promptTest.ts     │ │  │
│  │  │ 17 Components │  │          │  │  usage.ts          │ │  │
│  │  │ (cards, modals│  │          │  │  webhook.ts        │ │  │
│  │  │  detail, etc) │  │          │  └────────┬───────────┘ │  │
│  │  └───────────────┘  │          │           │             │  │
│  └─────────────────────┘          └───────────┼─────────────┘  │
│                                               │                │
│                                    ┌──────────▼───────────┐    │
│                                    │   OS-Level Storage   │    │
│                                    │                      │    │
│                                    │  safeStorage:        │    │
│                                    │  - Keychain (macOS)  │    │
│                                    │  - DPAPI (Windows)   │    │
│                                    │  - libsecret (Linux) │    │
│                                    └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
   ┌──────────┐                    ┌──────────────────┐
   │  Cloud   │                    │  Local Files     │
   │  Sync    │                    │  ~/.llm-status/  │
   │          │                    │                  │
   │ WebDAV   │                    │ config.json      │
   │ S3       │                    │ secrets.enc.json │
   │ GDrive   │                    │ usage.json       │
   │ OneDrive │                    └──────────────────┘
   └──────────┘
```

## Process Architecture

### Main Process (`electron/main.ts`)

The main process is responsible for:
- Creating and managing the BrowserWindow
- Registering all IPC handlers (10 modules)
- System tray management (health status indicator)
- Application lifecycle (ready, window-all-closed, activate)

**Security configuration:**
```
sandbox: true
contextIsolation: true
nodeIntegration: false
```

### Preload Script (`electron/preload.ts`)

The preload script creates a secure bridge between the renderer and main process using `contextBridge.exposeInMainWorld`. It exposes only the specific IPC channels the renderer needs — no arbitrary `ipcRenderer.invoke` access.

**Exposed API surface:** 30+ methods across config, latency, sync, export, OAuth, encryption, usage, webhook, prompt testing, and tray management.

### Renderer Process (`src/`)

The renderer is a React 18 SPA built with Vite. Key architectural decisions:

#### State Management: Zustand

All application state lives in a single Zustand store (`src/store/index.ts`). The store:
- Loads/saves provider configuration via IPC
- Tracks latency status and results per provider
- Manages sync state, export state, and usage data
- Provides UI state (theme, search, modals, command palette)

**IPC listeners** (`src/store/ipc-listeners.ts`) are set up on app mount and cleaned up on unmount, preventing HMR accumulation.

#### Component Architecture

```
App.tsx (root)
├── Header (search, language, theme, actions)
├── Sidebar (provider list + status + environment filter)
├── Main Content
│   ├── Empty State (no providers)
│   ├── Empty State (no selection)
│   └── ProviderDetail (selected provider)
│       ├── Header (name, status, environment badge)
│       ├── Latency Section (metrics + check button)
│       ├── Models Section (available models table)
│       ├── Credentials Section (credential list + copy curl)
│       └── Prompt Test Section (quick test)
└── Modals (overlays)
    ├── LatencyModal (bulk check with progress)
    ├── SettingsModal (tabs: general, detection, appearance, advanced)
    ├── SmartImportModal (AI-powered import)
    ├── SyncModal (cloud sync with conflict resolution)
    ├── ExportModal (third-party export)
    ├── OnboardingFlow (first-run setup)
    └── CommandPalette (Cmd+K navigation)
```

## IPC Communication

### Data Flow Diagram

```
User Action (Renderer)
    │
    ▼
Zustand Store Method
    │
    ▼
window.electronAPI.xxx()  (preload bridge)
    │
    ▼
ipcMain.handle()  (main process)
    │
    ├──→ safeStorage.encrypt/decrypt  (OS keychain)
    ├──→ fs.readFileSync/writeFileSync  (local files)
    ├──→ axios requests  (external APIs)
    └──→ WebDAV/S3/GDrive/OneDrive clients  (cloud sync)
    │
    ▼
Response → Zustand Store → React Re-render
```

### IPC Handler Modules

| Module | Handlers | Purpose |
|--------|----------|---------|
| `config.ts` | `config:read`, `config:write` | Persist provider config with encrypted secrets |
| `encryption.ts` | `encrypt:value`, `decrypt:value` | OS-level encryption via safeStorage |
| `credentialFile.ts` | `credentialFile:export`, `credentialFile:import` | Passphrase-based backup/restore |
| `latency.ts` | `latency:check`, `latency:checkAll` | Provider latency detection |
| `sync.ts` | `sync:upload`, `sync:download`, `sync:test`, `sync:checkConflict` | Cloud sync with conflict detection |
| `export.ts` | `export:push`, `export:file`, `export:clipboard` | Export to third-party tools |
| `oauth.ts` | `oauth:start` | OAuth 2.0 authorization code flow |
| `usage.ts` | `usage:fetch`, `usage:record`, `usage:summary` | Usage tracking and cost estimation |
| `webhook.ts` | `webhook:notify`, `webhook:test` | Webhook notifications |
| `promptTest.ts` | `prompt:test` | Live prompt testing |

## Data Model

### Provider

```typescript
interface Provider {
  id: string;
  type: ProviderType;          // openai, anthropic, google, etc.
  name: string;
  baseUrl?: string;
  region?: string;
  environment?: ProviderEnvironment;  // personal, work, production, staging, custom
  credentials: Credential[];
  latencyHistory: LatencyRecord[];
  status: 'valid' | 'warning' | 'error' | 'idle';
  averageLatency?: number;
  modelCount?: number;
  checkCount?: number;
  promptCount?: number;
}
```

### Credential

```typescript
interface Credential {
  id: string;
  type: CredentialType;  // api_key, oauth, service_account, aws_iam, azure_entra, anthropic_setup
  value?: string;        // Encrypted in storage
  status: 'valid' | 'warning' | 'error' | 'unknown';
  encrypted?: boolean;
  expiresAt?: string;
  // OAuth-specific
  accessToken?: string;
  refreshToken?: string;
  // AWS-specific
  accessKey?: string;
  secretKey?: string;
  sessionToken?: string;
  // Azure-specific
  tenantId?: string;
  clientId?: string;
  // Service Account-specific
  privateKey?: string;
  clientEmail?: string;
}
```

## Security Architecture

### Secret Storage

```
┌─────────────────────────────────────────┐
│           ~/.llm-status/                │
│                                         │
│  config.json          ← No secrets     │
│  (provider metadata,  ← Safe to backup │
│   settings, UI state)                  │
│                                         │
│  secrets.enc.json     ← Encrypted      │
│  (credential values)  ← safeStorage    │
│                                         │
│  usage.json           ← Non-sensitive  │
│  (tracking data)      ← Safe to share  │
└─────────────────────────────────────────┘
```

### Cloud Sync Encryption

```
Local Config ──→ JSON.stringify ──→ encryptForSync() ──→ Upload
                                      │
                                      ├── safeStorage.encryptString()
                                      └── base64 encoding
                                                      
Remote Storage ──→ Download ──→ decryptFromSync() ──→ JSON.parse
                                    │
                                    ├── safeStorage.decryptString()
                                    └── Fallback: plaintext (backward compat)
```

### Credential Backup

For cross-machine migration (safeStorage is machine-specific):

```
Export:  Credentials ──→ scrypt(passphrase, salt) ──→ AES-256-GCM ──→ Base64 ──→ File
Import:  File ──→ Base64 decode ──→ AES-256-GCM decrypt ──→ Credentials
```

## Build Pipeline

```
Source (TypeScript + React)
    │
    ▼
electron-vite build
    ├── main.ts    → dist-electron/main.js
    ├── preload.ts → dist-electron/preload.js
    └── src/**     → dist/index.html + assets
    │
    ▼
electron-builder
    └── release/LLM Status-0.1.0.exe (portable)
```

## Design Decisions

### Why Zustand over Redux?

- Single-file store with no boilerplate
- Direct IPC integration (no middleware needed)
- Small bundle size (1KB vs 7KB for Redux)
- TypeScript-first with full type inference

### Why Sidebar-Detail over Card Grid?

The original card grid duplicated information between the sidebar and main content. The sidebar-detail architecture:
- Sidebar: orientation and switching (compact status indicators)
- Main panel: detail, action, and diagnosis
- No duplicate information — each piece of data lives in exactly one place

### Why safeStorage over custom encryption?

`safeStorage` delegates to the OS's native credential storage:
- macOS: Keychain (hardware-backed on T2/M-series)
- Windows: DPAPI (user-scoped, TPM-backed on modern hardware)
- Linux: libsecret (GNOME Keyring / KDE Wallet)

This means credentials are encrypted at rest with hardware-backed keys, and cross-machine migration is handled separately via passphrase-based backup.

### Why electron-vite over electron-forge?

- Smaller bundle size
- Faster dev server startup
- Better TypeScript integration
- Vite's HMR works seamlessly with React
