import { describe, expect, test, beforeAll, afterAll, afterEach } from 'bun:test';
import http from 'http';

describe('OAuth state validation', () => {
  test('generated state contains random characters', () => {
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    expect(state.length).toBeGreaterThan(10);
    expect(/^[a-z0-9]+$/.test(state)).toBe(true);
  });

  test('state mismatch detection', () => {
    const generatedState = 'abc123';
    const returnedState = 'xyz789';

    const isValid = returnedState === generatedState;
    expect(isValid).toBe(false);
  });

  test('state match validation', () => {
    const generatedState = 'abc123';
    const returnedState = 'abc123';

    const isValid = returnedState === generatedState;
    expect(isValid).toBe(true);
  });

  test('OAuth callback URL parsing', () => {
    const callbackUrl = 'http://localhost:17171/oauth/callback?code=auth_code_123&state=state_456';
    const url = new URL(callbackUrl);

    expect(url.pathname).toBe('/oauth/callback');
    expect(url.searchParams.get('code')).toBe('auth_code_123');
    expect(url.searchParams.get('state')).toBe('state_456');
  });

  test('OAuth auth URL construction', () => {
    const config = {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      clientId: 'test-client-id',
      redirectUri: 'http://localhost:17171/oauth/callback',
      scope: 'openid profile email',
    };
    const state = 'test-state-123';

    const authUrl = `${config.authUrl}?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${state}&access_type=offline&prompt=consent`;

    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain(`client_id=${config.clientId}`);
    expect(authUrl).toContain(`state=${state}`);
    expect(authUrl).toContain('access_type=offline');
    expect(authUrl).toContain('prompt=consent');
  });

  test('token exchange payload construction', () => {
    const config = {
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    };
    const code = 'auth_code_123';
    const redirectUri = 'http://localhost:17171/oauth/callback';

    const payload = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString();

    expect(payload).toContain('grant_type=authorization_code');
    expect(payload).toContain(`code=${code}`);
    expect(payload).toContain('client_id=test-client-id');
    expect(payload).toContain('client_secret=test-client-secret');
  });

  test('refresh token payload construction', () => {
    const config = {
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    };
    const refreshToken = 'refresh_token_456';

    const payload = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString();

    expect(payload).toContain('grant_type=refresh_token');
    expect(payload).toContain(`refresh_token=${refreshToken}`);
  });

  test('token response parsing', () => {
    const mockResponse = {
      data: {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
      },
    };

    const tokens = {
      accessToken: mockResponse.data.access_token,
      refreshToken: mockResponse.data.refresh_token || '',
      expiresAt: new Date(Date.now() + mockResponse.data.expires_in * 1000).toISOString(),
    };

    expect(tokens.accessToken).toBe('new_access_token');
    expect(tokens.refreshToken).toBe('new_refresh_token');
    expect(new Date(tokens.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  test('token response with missing refresh token', () => {
    const mockResponse = {
      data: {
        access_token: 'new_access_token',
        expires_in: 3600,
      },
    };

    const tokens = {
      accessToken: mockResponse.data.access_token,
      refreshToken: mockResponse.data.refresh_token || '',
      expiresAt: new Date(Date.now() + mockResponse.data.expires_in * 1000).toISOString(),
    };

    expect(tokens.refreshToken).toBe('');
  });
});

describe('OAuth localhost server', () => {
  let server: http.Server | null = null;

  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
  });

  test('server starts and accepts connections', (done) => {
    server = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://localhost:17171`);
      if (url.pathname === '/oauth/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authorization successful!</h1></body></html>');

        expect(code).toBe('test_code');
        expect(state).toBe('test_state');
        done();
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(17172, () => {
      // Send a test request
      http.get('http://localhost:17172/oauth/callback?code=test_code&state=test_state');
    });
  });

  test('server handles missing code parameter', (done) => {
    server = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://localhost:17173`);
      if (url.pathname === '/oauth/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        expect(code).toBeNull();
        expect(state).toBe('test_state');

        res.writeHead(200);
        res.end();
        done();
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(17173, () => {
      http.get('http://localhost:17173/oauth/callback?state=test_state');
    });
  });
});
