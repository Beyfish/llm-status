import { describe, it, expect } from 'vitest';

describe('Provider Endpoint Configuration', () => {
  it('should have correct OpenAI endpoint', async () => {
    const { getProviderEndpoint } = await import('@/utils/providers');
    const endpoint = getProviderEndpoint('openai');
    expect(endpoint.latencyEndpoint).toBe('/v1/models');
    expect(endpoint.method).toBe('GET');
  });

  it('should have correct Anthropic endpoint', async () => {
    const { getProviderEndpoint } = await import('@/utils/providers');
    const endpoint = getProviderEndpoint('anthropic');
    expect(endpoint.latencyEndpoint).toBe('/v1/messages');
    expect(endpoint.method).toBe('HEAD');
  });

  it('should return custom endpoint for unknown provider', async () => {
    const { getProviderEndpoint } = await import('@/utils/providers');
    const endpoint = getProviderEndpoint('unknown');
    expect(endpoint.type).toBe('custom');
    expect(endpoint.latencyEndpoint).toBe('/v1/models');
  });

  it('should build correct provider URL', async () => {
    const { getProviderUrl } = await import('@/utils/providers');
    const url = getProviderUrl('https://api.openai.com', '/v1/models');
    expect(url).toBe('https://api.openai.com/v1/models');
  });

  it('should strip trailing slash from base URL', async () => {
    const { getProviderUrl } = await import('@/utils/providers');
    const url = getProviderUrl('https://api.openai.com/', '/v1/models');
    expect(url).toBe('https://api.openai.com/v1/models');
  });

  it('should build correct auth headers for OpenAI', async () => {
    const { buildAuthHeaders } = await import('@/utils/providers');
    const headers = buildAuthHeaders('openai', 'sk-test-key');
    expect(headers['Authorization']).toBe('Bearer sk-test-key');
  });

  it('should build correct auth headers for Anthropic', async () => {
    const { buildAuthHeaders } = await import('@/utils/providers');
    const headers = buildAuthHeaders('anthropic', 'sk-ant-key');
    expect(headers['x-api-key']).toBe('sk-ant-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
  });

  it('should use access token over API key', async () => {
    const { buildAuthHeaders } = await import('@/utils/providers');
    const headers = buildAuthHeaders('openai', 'sk-key', 'ya29-token');
    expect(headers['Authorization']).toBe('Bearer ya29-token');
  });
});
