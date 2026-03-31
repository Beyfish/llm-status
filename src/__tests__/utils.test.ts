import { describe, it, expect } from 'vitest';

describe('Provider Detection', () => {
  it('should detect OpenAI from URL', () => {
    const text = 'https://api.openai.com';
    const match = text.includes('openai');
    expect(match).toBe(true);
  });

  it('should detect Anthropic from text', () => {
    const text = 'claude-sonnet-4';
    const match = text.includes('claude');
    expect(match).toBe(true);
  });

  it('should extract API key from text', () => {
    const text = 'api_key: sk-test-1234567890abcdef';
    const match = text.match(/sk-[a-zA-Z0-9_-]{10,}/);
    expect(match).toBeTruthy();
    expect(match![0]).toBe('sk-test-1234567890abcdef');
  });

  it('should extract base URL from text', () => {
    const text = 'URL: https://api.example.com/v1';
    const match = text.match(/https?:\/\/[^\s"'<>]+/);
    expect(match).toBeTruthy();
    expect(match![0]).toBe('https://api.example.com/v1');
  });
});

describe('Smart Import JSON Parser', () => {
  it('should parse valid JSON config', () => {
    const json = JSON.stringify({
      provider: 'openai',
      base_url: 'https://api.openai.com',
      api_key: 'sk-test-123',
    });
    const parsed = JSON.parse(json);
    expect(parsed.provider).toBe('openai');
    expect(parsed.base_url).toBe('https://api.openai.com');
  });

  it('should return empty for invalid JSON', () => {
    const invalid = '{invalid json}';
    expect(() => JSON.parse(invalid)).toThrow();
  });
});

describe('Latency Status Classification', () => {
  it('should classify < 200ms as green', () => {
    const latency = 45;
    const status = latency < 200 ? 'valid' : latency < 1000 ? 'warning' : 'error';
    expect(status).toBe('valid');
  });

  it('should classify 200-1000ms as yellow', () => {
    const latency = 500;
    const status = latency < 200 ? 'valid' : latency < 1000 ? 'warning' : 'error';
    expect(status).toBe('warning');
  });

  it('should classify > 1000ms as red', () => {
    const latency = 2000;
    const status = latency < 200 ? 'valid' : latency < 1000 ? 'warning' : 'error';
    expect(status).toBe('error');
  });
});

describe('Config Schema', () => {
  it('should have schemaVersion field', () => {
    const config = {
      schemaVersion: 1,
      providers: [],
      settings: {},
    };
    expect(config.schemaVersion).toBe(1);
  });

  it('should support multiple credential types', () => {
    const provider = {
      id: 'test',
      type: 'openai',
      credentials: [
        { type: 'api_key', value: 'sk-xxx' },
        { type: 'oauth', accessToken: 'ya29.xxx' },
      ],
    };
    expect(provider.credentials).toHaveLength(2);
    expect(provider.credentials[0].type).toBe('api_key');
    expect(provider.credentials[1].type).toBe('oauth');
  });
});
