/// <reference types="vite/client" />

interface ElectronAPI {
  configRead: () => Promise<any>;
  configWrite: (config: object) => Promise<void>;
  latencyCheck: (req: { providerId: string; mode: string; credentialId: string }) => Promise<void>;
  latencyCheckAll: (req: { mode: string; concurrency: number; timeout: number }) => Promise<void>;
  onLatencyProgress: (cb: (data: any) => void) => void;
  onLatencyComplete: (cb: (data: any) => void) => void;
  onLatencyError: (cb: (data: any) => void) => void;
  syncUpload: (req: { protocol: string; config: object }) => Promise<void>;
  syncDownload: (req: { protocol: string; config: object }) => Promise<any>;
  onSyncStatus: (cb: (data: any) => void) => void;
  onSyncError: (cb: (data: any) => void) => void;
  exportPush: (req: { target: string; data: object; url?: string; apiKey?: string }) => Promise<void>;
  exportFile: (req: { target: string; data: object }) => Promise<void>;
  onExportError: (cb: (data: any) => void) => void;
  oauthStart: (req: { provider: string; state: string }) => Promise<void>;
  onOAuthCallback: (cb: (data: any) => void) => void;
  onOAuthComplete: (cb: (data: any) => void) => void;
  onOAuthError: (cb: (data: any) => void) => void;
  onNotify: (cb: (data: any) => void) => void;
  onUsageError: (cb: (data: any) => void) => void;
  onConfigMigrate: (cb: (data: any) => void) => void;
}

interface Window {
  electronAPI: ElectronAPI;
}
