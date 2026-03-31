import { app, BrowserWindow, ipcMain, shell } from 'electron';
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

let mainWindow: BrowserWindow | null = null;

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
      preload: join(__dirname, '../preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
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

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
