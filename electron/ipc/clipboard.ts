import { ipcMain, clipboard } from 'electron';

const activeTimers = new Map<string, NodeJS.Timeout>();

export function registerClipboardHandlers(): void {
  ipcMain.handle(
    'clipboard:writeAndClear',
    async (_event, text: string, delayMs: number = 30000): Promise<{ success: boolean; clearedAt?: string }> => {
      if (!text || typeof text !== 'string') {
        return { success: false };
      }

      clipboard.writeText(text);

      const timerId = `clipboard-${Date.now()}`;
      const timer = setTimeout(() => {
        clipboard.clear();
        activeTimers.delete(timerId);
      }, delayMs);

      // If user copies again, clear previous timer to avoid stale state
      activeTimers.forEach((t) => clearTimeout(t));
      activeTimers.set(timerId, timer);

      return { success: true, clearedAt: new Date(Date.now() + delayMs).toISOString() };
    }
  );
}

// Clean up all active timers on app quit
export function cleanupClipboardTimers(): void {
  activeTimers.forEach((timer) => clearTimeout(timer));
  activeTimers.clear();
}
