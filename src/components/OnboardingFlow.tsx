import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Provider, ProviderType, CredentialType, ProviderEnvironment } from '@/types';
import { validateApiKey, cleanApiKey, type KeyValidationResult } from '@/utils/keyValidation';

interface OnboardingFlowProps {
  onComplete: (provider: Provider) => void;
  onSkip: () => void;
}

const PROVIDER_OPTIONS: Array<{ type: ProviderType; name: string; icon: string; defaultBaseUrl: string }> = [
  { type: 'openai', name: 'OpenAI', icon: '🟢', defaultBaseUrl: 'https://api.openai.com' },
  { type: 'anthropic', name: 'Anthropic', icon: '🟣', defaultBaseUrl: 'https://api.anthropic.com' },
  { type: 'google', name: 'Google', icon: '🔵', defaultBaseUrl: 'https://us-central1-aiplatform.googleapis.com' },
  { type: 'azure-openai', name: 'Azure OpenAI', icon: '🔷', defaultBaseUrl: '' },
  { type: 'zhipu', name: '智谱 AI', icon: '🟠', defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  { type: 'dashscope', name: '通义千问', icon: '🟡', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { type: 'qianfan', name: '百度文心', icon: '🔶', defaultBaseUrl: 'https://aip.baidubce.com' },
  { type: 'ollama', name: 'Ollama', icon: '🐑', defaultBaseUrl: 'http://localhost:11434' },
  { type: 'vllm', name: 'vLLM', icon: '⚡', defaultBaseUrl: '' },
  { type: 'localai', name: 'LocalAI', icon: '🤖', defaultBaseUrl: '' },
  { type: 'custom', name: 'Custom', icon: '🔧', defaultBaseUrl: '' },
];

const CREDENTIAL_TYPES: Array<{ type: CredentialType; name: string; desc: string }> = [
  { type: 'api_key', name: 'API Key', desc: 'Standard API key authentication' },
  { type: 'oauth', name: 'OAuth 2.0', desc: 'Browser-based authorization' },
  { type: 'service_account', name: 'Service Account', desc: 'Google Cloud service account JSON' },
  { type: 'aws_iam', name: 'AWS IAM', desc: 'AWS access key + secret key' },
  { type: 'azure_entra_id', name: 'Azure Entra ID', desc: 'Service principal authentication' },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<ProviderType | null>(null);
  const [selectedCredType, setSelectedCredType] = useState<CredentialType>('api_key');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [providerName, setProviderName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [environment, setEnvironment] = useState<ProviderEnvironment>('personal');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<'success' | 'error' | null>(null);
  const [keyValidation, setKeyValidation] = useState<KeyValidationResult>({
    isValid: false,
    confidence: 'none',
    issues: [],
    suggestions: ['Paste your API key here'],
  });

  const totalSteps = 5;

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    const validation = validateApiKey(value, selectedType || undefined);
    setKeyValidation(validation);
  };

  const handleSelectProvider = (type: ProviderType) => {
    setSelectedType(type);
    const prov = PROVIDER_OPTIONS.find((p) => p.type === type);
    setProviderName(prov?.name || type);
    setBaseUrl(prov?.defaultBaseUrl || '');
    setStep(1);
  };

  const handleVerify = async () => {
    if (!apiKey || !baseUrl) return;
    setVerifying(true);
    setVerifyResult(null);

    try {
      const response = await fetch(`${baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        setVerifyResult('success');
      } else {
        setVerifyResult('error');
      }
    } catch {
      setVerifyResult('error');
    }

    setVerifying(false);
  };

  const handleConfirm = () => {
    if (!selectedType) return;

    const cleanedKey = cleanApiKey(apiKey);
    const provider: Provider = {
      id: `${selectedType}-${Date.now()}`,
      type: selectedType,
      name: providerName || selectedType,
      baseUrl,
      environment,
      credentials: cleanedKey ? [{
        id: `key-${Date.now()}`,
        type: selectedCredType,
        value: cleanedKey,
        encrypted: true,
        status: verifyResult === 'success' ? 'valid' : 'unknown',
        expiresAt: expiresAt || undefined,
      }] : [],
      latencyHistory: [],
      status: 'idle',
    };

    onComplete(provider);
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="onboarding-step">
      <div className="onboarding__icon">⚡</div>
      <h2 className="onboarding__title">{t('onboarding.welcome')}</h2>
      <p className="onboarding__desc">{t('onboarding.welcomeDesc')}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn--primary" onClick={() => setStep(1)}>{t('onboarding.getStarted')}</button>
        <button className="btn btn--ghost" onClick={onSkip}>{t('onboarding.skip')}</button>
      </div>
    </div>,

    // Step 1: Select provider type
    <div key="select" className="onboarding-step">
      <h2 className="onboarding__title">{t('onboarding.selectProvider')}</h2>
      <div className="onboarding__grid">
        {PROVIDER_OPTIONS.map((p) => (
          <button
            key={p.type}
            className={`onboarding__card ${selectedType === p.type ? 'onboarding__card--selected' : ''}`}
            onClick={() => handleSelectProvider(p.type)}
          >
            <span className="onboarding__card-icon">{p.icon}</span>
            <span className="onboarding__card-name">{p.name}</span>
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Select credential type
    <div key="credtype" className="onboarding-step">
      <h2 className="onboarding__title">{t('onboarding.selectAuth')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {CREDENTIAL_TYPES.map((ct) => (
          <button
            key={ct.type}
            className={`onboarding__card onboarding__card--horizontal ${selectedCredType === ct.type ? 'onboarding__card--selected' : ''}`}
            onClick={() => setSelectedCredType(ct.type)}
          >
            <div>
              <div className="onboarding__card-name">{ct.name}</div>
              <div className="onboarding__card-desc">{ct.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="onboarding__nav">
        <button className="btn btn--ghost" onClick={() => setStep(1)}>{t('onboarding.back')}</button>
        <button className="btn btn--primary" onClick={() => setStep(3)}>{t('onboarding.next')}</button>
      </div>
    </div>,

    // Step 3: Enter credentials
    <div key="credentials" className="onboarding-step">
      <h2 className="onboarding__title">{t('onboarding.enterCredentials')}</h2>
      <div className="onboarding__form">
        <div className="onboarding__field">
          <label>{t('onboarding.providerName')}</label>
          <input
            type="text"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            className="onboarding__input"
            placeholder="My Provider"
          />
        </div>
        <div className="onboarding__field">
          <label>{t('onboarding.baseUrl')}</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="onboarding__input"
            placeholder="https://api.example.com"
          />
        </div>
        {selectedCredType === 'api_key' && (
          <div className="onboarding__field">
            <label>{t('onboarding.apiKey')}</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className={`onboarding__input onboarding__input--${keyValidation.confidence === 'high' ? 'valid' : keyValidation.issues.length > 0 ? 'invalid' : 'neutral'}`}
              placeholder="sk-..."
              autoComplete="off"
              spellCheck={false}
            />
            {apiKey && (
              <div className="onboarding__key-feedback">
                {keyValidation.issues.length > 0 && (
                  <div className="onboarding__key-issues">
                    {keyValidation.issues.map((issue, i) => (
                      <span key={i} className="onboarding__key-issue">⚠️ {issue}</span>
                    ))}
                  </div>
                )}
                {keyValidation.suggestions.length > 0 && !keyValidation.issues.length && (
                  <div className={`onboarding__key-suggestion onboarding__key-suggestion--${keyValidation.confidence}`}>
                    {keyValidation.confidence === 'high' ? '✅' : keyValidation.confidence === 'medium' ? '🔍' : '❓'} {keyValidation.suggestions[0]}
                  </div>
                )}
                {keyValidation.detectedProvider && (
                  <div className="onboarding__key-provider">Detected: {keyValidation.detectedProvider}</div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="onboarding__field">
          <label>{t('onboarding.expiresAt', 'Expiry date (optional)')}</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="onboarding__input"
          />
        </div>
        <div className="onboarding__field">
          <label>{t('onboarding.environment', 'Environment')}</label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as ProviderEnvironment)}
            className="onboarding__input"
          >
            <option value="personal">🏠 Personal</option>
            <option value="work">💼 Work</option>
            <option value="production">🚀 Production</option>
            <option value="staging">🧪 Staging</option>
            <option value="custom">🔧 Custom</option>
          </select>
        </div>
        <button
          className="btn btn--primary"
          onClick={handleVerify}
          disabled={verifying || !apiKey || !baseUrl}
        >
          {verifying ? t('onboarding.verifying') : t('onboarding.verify')}
        </button>
        {verifyResult === 'success' && (
          <div className="onboarding__success">✅ {t('onboarding.verifySuccess')}</div>
        )}
        {verifyResult === 'error' && (
          <div className="onboarding__error">❌ {t('onboarding.verifyError')}</div>
        )}
      </div>
      <div className="onboarding__nav">
        <button className="btn btn--ghost" onClick={() => setStep(2)}>{t('onboarding.back')}</button>
        <button className="btn btn--primary" onClick={() => setStep(4)} disabled={!baseUrl}>{t('onboarding.next')}</button>
      </div>
    </div>,

    // Step 4: Security notice + confirm
    <div key="confirm" className="onboarding-step">
      <div className="onboarding__icon">🔒</div>
      <h2 className="onboarding__title">{t('onboarding.security')}</h2>
      <p className="onboarding__desc">{t('onboarding.securityDesc')}</p>
      <ul className="onboarding__list">
        <li>🔐 {t('onboarding.securityEncrypted')}</li>
        <li>☁️ {t('onboarding.securitySync')}</li>
        <li>📤 {t('onboarding.securityExport')}</li>
      </ul>
      <div className="onboarding__nav">
        <button className="btn btn--ghost" onClick={() => setStep(3)}>{t('onboarding.back')}</button>
        <button className="btn btn--primary" onClick={handleConfirm}>{t('onboarding.finish')}</button>
      </div>
    </div>,
  ];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding">
        <div className="onboarding__progress">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`onboarding__progress-dot ${i <= step ? 'onboarding__progress-dot--active' : ''}`}
            />
          ))}
        </div>
        {steps[step]}
      </div>
    </div>
  );
};
