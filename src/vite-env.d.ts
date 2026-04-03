/// <reference types="vite/client" />

interface ElectronAPI {
  configRead: () => Promise<any>;
  configWrite: (config: object) => Promise<void>;
  latencyCheck: (req: { providerId: string; mode: string; credentialId: string }) => Promise<void>;
  latencyCheckAll: (req: { mode: string; concurrency: number; timeout: number }) => Promise<void>;
  onLatencyProgress: (cb: (data: any) => void) => void;
  onLatencyComplete: (cb: (data: any) => void) => void;
  onLatencyError: (cb: (data: any) => void) => void;
  syncUpload: (req: { protocol: string; config: object }) => Promise<{ success: boolean; timestamp: string; conflict?: { hasConflict: boolean; localVersion?: string; remoteVersion?: string; localModifiedAt?: string; remoteModifiedAt?: string } }>;
  syncCheckConflict: (req: { protocol: string; config: object; localVersion?: string }) => Promise<{ hasConflict: boolean; localVersion?: string; remoteVersion?: string; localModifiedAt?: string; remoteModifiedAt?: string }>;
  syncDownload: (req: { protocol: string; config: object }) => Promise<any>;
  onSyncStatus: (cb: (data: any) => void) => void;
  onSyncError: (cb: (data: any) => void) => void;
  exportPush: (req: { target: string; data: object; url?: string; apiKey?: string }) => Promise<void>;
  exportFile: (req: { target: string; data: object }) => Promise<void>;
  exportClipboard: (data: object) => Promise<void>;
  onExportError: (cb: (data: any) => void) => void;
  oauthStart: (req: { provider: string; state: string }) => Promise<void>;
  onOAuthCallback: (cb: (data: any) => void) => void;
  onOAuthComplete: (cb: (data: any) => void) => void;
  onOAuthError: (cb: (data: any) => void) => void;
  onNotify: (cb: (data: any) => void) => void;
  encryptValue: (value: string) => Promise<string>;
  decryptValue: (encrypted: string) => Promise<string>;
  onUsageError: (cb: (data: any) => void) => void;
  webhookSend: (config: unknown, message: unknown) => Promise<void>;
  webhookTest: (config: unknown) => Promise<{ success: boolean; message: string }>;
  notifyDesktop: (message: unknown) => Promise<void>;
  notifyAll: (webhooks: unknown[], message: unknown) => Promise<{ sent: number; failed: number }>;
  usageFetch: (req: unknown) => Promise<any>;
  promptTest: (req: { providerId: string; credentialId: string; prompt: string; maxTokens: number }) => Promise<{ success: boolean; response?: string; error?: string; latency?: number }>;
  trayUpdateStatus: (status: 'green' | 'yellow' | 'red' | 'gray') => Promise<void>;
  credentialFileExport: (config: Record<string, unknown>, passphrase: string) => Promise<{ success: boolean; message: string }>;
  credentialFileImport: (passphrase: string) => Promise<{ success: boolean; data?: { providers: any[]; settings?: Record<string, unknown>; mergeStrategy: string }; message: string }>;
  onConfigMigrate: (cb: (data: any) => void) => void;
}

interface Window {
  electronAPI: ElectronAPI;
}
