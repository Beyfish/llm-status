import { ipcMain, dialog } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const SCHEMA_VERSION = 1;

interface CredentialFileExport {
  schemaVersion: number;
  exportedAt: string;
  providers: Array<{
    id: string;
    type: string;
    name: string;
    baseUrl: string;
    credentials: Array<{
      id: string;
      type: string;
      value: string; // encrypted with passphrase
      status: string;
    }>;
    status: string;
  }>;
  settings?: Record<string, unknown>;
}

interface CredentialFileImport {
  providers: Array<{
    id: string;
    type: string;
    name: string;
    baseUrl: string;
    credentials: Array<{
      id: string;
      type: string;
      value: string;
      status: string;
    }>;
    status: string;
  }>;
  settings?: Record<string, unknown>;
  mergeStrategy: 'replace' | 'merge';
}

function encryptWithPassphrase(data: string, passphrase: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(passphrase, salt, 32);

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: encrypted,
  });
}

function decryptWithPassphrase(encryptedJson: string, passphrase: string): string {
  const { salt, iv, authTag, data } = JSON.parse(encryptedJson);
  const key = scryptSync(passphrase, Buffer.from(salt, 'base64'), 32);

  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function registerCredentialFileHandlers(): void {
  // Export credentials to file
  ipcMain.handle('credentialFile:export', async (_event, config: Record<string, unknown>, passphrase: string): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Export Credentials',
        defaultPath: 'llm-status-credentials.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (!result.filePath) {
        return { success: false, message: 'Export cancelled' };
      }

      // Encrypt the entire config with passphrase
      const configJson = JSON.stringify(config);
      const _encryptedConfig = encryptWithPassphrase(configJson, passphrase);

      const exportData: CredentialFileExport = {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        providers: (config.providers as any[]) || [],
        settings: config.settings ? { __encrypted: encryptWithPassphrase(JSON.stringify(config.settings), passphrase) } : undefined,
      };

      // Encrypt the providers' credential values
      for (const provider of exportData.providers) {
        for (const cred of provider.credentials) {
          if (cred.value) {
            cred.value = encryptWithPassphrase(cred.value, passphrase);
          }
        }
      }

      writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      return { success: true, message: `Exported to ${result.filePath}` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Export failed' };
    }
  });

  // Import credentials from file
  ipcMain.handle('credentialFile:import', async (_event, passphrase: string): Promise<{ success: boolean; data?: CredentialFileImport; message: string }> => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Credentials',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'Import cancelled' };
      }

      const filePath = result.filePaths[0];
      const raw = readFileSync(filePath, 'utf-8');
      const importData = JSON.parse(raw) as CredentialFileExport;

      if (importData.schemaVersion !== SCHEMA_VERSION) {
        return { success: false, message: `Unsupported schema version: ${importData.schemaVersion}` };
      }

      // Decrypt credential values
      const decryptedProviders = importData.providers.map((provider) => ({
        ...provider,
        credentials: provider.credentials.map((cred) => ({
          ...cred,
          value: cred.value ? decryptWithPassphrase(cred.value, passphrase) : '',
        })),
      }));

      // Decrypt settings if encrypted
      let decryptedSettings = importData.settings;
      if (decryptedSettings && (decryptedSettings as any).__encrypted) {
        try {
          decryptedSettings = JSON.parse(decryptWithPassphrase((decryptedSettings as any).__encrypted, passphrase));
        } catch {
          decryptedSettings = undefined;
        }
      }

      return {
        success: true,
        data: {
          providers: decryptedProviders,
          settings: decryptedSettings,
          mergeStrategy: 'merge',
        },
        message: `Imported from ${filePath}`,
      };
    } catch (err: any) {
      if (err.message?.includes('bad decrypt') || err.message?.includes('authTag')) {
        return { success: false, message: 'Incorrect passphrase' };
      }
      return { success: false, message: err.message || 'Import failed' };
    }
  });
}
