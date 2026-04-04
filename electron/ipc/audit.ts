import { ipcMain } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const AUDIT_DIR = join(homedir(), '.llm-status');
const AUDIT_PATH = join(AUDIT_DIR, 'audit.json');
const MAX_LOG_ENTRIES = 1000;

interface AuditEntry {
  timestamp: string;
  providerId: string;
  action: 'view' | 'copy' | 'export' | 'modify' | 'delete' | 'import';
  detail?: string;
}

function ensureAuditDir(): void {
  if (!existsSync(AUDIT_DIR)) {
    mkdirSync(AUDIT_DIR, { recursive: true });
  }
}

function readAuditLog(): AuditEntry[] {
  ensureAuditDir();
  if (!existsSync(AUDIT_PATH)) return [];
  try {
    return JSON.parse(readFileSync(AUDIT_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeAuditLog(entries: AuditEntry[]): void {
  ensureAuditDir();
  const trimmed = entries.slice(-MAX_LOG_ENTRIES);
  writeFileSync(AUDIT_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
}

export function registerAuditHandlers(): void {
  ipcMain.handle(
    'audit:record',
    async (_event, entry: Omit<AuditEntry, 'timestamp'>): Promise<void> => {
      const log = readAuditLog();
      log.push({ ...entry, timestamp: new Date().toISOString() });
      writeAuditLog(log);
    }
  );

  ipcMain.handle(
    'audit:fetch',
    async (_event, providerId?: string): Promise<{ entries: AuditEntry[] }> => {
      const log = readAuditLog();
      if (providerId) {
        return { entries: log.filter((e) => e.providerId === providerId) };
      }
      return { entries: log };
    }
  );

  ipcMain.handle(
    'audit:clear',
    async (): Promise<void> => {
      writeAuditLog([]);
    }
  );
}
