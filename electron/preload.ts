import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Config
  configRead: () => ipcRenderer.invoke('config:read'),
  configWrite: (config: object) => ipcRenderer.invoke('config:write', config),

  // Latency
  latencyCheck: (req: { providerId: string; mode: string; credentialId: string }) =>
    ipcRenderer.invoke('latency:check', req),
  latencyCheckAll: (req: { mode: string; concurrency: number; timeout: number }) =>
    ipcRenderer.invoke('latency:checkAll', req),
  onLatencyProgress: (cb: (data: any) => void) => {
    ipcRenderer.on('latency:progress', (_e, data) => cb(data));
  },
  onLatencyComplete: (cb: (data: any) => void) => {
    ipcRenderer.on('latency:complete', (_e, data) => cb(data));
  },
  onLatencyError: (cb: (data: any) => void) => {
    ipcRenderer.on('latency:error', (_e, data) => cb(data));
  },

  // Sync
  syncUpload: (req: { protocol: string; config: object }) =>
    ipcRenderer.invoke('sync:upload', req),
  syncDownload: (req: { protocol: string; config: object }) =>
    ipcRenderer.invoke('sync:download', req),
  onSyncStatus: (cb: (data: any) => void) => {
    ipcRenderer.on('sync:status', (_e, data) => cb(data));
  },
  onSyncError: (cb: (data: any) => void) => {
    ipcRenderer.on('sync:error', (_e, data) => cb(data));
  },

  // Export
  exportPush: (req: { target: string; data: object; url?: string; apiKey?: string }) =>
    ipcRenderer.invoke('export:push', req),
  exportFile: (req: { target: string; data: object }) =>
    ipcRenderer.invoke('export:file', req),
  onExportError: (cb: (data: any) => void) => {
    ipcRenderer.on('export:error', (_e, data) => cb(data));
  },

  // OAuth
  oauthStart: (req: { provider: string; state: string }) =>
    ipcRenderer.invoke('oauth:start', req),
  onOAuthCallback: (cb: (data: any) => void) => {
    ipcRenderer.on('oauth:callback', (_e, data) => cb(data));
  },
  onOAuthComplete: (cb: (data: any) => void) => {
    ipcRenderer.on('oauth:complete', (_e, data) => cb(data));
  },
  onOAuthError: (cb: (data: any) => void) => {
    ipcRenderer.on('oauth:error', (_e, data) => cb(data));
  },

  // Notifications
  onNotify: (cb: (data: any) => void) => {
    ipcRenderer.on('notify:show', (_e, data) => cb(data));
  },

  // Error channels
  onUsageError: (cb: (data: any) => void) => {
    ipcRenderer.on('usage:error', (_e, data) => cb(data));
  },

  // Webhook
  webhookSend: (config: any, message: any) => ipcRenderer.invoke('webhook:send', config, message),
  webhookTest: (config: any) => ipcRenderer.invoke('webhook:test', config),
  notifyDesktop: (message: any) => ipcRenderer.invoke('notify:desktop', message),
  notifyAll: (webhooks: any[], message: any) => ipcRenderer.invoke('notify:all', webhooks, message),

  // Usage
  usageFetch: (req: any) => ipcRenderer.invoke('usage:fetch', req),

  // Config migration
  onConfigMigrate: (cb: (data: any) => void) => {
    ipcRenderer.on('config:migrate', (_e, data) => cb(data));
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
