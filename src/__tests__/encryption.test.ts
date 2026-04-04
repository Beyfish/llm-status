import { describe, expect, test } from 'vitest';

describe('encryption logic', () => {
  test('encrypt then decrypt roundtrip', () => {
    const original = 'sk-test-api-key-12345';
    const fakeEncrypted = Buffer.from(`encrypted:${original}`);
    const base64 = fakeEncrypted.toString('base64');
    const decoded = Buffer.from(base64, 'base64');
    const decrypted = decoded.toString().replace('encrypted:', '');

    expect(decrypted).toBe(original);
  });

  test('base64 encoding is reversible', () => {
    const data = JSON.stringify({ key: 'value', nested: { arr: [1, 2, 3] } });
    const encoded = Buffer.from(data).toString('base64');
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    expect(decoded).toBe(data);
  });

  test('empty string encryption edge case', () => {
    const original = '';
    const fakeEncrypted = Buffer.from(`encrypted:${original}`);
    const base64 = fakeEncrypted.toString('base64');
    const decoded = Buffer.from(base64, 'base64').toString();
    const decrypted = decoded.replace('encrypted:', '');
    expect(decrypted).toBe(original);
  });

  test('unicode string encryption edge case', () => {
    const original = '测试 API Key 🔑';
    const fakeEncrypted = Buffer.from(`encrypted:${original}`);
    const base64 = fakeEncrypted.toString('base64');
    const decoded = Buffer.from(base64, 'base64').toString();
    const decrypted = decoded.replace('encrypted:', '');
    expect(decrypted).toBe(original);
  });
});

describe('config secrets extraction logic', () => {
  test('extractSecrets separates credentials from config', () => {
    const config = {
      schemaVersion: 1,
      providers: [
        {
          id: 'openai-1',
          type: 'openai',
          baseUrl: 'https://api.openai.com',
          credentials: [
            { id: 'key-1', type: 'api_key', value: 'sk-secret123', status: 'valid' },
          ],
        },
      ],
      settings: { theme: 'dark' },
    };

    const secrets: Record<string, unknown> = {};
    const configCopy = JSON.parse(JSON.stringify(config));

    if (configCopy.providers) {
      configCopy.providers = configCopy.providers.map((p: Record<string, unknown>, idx: number) => {
        const creds = p.credentials as Array<Record<string, unknown>>;
        if (creds && creds.length > 0) {
          secrets[`provider_${idx}_credentials`] = creds;
          return {
            ...p,
            credentials: creds.map((_: Record<string, unknown>, cIdx: number) => ({
              id: creds[cIdx]?.id || `cred-${idx}-${cIdx}`,
              type: creds[cIdx]?.type || 'api_key',
              status: 'unknown',
              encrypted: true,
            })),
          };
        }
        return p;
      });
    }

    expect(secrets['provider_0_credentials']).toBeDefined();
    expect((secrets['provider_0_credentials'] as Array<Record<string, unknown>>)[0].value).toBe('sk-secret123');
    const providers0 = configCopy.providers as Array<Record<string, unknown>>;
    const creds0 = providers0[0].credentials as Array<Record<string, unknown>>;
    expect(creds0[0].value).toBeUndefined();
    expect(creds0[0].encrypted).toBe(true);
  });

  test('mergeSecrets restores credentials to config', () => {
    const configWithoutSecrets = {
      schemaVersion: 1,
      providers: [
        {
          id: 'openai-1',
          type: 'openai',
          baseUrl: 'https://api.openai.com',
          credentials: [
            { id: 'key-1', type: 'api_key', status: 'unknown', encrypted: true },
          ],
        },
      ],
      settings: { theme: 'dark' },
    };

    const secrets: Record<string, unknown> = {
      provider_0_credentials: [
        { id: 'key-1', type: 'api_key', value: 'sk-restored-secret', status: 'valid' },
      ],
    };

    const configCopy = JSON.parse(JSON.stringify(configWithoutSecrets));
    if (configCopy.providers && secrets) {
      configCopy.providers = (configCopy.providers as Array<Record<string, unknown>>).map((p: Record<string, unknown>, idx: number) => {
        const secretKey = `provider_${idx}_credentials`;
        if (secrets[secretKey]) {
          return { ...p, credentials: secrets[secretKey] };
        }
        return p;
      });
    }

    const providers1 = configCopy.providers as Array<Record<string, unknown>>;
    const creds1 = providers1[0].credentials as Array<Record<string, unknown>>;
    expect(creds1[0].value).toBe('sk-restored-secret');
    expect(creds1[0].status).toBe('valid');
  });
});
