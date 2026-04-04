import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { registerConfigHandlers } from './ipc/config';
import { registerLatencyHandlers } from './ipc/latency';
import { registerEncryptionHandlers } from './ipc/encryption';
import { registerSyncHandlers } from './ipc/sync';
import { registerExportHandlers } from './ipc/export';
import { registerOAuthHandlers } from './ipc/oauth';
import { registerCredentialFileHandlers } from './ipc/credentialFile';
import { registerWebhookHandlers } from './ipc/webhook';
import { registerUsageHandlers } from './ipc/usage';
import { registerPromptTestHandlers } from './ipc/promptTest';
import { registerClipboardHandlers, cleanupClipboardTimers } from './ipc/clipboard';
import { registerAuditHandlers } from './ipc/audit';

if (process.platform === 'win32' && process.env.LLM_STATUS_VERBOSE_CHROMIUM_LOGS !== '1') {
  app.commandLine.appendSwitch('log-level', '3');
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Create a simple colored icon as native image
function createTrayIcon(status: 'green' | 'yellow' | 'red' | 'gray'): nativeImage {
  const size = 16;
  const colors: Record<string, string> = {
    green: '#22C55E',
    yellow: '#EAB308',
    red: '#EF4444',
    gray: '#6B7280',
  };
  const color = colors[status] || colors.gray;

  // Create a 16x16 PNG with a colored circle
  const canvas = Buffer.alloc(size * size * 4);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 1;

  // Parse hex color
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist <= radius) {
        canvas[idx] = r;
        canvas[idx + 1] = g;
        canvas[idx + 2] = b;
        canvas[idx + 3] = 255;
      } else {
        canvas[idx + 3] = 0;
      }
    }
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

function updateTrayIcon(status: 'green' | 'yellow' | 'red' | 'gray'): void {
  if (!tray) return;
  tray.setImage(createTrayIcon(status));
}

function createTray(): void {
  tray = new Tray(createTrayIcon('gray'));
  tray.setToolTip('LLM Status - Initializing...');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open LLM Status',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Check All Providers',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('tray:checkAll');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0F0F0F',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const url = details.url;
    // Only allow http/https URLs to be opened externally
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    const path = require('path');
    const rendererPath = path.join(__dirname, '../renderer/index.html');
    const distPublicPath = path.join(__dirname, '../dist/public/index.html');
    const distPath = path.join(__dirname, '../dist/index.html');
    const { existsSync } = require('fs');
    if (existsSync(rendererPath)) {
      mainWindow.loadFile(rendererPath);
    } else if (existsSync(distPublicPath)) {
      mainWindow.loadFile(distPublicPath);
    } else if (existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
    }
  }
}

app.whenReady().then(() => {
  registerConfigHandlers();
  registerLatencyHandlers();
  registerEncryptionHandlers();
  registerSyncHandlers();
  registerExportHandlers();
  registerOAuthHandlers();
  registerCredentialFileHandlers();
  registerWebhookHandlers();
  registerUsageHandlers();
  registerPromptTestHandlers();
  registerClipboardHandlers();
  registerAuditHandlers();

  createTray();
  createWindow();

  // Listen for tray status updates from renderer
  ipcMain.handle('tray:updateStatus', (_event, status: 'green' | 'yellow' | 'red' | 'gray') => {
    updateTrayIcon(status);
    if (tray) {
      const tooltips: Record<string, string> = {
        green: 'LLM Status - All providers healthy',
        yellow: 'LLM Status - Some providers have warnings',
        red: 'LLM Status - Some providers have errors',
        gray: 'LLM Status - Initializing...',
      };
      tray.setToolTip(tooltips[status] || tooltips.gray);
    }
  });

  // Screen recording protection (macOS only)
  ipcMain.handle('screenProtection:set', (_event, enabled: boolean) => {
    if (mainWindow && process.platform === 'darwin') {
      mainWindow.setContentProtection(enabled);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  cleanupClipboardTimers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
