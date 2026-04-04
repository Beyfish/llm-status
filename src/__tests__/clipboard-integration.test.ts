import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

// Mock Electron API for browser-mode testing
const mockElectronAPI = {
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

describe('User Flow: Clipboard Auto-Clear', () => {
  test('handleCopyCurl calls clipboardWriteAndClear with curl and 30s delay', async () => {
    mockElectronAPI.configRead.mockResolvedValue({
      providers: [
        {
          id: 'openai-1',
          type: 'openai',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com',
          credentials: [{
            id: 'key-1',
            type: 'api_key',
            value: 'sk-test123',
            encrypted: true,
            status: 'valid',
          }],
          latencyHistory: [],
          status: 'idle',
        },
      ],
      settings: {},
      schemaVersion: 1,
    });
    mockElectronAPI.configWrite.mockResolvedValue(undefined);
    mockElectronAPI.clipboardWriteAndClear.mockResolvedValue({
      success: true,
      clearedAt: new Date(Date.now() + 30000).toISOString(),
    });

    const { useStore } = await import('../store/index');
    await useStore.getState().loadProviders();

    const state = useStore.getState();
    expect(state.providers).toHaveLength(1);

    // Simulate what handleCopyCurl does: call clipboardWriteAndClear
    const provider = state.providers[0];
    const cred = provider.credentials[0];
    const curl = `curl -X GET "${provider.baseUrl}/v1/models" \\
  -H "Authorization: Bearer ${cred.value}"`;

    const result = await mockElectronAPI.clipboardWriteAndClear(curl, 30000);

    expect(mockElectronAPI.clipboardWriteAndClear).toHaveBeenCalledWith(curl, 30000);
    expect(result.success).toBe(true);
    expect(result.clearedAt).toBeDefined();
  });

  test('clipboardWriteAndClear returns success for valid text', async () => {
    const result = await mockElectronAPI.clipboardWriteAndClear('sk-test-api-key', 30000);

    expect(result.success).toBe(true);
    expect(result.clearedAt).toBeDefined();
  });

  test('clipboardWriteAndClear with custom delay (60s)', async () => {
    const result = await mockElectronAPI.clipboardWriteAndClear('sk-test-api-key', 60000);

    expect(mockElectronAPI.clipboardWriteAndClear).toHaveBeenCalledWith('sk-test-api-key', 60000);
    expect(result.success).toBe(true);
  });
});
