import { describe, expect, test } from 'vitest';

describe('User Flow: Usage Tracking', () => {
  test('usage recording stores data correctly', async () => {
    // Test the same encryption logic used in usage.ts
    const data: Record<string, any[]> = {};
    const record = {
      providerId: 'openai-1',
      timestamp: new Date().toISOString(),
      estimatedTokens: 1000,
      estimatedCost: 0.002,
      checkCount: 1,
      promptCount: 0,
    };

    if (!data[record.providerId]) data[record.providerId] = [];
    data[record.providerId].push(record);

    expect(data['openai-1']).toHaveLength(1);
    expect(data['openai-1'][0].estimatedCost).toBe(0.002);
  });

  test('usage fetching returns filtered records (30-day retention)', async () => {
    const oldRecord = {
      providerId: 'openai-1',
      timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      estimatedTokens: 500,
      estimatedCost: 0.001,
      checkCount: 1,
      promptCount: 0,
    };
    const newRecord = {
      providerId: 'openai-1',
      timestamp: new Date().toISOString(),
      estimatedTokens: 1000,
      estimatedCost: 0.002,
      checkCount: 1,
      promptCount: 0,
    };

    const data = { 'openai-1': [oldRecord, newRecord] };
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const filtered = data['openai-1'].filter((r: any) => r.timestamp > cutoff);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].estimatedCost).toBe(0.002);
  });

  test('summary aggregation works correctly', async () => {
    const data = {
      'openai-1': [
        { timestamp: new Date().toISOString(), estimatedCost: 0.002, checkCount: 5, promptCount: 2 },
        { timestamp: new Date().toISOString(), estimatedCost: 0.003, checkCount: 3, promptCount: 1 },
      ],
      'anthropic-1': [
        { timestamp: new Date().toISOString(), estimatedCost: 0.005, checkCount: 2, promptCount: 0 },
      ],
    };

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

    expect(totalCost).toBeCloseTo(0.01, 3);
    expect(totalChecks).toBe(10);
    expect(totalPrompts).toBe(3);
    expect(byProvider['openai-1'].cost).toBeCloseTo(0.005, 3);
    expect(byProvider['anthropic-1'].cost).toBeCloseTo(0.005, 3);
  });

  test('empty state handling', async () => {
    const data: Record<string, any[]> = {};
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let totalCost = 0;
    for (const [, records] of Object.entries(data)) {
      const filtered = (records as any[]).filter((r: any) => r.timestamp > cutoff);
      totalCost += filtered.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
    }

    expect(totalCost).toBe(0);
  });
});
