import { ipcMain, safeStorage } from 'electron';

export function registerEncryptionHandlers(): void {
  ipcMain.handle('encrypt:value', (_event, value: string): string => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available on this platform');
    }
    const encrypted = safeStorage.encryptString(value);
    return encrypted.toString('base64');
  });

  ipcMain.handle('decrypt:value', (_event, encrypted: string): string => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available on this platform');
    }
    try {
      const buffer = Buffer.from(encrypted, 'base64');
      return safeStorage.decryptString(buffer);
    } catch {
      throw new Error('Failed to decrypt value — data may be corrupted or from a different machine');
    }
  });
}
