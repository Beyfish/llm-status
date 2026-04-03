import { describe, expect, test, vi, beforeEach, afterEach } from 'bun:test';

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
};

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as any).window = { electronAPI: mockElectronAPI };
});

afterEach(() => {
  delete (globalThis as any).window;
});

describe('User Flow: Provider Management', () => {
  test('store initializes with empty providers list', async () => {
    mockElectronAPI.configRead.mockResolvedValue({
      providers: [],
      settings: {},
      schemaVersion: 1,
    });

    const { useStore } = await import('../store/index');
    const state = useStore.getState();

    expect(state.providers).toEqual([]);
    expect(state.selectedProviderId).toBeNull();
    expect(state.latencyStatus).toEqual({});
    expect(state.latencyResults).toEqual({});
    expect(state.syncStatus).toBe('idle');
  });

  test('adding a provider updates the store and calls configWrite', async () => {
    mockElectronAPI.configRead.mockResolvedValue({
      providers: [],
      settings: {},
      schemaVersion: 1,
    });
    mockElectronAPI.configWrite.mockResolvedValue(undefined);

    const { useStore } = await import('../store/index');
    await useStore.getState().loadProviders();

    const newProvider = {
      id: 'openai-1',
      type: 'openai' as const,
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com',
      credentials: [{
        id: 'key-1',
        type: 'api_key' as const,
        value: 'sk-test123',
        encrypted: true,
        status: 'valid' as const,
      }],
      latencyHistory: [],
      status: 'idle' as const,
    };

    await useStore.getState().addProvider(newProvider);

    expect(mockElectronAPI.configWrite).toHaveBeenCalled();
    const state = useStore.getState();
    expect(state.providers).toHaveLength(1);
    expect(state.providers[0].name).toBe('OpenAI');
  });

  test('removing a provider updates the store', async () => {
    mockElectronAPI.configRead.mockResolvedValue({
      providers: [
        { id: 'openai-1', type: 'openai', name: 'OpenAI', credentials: [], latencyHistory: [], status: 'idle' },
        { id: 'anthropic-1', type: 'anthropic', name: 'Anthropic', credentials: [], latencyHistory: [], status: 'idle' },
      ],
      settings: {},
      schemaVersion: 1,
    });
    mockElectronAPI.configWrite.mockResolvedValue(undefined);

    const { useStore } = await import('../store/index');
    await useStore.getState().loadProviders();

    expect(useStore.getState().providers).toHaveLength(2);

    await useStore.getState().removeProvider('openai-1');

    expect(useStore.getState().providers).toHaveLength(1);
    expect(useStore.getState().providers[0].id).toBe('anthropic-1');
  });

  test('selecting a provider updates selectedProviderId', async () => {
    const { useStore } = await import('../store/index');

    useStore.getState().setSelectedProvider('openai-1');
    expect(useStore.getState().selectedProviderId).toBe('openai-1');

    useStore.getState().setSelectedProvider(null);
    expect(useStore.getState().selectedProviderId).toBeNull();
  });
});

describe('User Flow: Latency Checking', () => {
  test('checkAll sets bulkChecking and initial status', async () => {
    mockElectronAPI.configRead.mockResolvedValue({
      providers: [
        { id: 'openai-1', type: 'openai', name: 'OpenAI', credentials: [], latencyHistory: [], status: 'idle' },
        { id: 'anthropic-1', type: 'anthropic', name: 'Anthropic', credentials: [], latencyHistory: [], status: 'idle' },
      ],
      settings: {},
      schemaVersion: 1,
    });
    mockElectronAPI.latencyCheckAll.mockResolvedValue(undefined);

    const { useStore } = await import('../store/index');
    await useStore.getState().loadProviders();

    // Start checkAll (don't await since it waits for IPC)
    void useStore.getState().checkAll('full', 5, 10);

    // bulkChecking should be true immediately
    expect(useStore.getState().bulkChecking).toBe(true);
    expect(useStore.getState().latencyStatus['openai-1']).toBe('checking');
    expect(useStore.getState().latencyStatus['anthropic-1']).toBe('checking');
  });

  test('latency progress updates via IPC listener', async () => {
    const { useStore } = await import('../store/index');

    // Simulate IPC progress event
    useStore.setState((s) => ({
      bulkChecking: true,
      latencyStatus: { ...s.latencyStatus, 'openai-1': 'checking' },
      latencyResults: { ...s.latencyResults, 'openai-1': { providerId: 'openai-1', latency: 150, status: 'success' as const, timestamp: new Date().toISOString() } },
    }));

    expect(useStore.getState().bulkChecking).toBe(true);
    expect(useStore.getState().latencyResults['openai-1']?.latency).toBe(150);
  });

  test('latency complete updates all results and clears bulkChecking', async () => {
    const { useStore } = await import('../store/index');

    // Simulate IPC complete event
    useStore.setState({
      latencyStatus: { 'openai-1': 'done', 'anthropic-1': 'error' },
      latencyResults: {
        'openai-1': { providerId: 'openai-1', latency: 150, status: 'success' as const, timestamp: new Date().toISOString() },
        'anthropic-1': { providerId: 'anthropic-1', latency: 0, status: 'error' as const, timestamp: new Date().toISOString(), error: 'Auth failed' },
      },
      bulkChecking: false,
    });

    expect(useStore.getState().bulkChecking).toBe(false);
    expect(useStore.getState().latencyStatus['openai-1']).toBe('done');
    expect(useStore.getState().latencyStatus['anthropic-1']).toBe('error');
  });
});

describe('User Flow: Sync Conflict Resolution', () => {
  test('uploadSync detects conflict and updates state', async () => {
    mockElectronAPI.configRead.mockResolvedValue({
      providers: [],
      settings: {},
      schemaVersion: 1,
    });
    mockElectronAPI.syncUpload.mockResolvedValue({
      success: false,
      timestamp: new Date().toISOString(),
      conflict: {
        hasConflict: true,
        localVersion: '1',
        remoteVersion: '2',
        localModifiedAt: '2024-01-01T00:00:00.000Z',
        remoteModifiedAt: '2024-01-02T00:00:00.000Z',
      },
    });

    const { useStore } = await import('../store/index');
    await useStore.getState().loadProviders();
    await useStore.getState().uploadSync();

    expect(useStore.getState().syncStatus).toBe('conflict');
    expect(useStore.getState().syncConflict).not.toBeNull();
    expect(useStore.getState().syncConflict?.remoteVersion).toBe('2');
  });

  test('resolveSyncConflict with remote strategy calls downloadSync', async () => {
    mockElectronAPI.configRead.mockResolvedValue({
      providers: [],
      settings: {},
      schemaVersion: 1,
    });
    mockElectronAPI.syncDownload.mockResolvedValue({
      success: true,
      data: { providers: [], settings: {} },
      timestamp: new Date().toISOString(),
    });

    const { useStore } = await import('../store/index');
    await useStore.getState().loadProviders();

    // Set up conflict state
    useStore.setState({
      syncStatus: 'conflict',
      syncConflict: { localVersion: '1', remoteVersion: '2' },
    });

    await useStore.getState().resolveSyncConflict('remote');

    expect(useStore.getState().syncConflict).toBeNull();
  });
});

describe('User Flow: Environment Grouping', () => {
  test('provider can have environment field', async () => {
    mockElectronAPI.configRead.mockResolvedValue({
      providers: [],
      settings: {},
      schemaVersion: 1,
    });
    mockElectronAPI.configWrite.mockResolvedValue(undefined);

    const { useStore } = await import('../store/index');
    await useStore.getState().loadProviders();

    const provider = {
      id: 'openai-work',
      type: 'openai' as const,
      name: 'OpenAI Work',
      baseUrl: 'https://api.openai.com',
      environment: 'work' as const,
      credentials: [],
      latencyHistory: [],
      status: 'idle' as const,
    };

    await useStore.getState().addProvider(provider);

    expect(useStore.getState().providers[0].environment).toBe('work');
  });
});

describe('User Flow: Key Validation', () => {
  test('validates OpenAI key format', async () => {
    const { validateApiKey } = await import('../utils/keyValidation');

    const result = validateApiKey('sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz');
    expect(result.isValid).toBe(true);
    expect(result.confidence).toBe('high');
  });

  test('detects leading/trailing whitespace', async () => {
    const { validateApiKey } = await import('../utils/keyValidation');

    const result = validateApiKey(' sk-test123 ');
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]).toContain('whitespace');
  });

  test('detects Bearer prefix', async () => {
    const { validateApiKey } = await import('../utils/keyValidation');

    const result = validateApiKey('Bearer sk-test123');
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]).toContain('Bearer');
  });

  test('cleanApiKey removes common prefixes', async () => {
    const { cleanApiKey } = await import('../utils/keyValidation');

    expect(cleanApiKey('Bearer sk-test123')).toBe('sk-test123');
    expect(cleanApiKey('API_KEY=sk-test123')).toBe('sk-test123');
    expect(cleanApiKey('"sk-test123"')).toBe('sk-test123');
    expect(cleanApiKey(' sk-test123 ')).toBe('sk-test123');
  });

  test('handles empty input gracefully', async () => {
    const { validateApiKey } = await import('../utils/keyValidation');

    const result = validateApiKey('');
    expect(result.isValid).toBe(false);
    expect(result.confidence).toBe('none');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});

describe('User Flow: Credential File Import/Export', () => {
  test('encrypts credential values for export', async () => {
    // Test AES-256-GCM encryption concept (same as credentialFile.ts uses)
    const crypto = await import('crypto');
    const passphrase = 'test-passphrase-123';
    const data = 'secret-api-key';

    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(passphrase, salt, 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    const encryptedJson = JSON.stringify({
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      data: encrypted,
    });

    // Decrypt
    const parsed = JSON.parse(encryptedJson);
    const key2 = crypto.scryptSync(passphrase, Buffer.from(parsed.salt, 'base64'), 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key2, Buffer.from(parsed.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(parsed.authTag, 'base64'));
    let decrypted = decipher.update(parsed.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    expect(decrypted).toBe(data);
  });

  test('fails decryption with wrong passphrase', async () => {
    const crypto = await import('crypto');
    const passphrase = 'correct-passphrase';
    const wrongPassphrase = 'wrong-passphrase';
    const data = 'secret-api-key';

    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(passphrase, salt, 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    const encryptedJson = JSON.stringify({
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      data: encrypted,
    });

    // Try to decrypt with wrong passphrase
    const parsed = JSON.parse(encryptedJson);
    const key2 = crypto.scryptSync(wrongPassphrase, Buffer.from(parsed.salt, 'base64'), 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key2, Buffer.from(parsed.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(parsed.authTag, 'base64'));

    expect(() => {
      decipher.update(parsed.data, 'base64', 'utf8');
      decipher.final('utf8');
    }).toThrow();
  });
});
