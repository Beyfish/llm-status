import { ipcMain } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const USAGE_DIR = join(homedir(), '.llm-status');
const USAGE_PATH = join(USAGE_DIR, 'usage.json');

function ensureUsageDir(): void {
  if (!existsSync(USAGE_DIR)) {
    mkdirSync(USAGE_DIR, { recursive: true });
  }
}

function readUsage(): Record<string, any[]> {
  ensureUsageDir();
  if (!existsSync(USAGE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(USAGE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeUsage(data: Record<string, any[]>): void {
  ensureUsageDir();
  writeFileSync(USAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function registerUsageHandlers(): void {
  ipcMain.handle('usage:fetch', async (_event, providerId: string): Promise<{ records: any[] }> => {
    const data = readUsage();
    const records = data[providerId] || [];
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return { records: records.filter((r: any) => r.timestamp > cutoff) };
  });

  ipcMain.handle('usage:record', async (_event, record: { providerId: string; timestamp: string; estimatedTokens: number; estimatedCost: number; checkCount: number; promptCount: number }): Promise<void> => {
    const data = readUsage();
    if (!data[record.providerId]) data[record.providerId] = [];
    data[record.providerId].push(record);
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    data[record.providerId] = data[record.providerId].filter((r: any) => r.timestamp > cutoff);
    writeUsage(data);
  });

  ipcMain.handle('usage:summary', async (): Promise<{ totalCost: number; totalChecks: number; totalPrompts: number; byProvider: Record<string, { cost: number; checks: number; prompts: number }> }> => {
    const data = readUsage();
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let totalCost = 0;
    let totalChecks = 0;
    let totalPrompts = 0;
    const byProvider: Record<string, { cost: number; checks: number; prompts: number }> = {};

    for (const [providerId, records] of Object.entries(data)) {
      const filtered = (records as any[]).filter((r: any) => r.timestamp > cutoff);
      const cost = filtered.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
      const checks = filtered.reduce((sum, r) => sum + (r.checkCount || 0), 0);
      const prompts = filtered.reduce((sum, r) => sum + (r.promptCount || 0), 0);
      totalCost += cost;
      totalChecks += checks;
      totalPrompts += prompts;
      byProvider[providerId] = { cost, checks, prompts };
    }

    return { totalCost, totalChecks, totalPrompts, byProvider };
  });
}
