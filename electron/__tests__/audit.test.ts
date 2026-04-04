import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const AUDIT_PATH = join(homedir(), '.llm-status', 'audit.json');

const { mockIpcMain } = vi.hoisted(() => ({
  mockIpcMain: { handle: vi.fn() },
}));

vi.mock('electron', () => ({ ipcMain: mockIpcMain }));

import { registerAuditHandlers } from '../ipc/audit';

describe('electron/ipc/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (existsSync(AUDIT_PATH)) rmSync(AUDIT_PATH);
  });

  afterEach(() => {
    if (existsSync(AUDIT_PATH)) rmSync(AUDIT_PATH);
  });

  describe('audit:record', () => {
    it('creates a new audit log entry with timestamp', async () => {
      registerAuditHandlers();
      const handler = mockIpcMain.handle.mock.calls.find(
        (c: any) => c[0] === 'audit:record'
      )[1];

      await handler({}, {
        providerId: 'openai-1',
        action: 'copy',
        detail: 'curl command copied',
      });

      expect(existsSync(AUDIT_PATH)).toBe(true);
      const log = JSON.parse(readFileSync(AUDIT_PATH, 'utf-8'));
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        providerId: 'openai-1',
        action: 'copy',
        detail: 'curl command copied',
      });
      expect(log[0].timestamp).toBeDefined();
    });
  });

  describe('audit:fetch', () => {
    it('returns all entries when no providerId filter', async () => {
      registerAuditHandlers();
      const recordHandler = mockIpcMain.handle.mock.calls.find(
        (c: any) => c[0] === 'audit:record'
      )[1];
      const fetchHandler = mockIpcMain.handle.mock.calls.find(
        (c: any) => c[0] === 'audit:fetch'
      )[1];

      await recordHandler({}, { providerId: 'openai-1', action: 'copy' });
      await recordHandler({}, { providerId: 'anthropic-1', action: 'view' });

      const result = await fetchHandler({});
      expect(result.entries).toHaveLength(2);
    });

    it('filters entries by providerId', async () => {
      registerAuditHandlers();
      const recordHandler = mockIpcMain.handle.mock.calls.find(
        (c: any) => c[0] === 'audit:record'
      )[1];
      const fetchHandler = mockIpcMain.handle.mock.calls.find(
        (c: any) => c[0] === 'audit:fetch'
      )[1];

      await recordHandler({}, { providerId: 'openai-1', action: 'copy' });
      await recordHandler({}, { providerId: 'anthropic-1', action: 'view' });

      const result = await fetchHandler({}, 'openai-1');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].providerId).toBe('openai-1');
    });
  });

  describe('audit:clear', () => {
    it('removes all audit entries', async () => {
      registerAuditHandlers();
      const recordHandler = mockIpcMain.handle.mock.calls.find(
        (c: any) => c[0] === 'audit:record'
      )[1];
      const clearHandler = mockIpcMain.handle.mock.calls.find(
        (c: any) => c[0] === 'audit:clear'
      )[1];
      const fetchHandler = mockIpcMain.handle.mock.calls.find(
        (c: any) => c[0] === 'audit:fetch'
      )[1];

      await recordHandler({}, { providerId: 'openai-1', action: 'copy' });
      await clearHandler({});

      const result = await fetchHandler({});
      expect(result.entries).toHaveLength(0);
    });
  });
});
