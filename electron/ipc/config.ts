import { ipcMain } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.llm-status');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
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

function readConfig(): object {
  ensureConfigDir();
  if (!existsSync(CONFIG_PATH)) {
    const defaultConfig = getDefaultConfig();
    writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
  const raw = readFileSync(CONFIG_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    // Corrupted config - restore default
    const defaultConfig = getDefaultConfig();
    writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

function writeConfig(config: object): void {
  ensureConfigDir();
  // Backup before write
  if (existsSync(CONFIG_PATH)) {
    const backupPath = join(CONFIG_DIR, `config.backup.${Date.now()}.json`);
    copyFileSync(CONFIG_PATH, backupPath);
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
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
