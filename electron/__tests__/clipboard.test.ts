import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Electron modules — vi.mock is hoisted, so define mocks at module level
const { mockClipboard, mockIpcMain } = vi.hoisted(() => ({
  mockClipboard: {
    writeText: vi.fn(),
    clear: vi.fn(),
  },
  mockIpcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  clipboard: mockClipboard,
  ipcMain: mockIpcMain,
}));

// Import after mocking
import { registerClipboardHandlers, cleanupClipboardTimers } from '../ipc/clipboard';

describe('electron/ipc/clipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockClipboard.writeText.mockReset();
    mockClipboard.clear.mockReset();
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
      // clearedAt should be ~30 seconds in the future
      const clearedAt = new Date(result.clearedAt!);
      const now = new Date();
      expect(clearedAt.getTime() - now.getTime()).toBeGreaterThanOrEqual(29999);
      expect(clearedAt.getTime() - now.getTime()).toBeLessThanOrEqual(30001);
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

    it('clears clipboard after delay', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      await handler(mockEvent, 'test-content', 5000);

      // Before delay expires
      expect(mockClipboard.clear).not.toHaveBeenCalled();

      // Advance timers past the delay
      await vi.advanceTimersByTimeAsync(5000);

      expect(mockClipboard.clear).toHaveBeenCalledTimes(1);
    });

    it('clears previous timer when called again (consecutive copies)', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      // First copy
      await handler(mockEvent, 'first-content', 10000);
      // Second copy (should cancel first timer)
      await handler(mockEvent, 'second-content', 10000);

      // Advance past first delay
      await vi.advanceTimersByTimeAsync(10000);

      // clear should be called once (for the second copy only)
      expect(mockClipboard.clear).toHaveBeenCalledTimes(1);
      // The second content should be what was written
      expect(mockClipboard.writeText).toHaveBeenLastCalledWith('second-content');
    });
  });

  describe('cleanupClipboardTimers', () => {
    it('clears all active timers', async () => {
      registerClipboardHandlers();
      const handler = mockIpcMain.handle.mock.calls[0][1];
      const mockEvent = {};

      await handler(mockEvent, 'test-content', 30000);

      cleanupClipboardTimers();

      // Advance past the delay
      await vi.advanceTimersByTimeAsync(30000);

      // Timer was cleared, so clipboard.clear should not have been called
      expect(mockClipboard.clear).not.toHaveBeenCalled();
    });

    it('is safe to call with no active timers', () => {
      // Should not throw
      expect(() => cleanupClipboardTimers()).not.toThrow();
    });
  });
});
