import { ipcMain } from 'electron';

export function registerOAuthHandlers(): void {
  ipcMain.handle('oauth:start', async (): Promise<void> => {
    // TODO: implement OAuth flow
  });
}
