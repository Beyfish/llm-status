// API Key validation utilities for inline validation during input
// Provides real-time feedback on key format, common issues, and provider-specific patterns

export interface KeyValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  issues: string[];
  suggestions: string[];
  detectedProvider?: string;
}

// Provider-specific key patterns
const PROVIDER_KEY_PATTERNS: Record<string, { pattern: RegExp; name: string; minLength: number }> = {
  openai: {
    pattern: /^sk-[a-zA-Z0-9_-]{20,}$/,
    name: 'OpenAI',
    minLength: 20,
  },
  openaiProject: {
    pattern: /^sk-proj-[a-zA-Z0-9_-]{20,}$/,
    name: 'OpenAI (Project)',
    minLength: 28,
  },
  anthropic: {
    pattern: /^sk-ant-[a-zA-Z0-9_-]{20,}$/,
    name: 'Anthropic',
    minLength: 20,
  },
  google: {
    pattern: /^AIza[a-zA-Z0-9_-]{20,}$/,
    name: 'Google',
    minLength: 24,
  },
  zhipu: {
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    name: '智谱 AI',
    minLength: 20,
  },
  dashscope: {
    pattern: /^sk-[a-zA-Z0-9_-]{20,}$/,
    name: '通义千问',
    minLength: 20,
  },
  qianfan: {
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    name: '百度文心',
    minLength: 20,
  },
  azure: {
    pattern: /^[a-fA-F0-9]{32}$/,
    name: 'Azure OpenAI',
    minLength: 32,
  },
};

// Common issues detection
const COMMON_ISSUES: Array<{
  check: (key: string) => boolean;
  message: string;
}> = [
  {
    check: (key) => key.startsWith(' ') || key.endsWith(' '),
    message: 'Contains leading/trailing whitespace',
  },
  {
    check: (key) => key.includes('\n') || key.includes('\r'),
    message: 'Contains line breaks',
  },
  {
    check: (key) => key.includes('"') || key.includes("'"),
    message: 'Contains quote characters',
  },
  {
    check: (key) => key.startsWith('Bearer '),
    message: 'Remove "Bearer " prefix — only the key value is needed',
  },
  {
    check: (key) => key.startsWith('API_KEY=') || key.startsWith('api_key='),
    message: 'Remove variable assignment — only the key value is needed',
  },
  {
    check: (key) => key.length < 10,
    message: 'Key seems too short — most API keys are 20+ characters',
  },
  {
    check: (key) => /^[a-zA-Z0-9]+$/.test(key) && key.length > 100,
    message: 'Key seems unusually long — verify it\'s correct',
  },
];

export function validateApiKey(key: string, providerType?: string): KeyValidationResult {
  const result: KeyValidationResult = {
    isValid: false,
    confidence: 'none',
    issues: [],
    suggestions: [],
  };

  // Empty check
  if (!key || key.trim().length === 0) {
    result.suggestions.push('Paste your API key here');
    return result;
  }

  // Clean the key for analysis (but report issues with original)
  const trimmedKey = key.trim();

  // Check common issues
  for (const issue of COMMON_ISSUES) {
    if (issue.check(key)) {
      result.issues.push(issue.message);
    }
  }

  // Detect provider from key pattern
  let detectedProvider: string | undefined;
  for (const [, config] of Object.entries(PROVIDER_KEY_PATTERNS)) {
    if (config.pattern.test(trimmedKey)) {
      detectedProvider = config.name;
      result.detectedProvider = detectedProvider;
      break;
    }
  }

  // Check if key matches expected provider
  if (providerType && PROVIDER_KEY_PATTERNS[providerType]) {
    const providerPattern = PROVIDER_KEY_PATTERNS[providerType];
    if (providerPattern.pattern.test(trimmedKey)) {
      result.isValid = true;
      result.confidence = 'high';
      result.suggestions.push(`✓ Valid ${providerPattern.name} API key format`);
    } else if (trimmedKey.length >= providerPattern.minLength) {
      result.isValid = true;
      result.confidence = 'medium';
      result.suggestions.push(`Key length looks reasonable for ${providerPattern.name}`);
    } else {
      result.confidence = 'low';
      result.suggestions.push(`Key doesn't match expected ${providerPattern.name} format`);
    }
  } else if (detectedProvider) {
    result.isValid = true;
    result.confidence = 'high';
    result.suggestions.push(`✓ Detected ${detectedProvider} API key format`);
  } else if (trimmedKey.length >= 20) {
    result.isValid = true;
    result.confidence = 'low';
    result.suggestions.push('Key length looks reasonable, but format is unrecognized');
  } else {
    result.confidence = 'none';
    result.suggestions.push('Key format not recognized');
  }

  return result;
}

// Get a cleaned version of the key (removes common mistakes)
export function cleanApiKey(key: string): string {
  let cleaned = key.trim();

  // Remove common prefixes
  if (cleaned.startsWith('Bearer ')) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith('API_KEY=')) {
    cleaned = cleaned.slice(8);
  }
  if (cleaned.startsWith('api_key=')) {
    cleaned = cleaned.slice(8);
  }

  // Remove surrounding quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned.trim();
}
