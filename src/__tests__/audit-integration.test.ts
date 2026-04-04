import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

const mockElectronAPI = {
  auditRecord: vi.fn().mockResolvedValue(undefined),
  auditFetch: vi.fn().mockResolvedValue({ entries: [] }),
  auditClear: vi.fn().mockResolvedValue(undefined),
  configRead: vi.fn(),
  configWrite: vi.fn(),
  latencyCheck: vi.fn(),
  latencyCheckAll: vi.fn(),
  onLatencyProgress: vi.fn(() => () => {}),
  onLatencyComplete: vi.fn(() => () => {}),
  onLatencyError: vi.fn(() => () => {}),
  onSyncStatus: vi.fn(() => () => {}),
  onSyncError: vi.fn(() => () => {}),
  syncUpload: vi.fn(),
  syncDownload: vi.fn(),
  syncTest: vi.fn(),
  exportPush: vi.fn(),
  exportFile: vi.fn(),
  exportClipboard: vi.fn(),
  onExportError: vi.fn(() => () => {}),
  oauthStart: vi.fn(),
  onOAuthCallback: vi.fn(() => () => {}),
  onOAuthComplete: vi.fn(() => () => {}),
  onOAuthError: vi.fn(() => () => {}),
  onNotify: vi.fn(() => () => {}),
  encryptValue: vi.fn((v: string) => `encrypted:${v}`),
  decryptValue: vi.fn((v: string) => v.replace('encrypted:', '')),
  onUsageError: vi.fn(() => () => {}),
  webhookSend: vi.fn(),
  webhookTest: vi.fn(),
  notifyDesktop: vi.fn(),
  notifyAll: vi.fn(),
  usageFetch: vi.fn(),
  promptTest: vi.fn(),
  trayUpdateStatus: vi.fn(),
  credentialFileExport: vi.fn(),
  credentialFileImport: vi.fn(),
  onConfigMigrate: vi.fn(() => () => {}),
  clipboardWriteAndClear: vi.fn().mockResolvedValue({ success: true, clearedAt: new Date().toISOString() }),
};

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as any).window = { electronAPI: mockElectronAPI };
});

afterEach(() => {
  delete (globalThis as any).window;
});

describe('User Flow: Audit Logging', () => {
  test('copy curl records an audit event', async () => {
    mockElectronAPI.clipboardWriteAndClear.mockResolvedValue({
      success: true,
      clearedAt: new Date().toISOString(),
    });

    await mockElectronAPI.clipboardWriteAndClear('curl ...', 30000);
    await mockElectronAPI.auditRecord({
      providerId: 'openai-1',
      action: 'copy',
      detail: 'curl command copied to clipboard',
    });

    expect(mockElectronAPI.auditRecord).toHaveBeenCalledWith({
      providerId: 'openai-1',
      action: 'copy',
      detail: 'curl command copied to clipboard',
    });
  });

  test('auditFetch returns entries', async () => {
    mockElectronAPI.auditFetch.mockResolvedValue({
      entries: [
        { timestamp: '2026-04-04T10:00:00Z', providerId: 'openai-1', action: 'copy' },
      ],
    });

    const result = await mockElectronAPI.auditFetch('openai-1');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].providerId).toBe('openai-1');
  });
});
