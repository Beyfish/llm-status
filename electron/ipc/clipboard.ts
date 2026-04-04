import { ipcMain, clipboard } from 'electron';

const DEFAULT_CLEAR_DELAY_MS = 30000;
const MAX_CLEAR_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

let activeTimer: NodeJS.Timeout | null = null;
let activeText: string | null = null;

function sanitizeDelay(delayMs: number): number {
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    return DEFAULT_CLEAR_DELAY_MS;
  }
  return Math.min(delayMs, MAX_CLEAR_DELAY_MS);
}

export function registerClipboardHandlers(): void {
  ipcMain.handle(
    'clipboard:writeAndClear',
    async (_event, text: string, delayMs: number = DEFAULT_CLEAR_DELAY_MS): Promise<{ success: boolean; clearedAt?: string }> => {
      if (!text || typeof text !== 'string') {
        return { success: false };
      }

      // Clear any existing timer before writing new content
      if (activeTimer) {
        clearTimeout(activeTimer);
        activeTimer = null;
      }

      clipboard.writeText(text);
      activeText = text;

      const sanitizedDelay = sanitizeDelay(delayMs);
      activeTimer = setTimeout(() => {
        // Only clear if clipboard still contains our text
        if (clipboard.readText() === activeText) {
          clipboard.clear();
        }
        activeTimer = null;
        activeText = null;
      }, sanitizedDelay);

      return { success: true, clearedAt: new Date(Date.now() + sanitizedDelay).toISOString() };
    }
  );
}

export function cleanupClipboardTimers(): void {
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
    activeText = null;
  }
}
