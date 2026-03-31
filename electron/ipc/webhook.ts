import { ipcMain, Notification } from 'electron';
import axios from 'axios';
import * as crypto from 'crypto';

interface WebhookConfig {
  type: 'dingtalk' | 'wecom' | 'feishu' | 'slack' | 'discord';
  url: string;
  secret?: string;
}

interface AlertMessage {
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  providerId?: string;
  timestamp: string;
}

async function sendDingTalk(url: string, message: AlertMessage, secret?: string): Promise<void> {
  const payload = {
    msgtype: 'markdown',
    markdown: {
      title: message.title,
      text: `**${message.title}**\n\n${message.body}\n\n> ${message.timestamp}`,
    },
  };
  let targetUrl = url;
  if (secret) {
    const timestamp = Date.now();
    const stringToSign = `${timestamp}\n${secret}`;
    const sign = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64');
    targetUrl = `${url}&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
  }
  await axios.post(targetUrl, payload, { timeout: 10000 });
}

async function sendWeCom(url: string, message: AlertMessage): Promise<void> {
  const payload = {
    msgtype: 'markdown',
    markdown: { content: `# ${message.title}\n> ${message.body}\n> ${message.timestamp}` },
  };
  await axios.post(url, payload, { timeout: 10000 });
}

async function sendFeishu(url: string, message: AlertMessage): Promise<void> {
  const colorMap: Record<string, string> = { info: 'blue', success: 'green', warning: 'orange', error: 'red' };
  const payload = {
    msg_type: 'interactive',
    card: {
      header: { title: { tag: 'plain_text', content: message.title }, template: colorMap[message.type] },
      elements: [{ tag: 'markdown', content: `${message.body}\n\n*${message.timestamp}*` }],
    },
  };
  await axios.post(url, payload, { timeout: 10000 });
}

async function sendSlack(url: string, message: AlertMessage): Promise<void> {
  const colorMap: Record<string, string> = { info: '#007AFF', success: '#22C55E', warning: '#EAB308', error: '#EF4444' };
  const payload = {
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: message.title } },
      { type: 'section', text: { type: 'mrkdwn', text: message.body } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: message.timestamp }] },
    ],
    attachments: [{ color: colorMap[message.type] }],
  };
  await axios.post(url, payload, { timeout: 10000 });
}

async function sendDiscord(url: string, message: AlertMessage): Promise<void> {
  const colorMap: Record<string, number> = { info: 0x007AFF, success: 0x22C55E, warning: 0xEAB308, error: 0xEF4444 };
  const payload = {
    embeds: [{
      title: message.title,
      description: message.body,
      footer: { text: message.timestamp },
      color: colorMap[message.type],
    }],
  };
  await axios.post(url, payload, { timeout: 10000 });
}

export async function sendWebhookAlert(config: WebhookConfig, message: AlertMessage): Promise<boolean> {
  try {
    switch (config.type) {
      case 'dingtalk': await sendDingTalk(config.url, message, config.secret); break;
      case 'wecom': await sendWeCom(config.url, message); break;
      case 'feishu': await sendFeishu(config.url, message); break;
      case 'slack': await sendSlack(config.url, message); break;
      case 'discord': await sendDiscord(config.url, message); break;
      default: return false;
    }
    return true;
  } catch {
    return false;
  }
}

function showDesktopNotification(message: AlertMessage): void {
  new Notification({
    title: message.title,
    body: message.body,
    urgency: message.type === 'error' ? 'critical' : 'normal',
  }).show();
}

export function registerWebhookHandlers(): void {
  ipcMain.handle('webhook:send', async (_event, config: WebhookConfig, message: AlertMessage): Promise<{ success: boolean }> => {
    const success = await sendWebhookAlert(config, message);
    return { success };
  });

  ipcMain.handle('webhook:test', async (_event, config: WebhookConfig): Promise<{ success: boolean; message: string }> => {
    const testMessage: AlertMessage = {
      title: 'LLM Status - Test',
      body: 'Test notification sent successfully.',
      type: 'info',
      timestamp: new Date().toISOString(),
    };
    const success = await sendWebhookAlert(config, testMessage);
    return { success, message: success ? 'Test sent' : 'Test failed' };
  });

  ipcMain.handle('notify:desktop', (_event, message: AlertMessage): void => {
    showDesktopNotification(message);
  });

  ipcMain.handle('notify:all', async (_event, webhooks: WebhookConfig[], message: AlertMessage): Promise<{ sent: number; failed: number }> => {
    let sent = 0;
    let failed = 0;
    for (const config of webhooks) {
      const success = await sendWebhookAlert(config, message);
      if (success) sent++; else failed++;
    }
    showDesktopNotification(message);
    return { sent, failed };
  });
}
