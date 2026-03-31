import { ipcMain, dialog, clipboard } from 'electron';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface ExportRequest {
  target: string;
  data: Record<string, unknown>;
  url?: string;
  apiKey?: string;
}

// One API / New API adapter
async function exportToOneApi(req: ExportRequest): Promise<void> {
  const axios = await import('axios');
  const payload = {
    name: req.data.name || 'LLM Status Import',
    type: 1,
    key: req.data.apiKey,
    base_url: req.data.baseUrl,
    models: req.data.models || [],
  };
  await axios.default.post(`${req.url}/api/channel`, payload, {
    headers: { Authorization: `Bearer ${req.apiKey}` },
  });
}

// sub2api adapter
async function exportToSub2api(req: ExportRequest): Promise<void> {
  const axios = await import('axios');
  const payload = {
    name: req.data.name || 'LLM Status Import',
    url: req.data.baseUrl,
    key: req.data.apiKey,
    models: req.data.models || [],
  };
  await axios.default.post(`${req.url}/api/providers`, payload, {
    headers: { Authorization: `Bearer ${req.apiKey}` },
  });
}

// LiteLLM adapter
async function exportToLiteLLM(req: ExportRequest): Promise<void> {
  const axios = await import('axios');
  const payload = {
    model_name: req.data.modelName || 'default',
    litellm_params: {
      model: req.data.model || 'gpt-3.5-turbo',
      api_key: req.data.apiKey,
      api_base: req.data.baseUrl,
    },
  };
  await axios.default.post(`${req.url}/model/new`, payload, {
    headers: { Authorization: `Bearer ${req.apiKey}` },
  });
}

// OpenRouter adapter
async function exportToOpenRouter(req: ExportRequest): Promise<void> {
  const axios = await import('axios');
  await axios.default.post('https://openrouter.ai/api/v1/auth/keys', {
    name: req.data.name || 'LLM Status Import',
  }, {
    headers: { Authorization: `Bearer ${req.apiKey}` },
  });
}

// Generic JSON export to file
async function exportToJsonFile(data: Record<string, unknown>): Promise<string> {
  const result = await dialog.showSaveDialog({
    title: 'Export Configuration',
    defaultPath: 'llm-status-config.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (result.filePath) {
    writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return result.filePath;
  }
  throw new Error('Export cancelled');
}

// Copy JSON to clipboard
function exportToClipboard(data: Record<string, unknown>): void {
  clipboard.writeText(JSON.stringify(data, null, 2));
}

export function registerExportHandlers(): void {
  ipcMain.handle('export:push', async (_event, req: ExportRequest): Promise<{ success: boolean; message: string }> => {
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
      const filePath = await exportToJsonFile(req.data);
      return { success: true, message: `Exported to ${filePath}` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Export failed' };
    }
  });

  ipcMain.handle('export:clipboard', async (_event, data: Record<string, unknown>): Promise<void> => {
    exportToClipboard(data);
  });
}
