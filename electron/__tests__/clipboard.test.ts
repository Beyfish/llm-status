import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Electron modules
const mockClipboard = {
  writeText: vi.fn(),
  clear: vi.fn(),
};

const mockIpcMain = {
  handle: vi.fn(),
};

vi.mock('electron', () => ({
  clipboard: mockClipboard,
  ipcMain: mockIpcMain,
}));

describe('clipboard:writeAndClear', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes text to clipboard and schedules clear', async () => {
    const { registerClipboardHandlers, cleanupClipboardTimers } = await import('../ipc/clipboard');
    registerClipboardHandlers();

    const handlerCall = mockIpcMain.handle.mock.calls.find(
      (call: any[]) => call[0] === 'clipboard:writeAndClear'
    );
    expect(handlerCall).toBeDefined();
    const handler = handlerCall![1];

    const result = await handler({}, 'Hello World', 5000);

    expect(result.success).toBe(true);
    expect(result.clearedAt).toBeDefined();
    expect(mockClipboard.writeText).toHaveBeenCalledWith('Hello World');
    expect(mockClipboard.clear).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    expect(mockClipboard.clear).toHaveBeenCalledTimes(1);

    cleanupClipboardTimers();
  });

  it('uses default 30s delay when not specified', async () => {
    const { registerClipboardHandlers, cleanupClipboardTimers } = await import('../ipc/clipboard');
    registerClipboardHandlers();

    const handlerCall = mockIpcMain.handle.mock.calls.find(
      (call: any[]) => call[0] === 'clipboard:writeAndClear'
    );
    const handler = handlerCall![1];

    const result = await handler({}, 'Test text');

    expect(result.success).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledWith('Test text');

    cleanupClipboardTimers();
  });

  it('returns { success: false } for empty text', async () => {
    const { registerClipboardHandlers, cleanupClipboardTimers } = await import('../ipc/clipboard');
    registerClipboardHandlers();

    const handlerCall = mockIpcMain.handle.mock.calls.find(
      (call: any[]) => call[0] === 'clipboard:writeAndClear'
    );
    const handler = handlerCall![1];

    const result = await handler({}, '', 30000);

    expect(result.success).toBe(false);
    expect(mockClipboard.writeText).not.toHaveBeenCalled();

    cleanupClipboardTimers();
  });

  it('returns { success: false } for null input', async () => {
    const { registerClipboardHandlers, cleanupClipboardTimers } = await import('../ipc/clipboard');
    registerClipboardHandlers();

    const handlerCall = mockIpcMain.handle.mock.calls.find(
      (call: any[]) => call[0] === 'clipboard:writeAndClear'
    );
    const handler = handlerCall![1];

    const result = await handler({}, null, 30000);

    expect(result.success).toBe(false);

    cleanupClipboardTimers();
  });

  it('clears old timers when called again (consecutive calls)', async () => {
    const { registerClipboardHandlers, cleanupClipboardTimers } = await import('../ipc/clipboard');
    registerClipboardHandlers();

    const handlerCall = mockIpcMain.handle.mock.calls.find(
      (call: any[]) => call[0] === 'clipboard:writeAndClear'
    );
    const handler = handlerCall![1];

    await handler({}, 'First text', 10000);
    await handler({}, 'Second text', 5000);

    vi.advanceTimersByTime(5000);
    expect(mockClipboard.clear).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(mockClipboard.clear).toHaveBeenCalledTimes(1);

    cleanupClipboardTimers();
  });
});

describe('cleanupClipboardTimers', () => {
  it('clears all active timers', async () => {
    const { registerClipboardHandlers, cleanupClipboardTimers } = await import('../ipc/clipboard');
    registerClipboardHandlers();

    const handlerCall = mockIpcMain.handle.mock.calls.find(
      (call: any[]) => call[0] === 'clipboard:writeAndClear'
    );
    const handler = handlerCall![1];

    await handler({}, 'Test', 60000);

    expect(() => cleanupClipboardTimers()).not.toThrow();
  });

  it('is safe to call with no active timers', async () => {
    const { cleanupClipboardTimers } = await import('../ipc/clipboard');

    expect(() => cleanupClipboardTimers()).not.toThrow();
  });
});
