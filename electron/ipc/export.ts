import { ipcMain, dialog, clipboard } from 'electron';
import { writeFileSync } from 'fs';
import axios from 'axios';
import {
  exportCherryStudio,
  exportLobeChat,
  exportChatGptNextWeb,
  exportDify,
  exportAnythingLLM,
} from './export-adapters';

interface ExportRequest {
  target: string;
  data: Record<string, unknown>;
  url?: string;
  apiKey?: string;
}

async function exportToOneApi(req: ExportRequest): Promise<void> {
  const payload = {
    name: (req.data.name as string) || 'LLM Status Import',
    type: 1,
    key: (req.data.apiKey as string) || req.apiKey,
    base_url: (req.data.baseUrl as string) || '',
    models: (req.data.models as string[]) || [],
  };
  await axios.post(`${req.url}/api/channel`, payload, {
    headers: { Authorization: `Bearer ${req.apiKey}` },
  });
}

async function exportToSub2api(req: ExportRequest): Promise<void> {
  const payload = {
    name: (req.data.name as string) || 'LLM Status Import',
    url: (req.data.baseUrl as string) || '',
    key: (req.data.apiKey as string) || req.apiKey,
    models: (req.data.models as string[]) || [],
  };
  await axios.post(`${req.url}/api/providers`, payload, {
    headers: { Authorization: `Bearer ${req.apiKey}` },
  });
}

async function exportToLiteLLM(req: ExportRequest): Promise<void> {
  const payload = {
    model_name: (req.data.modelName as string) || 'default',
    litellm_params: {
      model: (req.data.model as string) || 'gpt-3.5-turbo',
      api_key: (req.data.apiKey as string) || req.apiKey,
      api_base: (req.data.baseUrl as string) || '',
    },
  };
  await axios.post(`${req.url}/model/new`, payload, {
    headers: { Authorization: `Bearer ${req.apiKey}` },
  });
}

async function exportToOpenRouter(req: ExportRequest): Promise<void> {
  await axios.post('https://openrouter.ai/api/v1/auth/keys', {
    name: (req.data.name as string) || 'LLM Status Import',
  }, {
    headers: { Authorization: `Bearer ${req.apiKey}` },
  });
}

export function registerExportHandlers(): void {
  ipcMain.handle('export:push', async (_event, rawReq: { target: string; data: Record<string, unknown> }): Promise<{ success: boolean; message: string }> => {
    // Unwrap nested structure: { target, data: { url, apiKey, data: providerData } }
    const innerData = rawReq.data as Record<string, unknown> || {};
    const req: ExportRequest = {
      target: rawReq.target,
      url: (innerData.url as string) || '',
      apiKey: (innerData.apiKey as string) || '',
      data: (innerData.data as Record<string, unknown>) || innerData,
    };
    try {
      switch (req.target) {
        case 'one-api':
        case 'new-api':
          await exportToOneApi(req);
          return { success: true, message: 'Exported to One API successfully' };
        case 'sub2api':
          await exportToSub2api(req);
          return { success: true, message: 'Exported to sub2api successfully' };
        case 'litellm':
          await exportToLiteLLM(req);
          return { success: true, message: 'Exported to LiteLLM successfully' };
        case 'openrouter':
          await exportToOpenRouter(req);
          return { success: true, message: 'Exported to OpenRouter successfully' };
        case 'cherry-studio':
          await exportCherryStudio(req.data as any);
          return { success: true, message: 'Exported to Cherry Studio successfully' };
        case 'lobechat':
          await exportLobeChat(req.data as any);
          return { success: true, message: 'Exported to LobeChat successfully' };
        case 'chatgpt-next-web':
          await exportChatGptNextWeb(req.data as any);
          return { success: true, message: 'Exported to ChatGPT Next Web successfully' };
        case 'dify':
          await exportDify(req.data as any);
          return { success: true, message: 'Exported to Dify successfully' };
        case 'anythingllm':
          await exportAnythingLLM(req.data as any);
          return { success: true, message: 'Exported to AnythingLLM successfully' };
        default:
          return { success: false, message: `Unknown target: ${req.target}` };
      }
    } catch (err: any) {
      _event.sender.send('export:error', { target: req.target, error: err.code || 'UNKNOWN', message: err.message });
      return { success: false, message: err.message || 'Export failed' };
    }
  });

  ipcMain.handle('export:file', async (_event, req: ExportRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Export Configuration',
        defaultPath: 'llm-status-config.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (result.filePath) {
        writeFileSync(result.filePath, JSON.stringify(req.data, null, 2), 'utf-8');
        return { success: true, message: `Exported to ${result.filePath}` };
      }
      return { success: false, message: 'Export cancelled' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Export failed' };
    }
  });

  ipcMain.handle('export:clipboard', async (_event, data: Record<string, unknown>): Promise<void> => {
    // Redact sensitive fields before copying to clipboard
    const redacted = JSON.parse(JSON.stringify(data));
    if (redacted.providers) {
      redacted.providers = redacted.providers.map((p: any) => ({
        ...p,
        credentials: p.credentials?.map((c: any) => ({
          ...c,
          value: c.value ? `****${c.value.slice(-4)}` : undefined,
          accessToken: c.accessToken ? '****' : undefined,
          refreshToken: c.refreshToken ? '****' : undefined,
          privateKey: c.privateKey ? '****' : undefined,
          secretAccessKey: c.secretAccessKey ? '****' : undefined,
          clientSecret: c.clientSecret ? '****' : undefined,
        })),
      }));
    }
    clipboard.writeText(JSON.stringify(redacted, null, 2));
  });
}
