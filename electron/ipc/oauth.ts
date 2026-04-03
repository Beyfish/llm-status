import { ipcMain, shell } from 'electron';
import http from 'http';
import axios from 'axios';
import { randomBytes } from 'crypto';

interface OAuthConfig {
  provider: string;
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
}

let oauthServer: http.Server | null = null;

function startOAuthServer(port: number): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    if (oauthServer) {
      oauthServer.close();
    }

    oauthServer = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://localhost:${port}`);
      if (url.pathname === '/oauth/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authorization successful!</h1><p>You can close this window.</p><script>window.close();</script></body></html>');
        if (code && state) {
          resolve({ code, state });
        }
        if (oauthServer) {
          oauthServer.close();
          oauthServer = null;
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    oauthServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        startOAuthServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });

    oauthServer.listen(port);
  });
}

async function exchangeCodeForToken(config: OAuthConfig, code: string, redirectUri: string): Promise<Record<string, string>> {
  const response = await axios.post(config.tokenUrl, new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  }).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token || '',
    expiresAt: new Date(Date.now() + response.data.expires_in * 1000).toISOString(),
  };
}

export function registerOAuthHandlers(): void {
  ipcMain.handle('oauth:start', async (_event, config: OAuthConfig): Promise<Record<string, string>> => {
    try {
      let port = 17171;
      const redirectUri = config.redirectUri || `http://localhost:${port}/oauth/callback`;
      const state = randomBytes(32).toString('hex');
      const authUrl = `${config.authUrl}?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${state}&access_type=offline&prompt=consent`;

      shell.openExternal(authUrl);

      const { code, state: returnedState } = await startOAuthServer(port);

      // Validate state to prevent CSRF
      if (returnedState !== state) {
        throw new Error(`OAuth state mismatch: expected ${state}, got ${returnedState}`);
      }

      const tokens = await exchangeCodeForToken(config, code, redirectUri);
      return tokens;
    } catch (err: any) {
      throw new Error(`OAuth failed: ${err.message}`);
    }
  });

  ipcMain.handle('oauth:refresh', async (_event, config: OAuthConfig, refreshToken: string): Promise<Record<string, string>> => {
    const response = await axios.post(config.tokenUrl, new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000).toISOString(),
    };
  });
}
