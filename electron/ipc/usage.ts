import { ipcMain } from 'electron';
import axios from 'axios';

interface UsageRequest {
  providerId: string;
  credentialId: string;
  baseUrl: string;
  providerType: string;
}

interface UsageResult {
  providerId: string;
  todayTokens: number;
  todayCost: number;
  monthTokens: number;
  monthCost: number;
  remainingQuota?: number;
  timestamp: string;
}

async function fetchOpenAIUsage(baseUrl: string, apiKey: string): Promise<UsageResult> {
  // OpenAI doesn't expose usage via public API for standard keys
  // This would require the billing API which needs different auth
  return {
    providerId: 'openai',
    todayTokens: 0,
    todayCost: 0,
    monthTokens: 0,
    monthCost: 0,
    timestamp: new Date().toISOString(),
  };
}

async function fetchAnthropicUsage(baseUrl: string, apiKey: string): Promise<UsageResult> {
  // Anthropic provides usage in response headers
  return {
    providerId: 'anthropic',
    todayTokens: 0,
    todayCost: 0,
    monthTokens: 0,
    monthCost: 0,
    timestamp: new Date().toISOString(),
  };
}

export function registerUsageHandlers(): void {
  ipcMain.handle('usage:fetch', async (_event, req: UsageRequest): Promise<UsageResult> => {
    try {
      switch (req.providerType) {
        case 'openai':
          return fetchOpenAIUsage(req.baseUrl, '');
        case 'anthropic':
          return fetchAnthropicUsage(req.baseUrl, '');
        default:
          return {
            providerId: req.providerId,
            todayTokens: 0,
            todayCost: 0,
            monthTokens: 0,
            monthCost: 0,
            timestamp: new Date().toISOString(),
          };
      }
    } catch {
      _event.sender.send('usage:error', {
        providerId: req.providerId,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch usage data',
      });
      throw new Error('Failed to fetch usage data');
    }
  });
}
