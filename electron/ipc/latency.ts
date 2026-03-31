import { ipcMain } from 'electron';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { readConfig } from './config';

interface LatencyCheckRequest {
  providerId: string;
  mode: 'lightweight' | 'full';
  credentialId: string;
}

interface LatencyCheckAllRequest {
  mode: 'lightweight' | 'full';
  concurrency: number;
  timeout: number;
}

const PROVIDER_ENDPOINTS: Record<string, { url: string; method: string }> = {
  openai: { url: '/v1/models', method: 'GET' },
  anthropic: { url: '/v1/messages', method: 'HEAD' },
  google: { url: '/v1beta/models', method: 'GET' },
  'azure-openai': { url: '/openai/models?api-version=2024-02-01', method: 'GET' },
  zhipu: { url: '/v1/models', method: 'GET' },
  dashscope: { url: '/compatible-mode/v1/models', method: 'GET' },
  qianfan: { url: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', method: 'POST' },
  vllm: { url: '/v1/models', method: 'GET' },
  ollama: { url: '/api/tags', method: 'GET' },
  localai: { url: '/v1/models', method: 'GET' },
  custom: { url: '/v1/models', method: 'GET' },
};

async function checkProviderLatency(
  providerId: string,
  mode: 'lightweight' | 'full',
  credentialId: string,
  timeout: number = 10000,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<{ providerId: string; latency: number; status: 'success' | 'timeout' | 'error'; error?: string; timestamp: string }> {
  const config = readConfig() as any;
  const provider = config.providers?.find((p: any) => p.id === providerId);
  if (!provider) {
    return { providerId, latency: 0, status: 'error', error: 'Provider not found', timestamp: new Date().toISOString() };
  }

  const credential = provider.credentials?.find((c: any) => c.id === credentialId) || provider.credentials?.[0];
  if (!credential) {
    return { providerId, latency: 0, status: 'error', error: 'No credentials configured', timestamp: new Date().toISOString() };
  }

  const endpoint = PROVIDER_ENDPOINTS[provider.type] || PROVIDER_ENDPOINTS.custom;
  const baseUrl = provider.baseUrl || '';
  const url = `${baseUrl}${endpoint.url}`;

  const headers: Record<string, string> = {};
  if (credential.type === 'api_key') {
    if (provider.type === 'anthropic') {
      headers['x-api-key'] = credential.value;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${credential.value}`;
    }
  } else if (credential.type === 'oauth') {
    headers['Authorization'] = `Bearer ${credential.accessToken}`;
  }

  const axiosConfig: any = {
    method: mode === 'lightweight' ? 'HEAD' : endpoint.method,
    url,
    headers,
    timeout,
    validateStatus: () => true,
  };

  if (proxyAgent) {
    axiosConfig.httpsAgent = proxyAgent;
  }

  const startTime = Date.now();
  try {
    const response = await axios(axiosConfig);
    const latency = Date.now() - startTime;

    if (response.status >= 200 && response.status < 300) {
      return { providerId, latency, status: 'success', timestamp: new Date().toISOString() };
    } else if (response.status === 401 || response.status === 403) {
      return { providerId, latency, status: 'error', error: `Auth failed: ${response.status}`, timestamp: new Date().toISOString() };
    } else {
      return { providerId, latency, status: 'error', error: `HTTP ${response.status}`, timestamp: new Date().toISOString() };
    }
  } catch (err: any) {
    const latency = Date.now() - startTime;
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return { providerId, latency, status: 'timeout', error: 'Request timed out', timestamp: new Date().toISOString() };
    }
    return { providerId, latency, status: 'error', error: err.message || 'Unknown error', timestamp: new Date().toISOString() };
  }
}

export function registerLatencyHandlers(): void {
  ipcMain.handle('latency:check', async (_event, req: LatencyCheckRequest) => {
    const result = await checkProviderLatency(req.providerId, req.mode, req.credentialId);
    return result;
  });

  ipcMain.handle('latency:checkAll', async (_event, req: LatencyCheckAllRequest) => {
    const config = readConfig() as any;
    const providers = config.providers || [];
    const concurrency = req.concurrency || 5;
    const results: any[] = [];

    for (let i = 0; i < providers.length; i += concurrency) {
      const batch = providers.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (p: any) => {
          const result = await checkProviderLatency(p.id, req.mode, '', req.timeout * 1000);
          _event.sender.send('latency:progress', result);
          return result;
        }),
      );
      results.push(...batchResults);
    }

    _event.sender.send('latency:complete', { results });
    return { results };
  });
}
