import { ipcMain } from 'electron';
import { readConfig } from './config';

interface PromptTestRequest {
  providerId: string;
  credentialId: string;
  prompt: string;
  maxTokens: number;
}

export function registerPromptTestHandlers(): void {
  ipcMain.handle('prompt:test', async (_event, req: PromptTestRequest): Promise<{ success: boolean; response?: string; error?: string; latency?: number }> => {
    try {
      const config = readConfig() as any;
      const provider = config.providers?.find((p: any) => p.id === req.providerId);
      if (!provider) {
        return { success: false, error: 'Provider not found' };
      }

      const credential = provider.credentials?.find((c: any) => c.id === req.credentialId) || provider.credentials?.[0];
      if (!credential) {
        return { success: false, error: 'No credentials configured' };
      }

      const baseUrl = provider.baseUrl || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

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

      const startTime = Date.now();

      if (provider.type === 'anthropic') {
        const axios = await import('axios');
        const response = await axios.default.post(`${baseUrl}/v1/messages`, {
          model: 'claude-sonnet-4',
          max_tokens: req.maxTokens || 256,
          messages: [{ role: 'user', content: req.prompt }],
        }, { headers, timeout: 30000 });

        const latency = Date.now() - startTime;
        const content = response.data.content?.[0]?.text || JSON.stringify(response.data);
        return { success: true, response: content, latency };
      } else {
        // OpenAI-compatible
        const axios = await import('axios');
        const response = await axios.default.post(`${baseUrl}/v1/chat/completions`, {
          model: provider.type === 'openai' ? 'gpt-4o-mini' : undefined,
          messages: [{ role: 'user', content: req.prompt }],
          max_tokens: req.maxTokens || 256,
        }, { headers, timeout: 30000 });

        const latency = Date.now() - startTime;
        const content = response.data.choices?.[0]?.message?.content || JSON.stringify(response.data);
        return { success: true, response: content, latency };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Prompt test failed' };
    }
  });
}
