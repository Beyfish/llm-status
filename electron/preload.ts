import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Platform info (renderer-safe)
  isMac: process.platform === 'darwin',

  // Config
  configRead: () => ipcRenderer.invoke('config:read'),
  configWrite: (config: object) => ipcRenderer.invoke('config:write', config),

  // Latency
  latencyCheck: (req: { providerId: string; mode: string; credentialId: string }) =>
    ipcRenderer.invoke('latency:check', req),
  latencyCheckAll: (req: { mode: string; concurrency: number; timeout: number }) =>
    ipcRenderer.invoke('latency:checkAll', req),
  onLatencyProgress: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('latency:progress', handler);
    return () => { ipcRenderer.off('latency:progress', handler); };
  },
  onLatencyComplete: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('latency:complete', handler);
    return () => { ipcRenderer.off('latency:complete', handler); };
  },
  onLatencyError: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('latency:error', handler);
    return () => { ipcRenderer.off('latency:error', handler); };
  },

  // Sync
  syncUpload: (req: { protocol: string; config: object; data?: object }) =>
    ipcRenderer.invoke('sync:upload', req),
  syncDownload: (req: { protocol: string; config: object }) =>
    ipcRenderer.invoke('sync:download', req) as Promise<{ success: boolean; data?: any; timestamp: string }>,
  syncTest: (req: { protocol: string; config: object }) =>
    ipcRenderer.invoke('sync:test', req),
  onSyncStatus: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('sync:status', handler);
    return () => { ipcRenderer.off('sync:status', handler); };
  },
  onSyncError: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('sync:error', handler);
    return () => { ipcRenderer.off('sync:error', handler); };
  },

  // Export
  exportPush: (req: { target: string; data: object; url?: string; apiKey?: string }) =>
    ipcRenderer.invoke('export:push', req),
  exportFile: (req: { target: string; data: object }) =>
    ipcRenderer.invoke('export:file', req),
  exportClipboard: (data: object) =>
    ipcRenderer.invoke('export:clipboard', data),
  onExportError: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('export:error', handler);
    return () => { ipcRenderer.off('export:error', handler); };
  },

  // OAuth
  oauthStart: (req: { provider: string; state: string }) =>
    ipcRenderer.invoke('oauth:start', req),
  onOAuthCallback: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('oauth:callback', handler);
    return () => { ipcRenderer.off('oauth:callback', handler); };
  },
  onOAuthComplete: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('oauth:complete', handler);
    return () => { ipcRenderer.off('oauth:complete', handler); };
  },
  onOAuthError: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('oauth:error', handler);
    return () => { ipcRenderer.off('oauth:error', handler); };
  },

  // Notifications
  onNotify: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('notify:show', handler);
    return () => { ipcRenderer.off('notify:show', handler); };
  },

  // Encryption
  encryptValue: (value: string) => ipcRenderer.invoke('encrypt:value', value),
  decryptValue: (encrypted: string) => ipcRenderer.invoke('decrypt:value', encrypted),

  // Error channels
  onUsageError: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('usage:error', handler);
    return () => { ipcRenderer.off('usage:error', handler); };
  },

  // Webhook
  webhookSend: (config: unknown, message: unknown) => ipcRenderer.invoke('webhook:send', config, message),
  webhookTest: (config: unknown) => ipcRenderer.invoke('webhook:test', config),
  notifyDesktop: (message: unknown) => ipcRenderer.invoke('notify:desktop', message),
  notifyAll: (webhooks: unknown[], message: unknown) => ipcRenderer.invoke('notify:all', webhooks, message),

  // Prompt test
  promptTest: (req: { providerId: string; credentialId: string; prompt: string; maxTokens: number }) =>
    ipcRenderer.invoke('prompt:test', req),

  // Tray
  trayUpdateStatus: (status: 'green' | 'yellow' | 'red' | 'gray') =>
    ipcRenderer.invoke('tray:updateStatus', status),

  // Credential file import/export
  credentialFileExport: (config: Record<string, unknown>, passphrase: string) =>
    ipcRenderer.invoke('credentialFile:export', config, passphrase),
  credentialFileImport: (passphrase: string) =>
    ipcRenderer.invoke('credentialFile:import', passphrase),

  // Usage
  usageFetch: (req: unknown) => ipcRenderer.invoke('usage:fetch', req),

  // Clipboard auto-clear
  clipboardWriteAndClear: (text: string, delayMs?: number) =>
    ipcRenderer.invoke('clipboard:writeAndClear', text, delayMs),

  // Audit logging
  auditRecord: (entry: { providerId: string; action: string; detail?: string }) =>
    ipcRenderer.invoke('audit:record', entry),
  auditFetch: (providerId?: string) =>
    ipcRenderer.invoke('audit:fetch', providerId),
  auditClear: () => ipcRenderer.invoke('audit:clear'),

  // Screen recording protection
  setScreenProtection: (enabled: boolean) =>
    ipcRenderer.invoke('screenProtection:set', enabled),

  // Config migration
  onConfigMigrate: (cb: (data: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on('config:migrate', handler);
    return () => { ipcRenderer.off('config:migrate', handler); };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
