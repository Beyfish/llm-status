import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Provider, ProviderType, CredentialType } from '@/types';

interface SmartImportModalProps {
  onClose: () => void;
  onImport: (provider: Provider) => void;
}

interface ParsedConfig {
  providerType: ProviderType | 'unknown';
  providerName?: string;
  baseUrl?: string;
  apiKey?: string;
  apiVersion?: string;
  region?: string;
  notes?: string;
  confidence: number;
}

const PROVIDER_PATTERNS: Record<string, { type: ProviderType; patterns: RegExp[]; defaultBaseUrl: string }> = {
  openai: {
    type: 'openai',
    patterns: [/openai\.com/i, /api\.openai\.com/i, /gpt-?4/i, /gpt-?3\.5/i],
    defaultBaseUrl: 'https://api.openai.com',
  },
  anthropic: {
    type: 'anthropic',
    patterns: [/anthropic/i, /claude/i, /api\.anthropic\.com/i],
    defaultBaseUrl: 'https://api.anthropic.com',
  },
  google: {
    type: 'google',
    patterns: [/googleapis\.com/i, /vertexai/i, /gemini/i, /aiplatform\.googleapis\.com/i],
    defaultBaseUrl: 'https://us-central1-aiplatform.googleapis.com',
  },
  'azure-openai': {
    type: 'azure-openai',
    patterns: [/openai\.azure\.com/i, /azure.*openai/i],
    defaultBaseUrl: '',
  },
  zhipu: {
    type: 'zhipu',
    patterns: [/zhipuai/i, /bigmodel\.cn/i, /open\.bigmodel\.cn/i, /glm-?4/i],
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  dashscope: {
    type: 'dashscope',
    patterns: [/dashscope/i, /qwen/i, /dashscope\.aliyuncs\.com/i, /通义/i],
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
  qianfan: {
    type: 'qianfan',
    patterns: [/qianfan/i, /baidu.*ai/i, /wenxin/i, /文心/i],
    defaultBaseUrl: 'https://aip.baidubce.com',
  },
  ollama: {
    type: 'ollama',
    patterns: [/ollama/i, /localhost:11434/i],
    defaultBaseUrl: 'http://localhost:11434',
  },
  vllm: {
    type: 'vllm',
    patterns: [/vllm/i],
    defaultBaseUrl: '',
  },
  localai: {
    type: 'localai',
    patterns: [/localai/i],
    defaultBaseUrl: '',
  },
};

function detectProvider(text: string): { type: ProviderType; confidence: number; name?: string } {
  let bestMatch: { type: ProviderType; score: number; name?: string } = { type: 'custom', score: 0 };

  for (const [key, config] of Object.entries(PROVIDER_PATTERNS)) {
    let score = 0;
    for (const pattern of config.patterns) {
      if (pattern.test(text)) score++;
    }
    if (score > bestMatch.score) {
      bestMatch = { type: config.type, score, name: key };
    }
  }

  const confidence = Math.min(bestMatch.score / 2, 1);
  return { type: bestMatch.type, confidence, name: bestMatch.name };
}

function extractBaseUrl(text: string): string | undefined {
  const urlMatch = text.match(/https?:\/\/[^\s"'<>]+/);
  return urlMatch ? urlMatch[0].replace(/\/+$/, '') : undefined;
}

function extractApiKey(text: string): string | undefined {
  const patterns = [
    /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/i,
    /["']?(sk-[a-zA-Z0-9_-]{20,})["']?/,
    /["']?(Bearer\s+)?([a-zA-Z0-9_-]{32,})["']?/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] || match[2] || match[0];
  }
  return undefined;
}

function parseJsonConfig(text: string): ParsedConfig {
  try {
    const json = JSON.parse(text);
    const result: ParsedConfig = {
      providerType: 'custom',
      confidence: 0.5,
    };

    if (json.provider || json.provider_type || json.type) {
      const typeStr = (json.provider || json.provider_type || json.type || '').toLowerCase();
      for (const [key, config] of Object.entries(PROVIDER_PATTERNS)) {
        if (typeStr.includes(key) || typeStr.includes(config.type)) {
          result.providerType = config.type;
          result.confidence = 0.9;
          break;
        }
      }
    }

    if (json.base_url || json.baseUrl || json.endpoint) {
      result.baseUrl = json.base_url || json.baseUrl || json.endpoint;
    }

    if (json.api_key || json.apiKey || json.key) {
      result.apiKey = json.api_key || json.apiKey || json.key;
    }

    if (json.name || json.provider_name) {
      result.providerName = json.name || json.provider_name;
    }

    if (json.api_version || json.apiVersion) {
      result.apiVersion = json.api_version || json.apiVersion;
    }

    if (json.region) {
      result.region = json.region;
    }

    return result;
  } catch {
    return { providerType: 'custom', confidence: 0 };
  }
}

function parseTextConfig(text: string): ParsedConfig {
  const detection = detectProvider(text);
  const baseUrl = extractBaseUrl(text);
  const apiKey = extractApiKey(text);

  const providerConfig = PROVIDER_PATTERNS[detection.type];

  return {
    providerType: detection.type,
    providerName: detection.name,
    baseUrl: baseUrl || providerConfig?.defaultBaseUrl,
    apiKey,
    confidence: detection.confidence,
  };
}

export const SmartImportModal: React.FC<SmartImportModalProps> = ({ onClose, onImport }) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'text' | 'json' | 'url'>('text');
  const [parsed, setParsed] = useState<ParsedConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Provider>>({});

  const handleParse = useCallback(() => {
    let result: ParsedConfig;
    if (inputType === 'json') {
      result = parseJsonConfig(inputText);
    } else if (inputType === 'url') {
      result = {
        providerType: 'custom',
        baseUrl: inputText.trim().replace(/\/+$/, ''),
        confidence: 0.3,
      };
    } else {
      result = parseTextConfig(inputText);
    }
    setParsed(result);
    setEditing(false);
  }, [inputText, inputType]);

  const handleConfirm = useCallback(() => {
    if (!parsed) return;

    const provider: Provider = {
      id: `${parsed.providerType}-${Date.now()}`,
      type: parsed.providerType === 'unknown' ? 'custom' : parsed.providerType,
      name: editForm.name || parsed.providerName || parsed.providerType,
      baseUrl: editForm.baseUrl || parsed.baseUrl || '',
      credentials: parsed.apiKey ? [{
        id: `key-${Date.now()}`,
        type: 'api_key' as CredentialType,
        value: parsed.apiKey,
        encrypted: true,
        status: 'unknown' as const,
      }] : [],
      latencyHistory: [],
      status: 'idle' as const,
    };

    onImport(provider);
    onClose();
  }, [parsed, editForm, onImport, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('smartImport.title')}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['text', 'json', 'url'] as const).map((type) => (
              <button
                key={type}
                className={`btn ${inputType === type ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setInputType(type)}
              >
                {type === 'text' ? 'Text' : type === 'json' ? 'JSON' : 'URL'}
              </button>
            ))}
          </div>

          <textarea
            className="smart-import__textarea"
            placeholder={
              inputType === 'text' ? t('smartImport.textPlaceholder') :
              inputType === 'json' ? t('smartImport.jsonPlaceholder') :
              t('smartImport.urlPlaceholder')
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
          />

          <button className="btn btn--primary" onClick={handleParse} style={{ marginTop: '12px' }}>
            {t('smartImport.parse')}
          </button>

          {parsed && (
            <div className="smart-import__result">
              <h3>{t('smartImport.result')}</h3>
              <div className="smart-import__fields">
                <div className="smart-import__field">
                  <label>{t('smartImport.providerType')}</label>
                  <span className="mono">{parsed.providerType}</span>
                  <span className="smart-import__confidence">
                    {Math.round(parsed.confidence * 100)}% {t('smartImport.confidence')}
                  </span>
                </div>
                {parsed.baseUrl && (
                  <div className="smart-import__field">
                    <label>{t('smartImport.baseUrl')}</label>
                    <span className="mono" style={{ fontSize: '12px' }}>{parsed.baseUrl}</span>
                  </div>
                )}
                {parsed.apiKey && (
                  <div className="smart-import__field">
                    <label>{t('smartImport.apiKey')}</label>
                    <span className="mono" style={{ fontSize: '12px' }}>
                      sk-****{parsed.apiKey.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setEditing(true);
                  setEditForm({
                    name: parsed.providerName || parsed.providerType,
                    baseUrl: parsed.baseUrl,
                  });
                }}
              >
                {t('smartImport.edit')}
              </button>
            </div>
          )}

          {editing && (
            <div className="smart-import__edit">
              <div className="smart-import__field">
                <label>{t('smartImport.name')}</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="smart-import__input"
                />
              </div>
              <div className="smart-import__field">
                <label>{t('smartImport.baseUrl')}</label>
                <input
                  type="text"
                  value={editForm.baseUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, baseUrl: e.target.value })}
                  className="smart-import__input"
                />
              </div>
            </div>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>{t('modal.cancel')}</button>
          <button
            className="btn btn--primary"
            onClick={handleConfirm}
            disabled={!parsed}
          >
            {t('smartImport.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
