import { ipcMain } from 'electron';

export function registerEncryptionHandlers(): void {
  // Placeholder - will use Electron safeStorage in production
  ipcMain.handle('encrypt:value', (_event, value: string): string => {
    return value; // TODO: implement safeStorage encryption
  });

  ipcMain.handle('decrypt:value', (_event, encrypted: string): string => {
    return encrypted; // TODO: implement safeStorage decryption
  });
}
