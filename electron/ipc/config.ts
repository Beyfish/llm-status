import { ipcMain, safeStorage } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.llm-status');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
const SECRETS_PATH = join(CONFIG_DIR, 'secrets.enc.json');
const CURRENT_SCHEMA_VERSION = 1;

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function getDefaultConfig(): object {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    providers: [],
    settings: {
      storageMode: 'encrypted',
      defaultLatencyMode: 'full',
      autoCheckInterval: 0,
      language: 'zh-CN',
      configPath: CONFIG_DIR,
      theme: 'dark',
      shortcuts: {},
      notifications: {
        statusChange: true,
        syncComplete: true,
        exportComplete: true,
        oauthComplete: true,
        budgetAlert: true,
        keyExpiry: true,
      },
    },
  };
}

// Extract secrets from config object and return config without secrets
function extractSecrets(config: any): { configWithoutSecrets: any; secrets: Record<string, any> } {
  const secrets: Record<string, any> = {};
  const configCopy = JSON.parse(JSON.stringify(config));

  if (configCopy.providers) {
    configCopy.providers = configCopy.providers.map((p: any, idx: number) => {
      if (p.credentials && p.credentials.length > 0) {
        secrets[`provider_${idx}_credentials`] = p.credentials;
        return {
          ...p,
          credentials: p.credentials.map((_: any, cIdx: number) => ({
            id: (p.credentials[cIdx] as any)?.id || `cred-${idx}-${cIdx}`,
            type: (p.credentials[cIdx] as any)?.type || 'api_key',
            status: 'unknown',
            encrypted: true,
          })),
        };
      }
      return p;
    });
  }

  return { configWithoutSecrets: configCopy, secrets };
}

// Merge secrets back into config object
function mergeSecrets(config: any, secrets: Record<string, any>): any {
  const configCopy = JSON.parse(JSON.stringify(config));
  if (configCopy.providers && secrets) {
    configCopy.providers = configCopy.providers.map((p: any, idx: number) => {
      const secretKey = `provider_${idx}_credentials`;
      if (secrets[secretKey]) {
        return { ...p, credentials: secrets[secretKey] };
      }
      return p;
    });
  }
  return configCopy;
}

function encryptSecrets(secrets: Record<string, any>): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage encryption not available on this platform');
  }
  const json = JSON.stringify(secrets);
  const encrypted = safeStorage.encryptString(json);
  return encrypted.toString('base64');
}

function decryptSecrets(encryptedBase64: string): Record<string, any> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage encryption not available on this platform');
  }
  const buffer = Buffer.from(encryptedBase64, 'base64');
  const json = safeStorage.decryptString(buffer);
  return JSON.parse(json);
}

export function readConfig(): object {
  ensureConfigDir();
  if (!existsSync(CONFIG_PATH)) {
    const defaultConfig = getDefaultConfig();
    writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
  const raw = readFileSync(CONFIG_PATH, 'utf-8');
  let config: any;
  try {
    config = JSON.parse(raw);
  } catch {
    config = getDefaultConfig();
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return config;
  }

  // Merge decrypted secrets if available
  if (existsSync(SECRETS_PATH)) {
    try {
      const encrypted = readFileSync(SECRETS_PATH, 'utf-8');
      const secrets = decryptSecrets(encrypted);
      config = mergeSecrets(config, secrets);
    } catch (err) {
      // If decryption fails (e.g., different machine), secrets stay as stubs
      console.error('Failed to decrypt secrets:', err);
    }
  }

  return config;
}

export function writeConfig(config: object): void {
  ensureConfigDir();

  // Backup config (without secrets) before write
  if (existsSync(CONFIG_PATH)) {
    const backupPath = join(CONFIG_DIR, `config.backup.${Date.now()}.json`);
    copyFileSync(CONFIG_PATH, backupPath);
  }

  // Extract and encrypt secrets
  const { configWithoutSecrets, secrets } = extractSecrets(config);

  // Write config without secrets
  writeFileSync(CONFIG_PATH, JSON.stringify(configWithoutSecrets, null, 2), 'utf-8');

  // Write encrypted secrets separately
  if (Object.keys(secrets).length > 0) {
    try {
      const encrypted = encryptSecrets(secrets);
      writeFileSync(SECRETS_PATH, encrypted, 'utf-8');
    } catch (err) {
      console.error('Failed to encrypt secrets:', err);
      // Fallback: write secrets in plaintext with warning (better than data loss)
      writeFileSync(SECRETS_PATH, JSON.stringify(secrets, null, 2), 'utf-8');
    }
  }
}

function migrateConfig(config: any): object {
  const currentVersion = config.schemaVersion || 0;
  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return config;
  }
  // Future migrations go here (v1 -> v2, etc.)
  config.schemaVersion = CURRENT_SCHEMA_VERSION;
  return config;
}

export function registerConfigHandlers(): void {
  ipcMain.handle('config:read', (): object => {
    const config = readConfig();
    return migrateConfig(config);
  });

  ipcMain.handle('config:write', (_event, config: object): void => {
    writeConfig(config);
  });
}
