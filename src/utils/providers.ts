/**
 * Provider endpoint configuration
 * Maps provider types to their API endpoints for latency checking and model listing
 */

export interface ProviderEndpoint {
  type: string;
  name: string;
  latencyEndpoint: string;
  modelEndpoint: string;
  method: 'GET' | 'HEAD' | 'POST';
  headers?: Record<string, string>;
  isStaticModelList?: boolean;
}

export const PROVIDER_ENDPOINTS: Record<string, ProviderEndpoint> = {
  openai: {
    type: 'openai',
    name: 'OpenAI',
    latencyEndpoint: '/v1/models',
    modelEndpoint: '/v1/models',
    method: 'GET',
  },
  anthropic: {
    type: 'anthropic',
    name: 'Anthropic',
    latencyEndpoint: '/v1/messages',
    modelEndpoint: '',
    method: 'HEAD',
    isStaticModelList: true,
  },
  google: {
    type: 'google',
    name: 'Google (Vertex AI)',
    latencyEndpoint: '/v1beta/models',
    modelEndpoint: '/v1beta/models',
    method: 'GET',
  },
  'azure-openai': {
    type: 'azure-openai',
    name: 'Azure OpenAI',
    latencyEndpoint: '/openai/models?api-version=2024-02-01',
    modelEndpoint: '/openai/models?api-version=2024-02-01',
    method: 'GET',
  },
  zhipu: {
    type: 'zhipu',
    name: 'Zhipu AI',
    latencyEndpoint: '/v1/models',
    modelEndpoint: '/v1/models',
    method: 'GET',
  },
  dashscope: {
    type: 'dashscope',
    name: 'DashScope (Qwen)',
    latencyEndpoint: '/compatible-mode/v1/models',
    modelEndpoint: '/compatible-mode/v1/models',
    method: 'GET',
  },
  qianfan: {
    type: 'qianfan',
    name: 'Qianfan (Baidu)',
    latencyEndpoint: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    modelEndpoint: '',
    method: 'POST',
    isStaticModelList: true,
  },
  vllm: {
    type: 'vllm',
    name: 'vLLM',
    latencyEndpoint: '/v1/models',
    modelEndpoint: '/v1/models',
    method: 'GET',
  },
  ollama: {
    type: 'ollama',
    name: 'Ollama',
    latencyEndpoint: '/api/tags',
    modelEndpoint: '/api/tags',
    method: 'GET',
  },
  localai: {
    type: 'localai',
    name: 'LocalAI',
    latencyEndpoint: '/v1/models',
    modelEndpoint: '/v1/models',
    method: 'GET',
  },
  custom: {
    type: 'custom',
    name: 'Custom',
    latencyEndpoint: '/v1/models',
    modelEndpoint: '/v1/models',
    method: 'GET',
  },
};

/**
 * Get endpoint config for a provider type
 */
export function getProviderEndpoint(type: string): ProviderEndpoint {
  return PROVIDER_ENDPOINTS[type] || PROVIDER_ENDPOINTS.custom;
}

/**
 * Get the full URL for a provider's endpoint
 */
export function getProviderUrl(baseUrl: string, endpoint: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}${endpoint}`;
}

/**
 * Build auth headers for a request
 */
export function buildAuthHeaders(
  providerType: string,
  apiKey?: string,
  accessToken?: string,
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (apiKey) {
    if (providerType === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  return headers;
}
