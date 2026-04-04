import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockClipboard, mockIpcMain } = vi.hoisted(() => ({
  mockClipboard: {
    writeText: vi.fn(),
    clear: vi.fn(),
    readText: vi.fn().mockReturnValue(''),
  },
  mockIpcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  clipboard: mockClipboard,
  ipcMain: mockIpcMain,
}));

import { registerClipboardHandlers, cleanupClipboardTimers } from '../ipc/clipboard';

describe('electron/ipc/clipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockClipboard.writeText.mockReset();
    mockClipboard.clear.mockReset();
    mockClipboard.readText.mockReset().mockReturnValue('');
    mockIpcMain.handle.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanupClipboardTimers();
  });

  describe('registerClipboardHandlers', () => {
    it('registers the clipboard:writeAndClear handler', () => {
      registerClipboardHandlers();

      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'clipboard:writeAndClear',
        expect.any(Function)
      );
    });

    it('writes text to clipboard and returns success with clearedAt', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, 'test-api-key-content', 30000);

      expect(mockClipboard.writeText).toHaveBeenCalledWith('test-api-key-content');
      expect(result.success).toBe(true);
      expect(result.clearedAt).toBeDefined();
    });

    it('uses default 30s delay when delayMs not provided', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, 'test-content');

      expect(result.success).toBe(true);
      const clearedAt = new Date(result.clearedAt!);
      const now = new Date();
      expect(clearedAt.getTime() - now.getTime()).toBeGreaterThanOrEqual(29999);
      expect(clearedAt.getTime() - now.getTime()).toBeLessThanOrEqual(30001);
    });

    it('respects custom delay values', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, 'test-content', 60000);

      expect(result.success).toBe(true);
      const clearedAt = new Date(result.clearedAt!);
      const now = new Date();
      expect(clearedAt.getTime() - now.getTime()).toBeGreaterThanOrEqual(59999);
      expect(clearedAt.getTime() - now.getTime()).toBeLessThanOrEqual(60001);
    });

    it('returns false for empty string input', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, '', 30000);

      expect(result.success).toBe(false);
      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });

    it('returns false for null input', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, null, 30000);

      expect(result.success).toBe(false);
      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });

    it('returns false for undefined input', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, undefined, 30000);

      expect(result.success).toBe(false);
      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });

    it('returns false for non-string input (number)', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, 12345, 30000);

      expect(result.success).toBe(false);
      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });

    it('clears clipboard after delay when text is unchanged', async () => {
      mockClipboard.readText.mockReturnValue('test-content');
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      await handler(mockEvent, 'test-content', 5000);

      expect(mockClipboard.clear).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(5000);

      expect(mockClipboard.clear).toHaveBeenCalledTimes(1);
    });

    it('does NOT clear clipboard if user copied something else', async () => {
      mockClipboard.readText.mockReturnValue('user-copied-something-else');
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      await handler(mockEvent, 'test-content', 5000);

      await vi.advanceTimersByTimeAsync(5000);

      expect(mockClipboard.clear).not.toHaveBeenCalled();
    });

    it('clears previous timer when called again (consecutive copies)', async () => {
      mockClipboard.readText.mockReturnValue('second-content');
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      await handler(mockEvent, 'first-content', 10000);
      await handler(mockEvent, 'second-content', 10000);

      await vi.advanceTimersByTimeAsync(10000);

      expect(mockClipboard.clear).toHaveBeenCalledTimes(1);
      expect(mockClipboard.writeText).toHaveBeenLastCalledWith('second-content');
    });

    it('sanitizes negative delay to default 30s', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, 'test-content', -5000);

      expect(result.success).toBe(true);
      const clearedAt = new Date(result.clearedAt!);
      const now = new Date();
      expect(clearedAt.getTime() - now.getTime()).toBeGreaterThanOrEqual(29999);
    });

    it('sanitizes Infinity delay to default 30s', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, 'test-content', Infinity);

      expect(result.success).toBe(true);
      const clearedAt = new Date(result.clearedAt!);
      const now = new Date();
      expect(clearedAt.getTime() - now.getTime()).toBeGreaterThanOrEqual(29999);
    });

    it('caps very large delay to 24 hours max', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      const result = await handler(mockEvent, 'test-content', 99999999999);

      expect(result.success).toBe(true);
      const clearedAt = new Date(result.clearedAt!);
      const now = new Date();
      expect(clearedAt.getTime() - now.getTime()).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });
  });

  describe('cleanupClipboardTimers', () => {
    it('clears active timer and prevents clipboard clear', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      await handler(mockEvent, 'test-content', 30000);

      cleanupClipboardTimers();

      await vi.advanceTimersByTimeAsync(30000);

      expect(mockClipboard.clear).not.toHaveBeenCalled();
    });

    it('is safe to call with no active timers', () => {
      expect(() => cleanupClipboardTimers()).not.toThrow();
    });
  });
});
