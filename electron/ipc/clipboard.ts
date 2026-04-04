import { ipcMain, clipboard } from 'electron';

const activeTimers = new Map<string, NodeJS.Timeout>();

export function registerClipboardHandlers(): void {
  ipcMain.handle(
    'clipboard:writeAndClear',
    async (_event, text: string, delayMs: number = 30000): Promise<{ success: boolean; clearedAt?: string }> => {
      if (!text || typeof text !== 'string') {
        return { success: false };
      }

      // Handle edge case: delayMs of 0 or negative defaults to 30s
      const effectiveDelay = delayMs > 0 ? delayMs : 30000;

      clipboard.writeText(text);

      const timerId = `clipboard-${Date.now()}`;
      const timer = setTimeout(() => {
        clipboard.clear();
        activeTimers.delete(timerId);
      }, effectiveDelay);

      // Clear any existing timers — user copied again, so only the latest matters
      activeTimers.forEach((t) => clearTimeout(t));
      activeTimers.clear();
      activeTimers.set(timerId, timer);

      return { success: true, clearedAt: new Date(Date.now() + effectiveDelay).toISOString() };
    }
  );
}

// Clean up all timers on app quit
export function cleanupClipboardTimers(): void {
  activeTimers.forEach((timer) => clearTimeout(timer));
  activeTimers.clear();
}
