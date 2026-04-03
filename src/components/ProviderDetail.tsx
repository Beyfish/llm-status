import React, { useMemo, useState } from 'react';
import type { Provider } from '@/types';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

interface ProviderDetailProps {
  provider: Provider;
  onClose: () => void;
}

export const ProviderDetail: React.FC<ProviderDetailProps> = ({ provider, onClose }) => {
  const { t } = useTranslation();
  const { latencyResults, latencyStatus, checkLatency } = useStore();
  const [copiedCredId, setCopiedCredId] = useState<string | null>(null);

  const latencyData = latencyResults[provider.id];
  const providerLatencyStatus = latencyStatus[provider.id] ?? 'idle';
  const statusLabel = provider.status === 'valid' ? t('status.valid') : provider.status === 'warning' ? t('status.warning') : provider.status === 'error' ? t('status.error') : t('status.idle');

  const handleCopyCurl = async (credId: string) => {
    const cred = provider.credentials.find((c) => c.id === credId);
    if (!cred || !cred.value) return;

    const endpoint = provider.baseUrl || '';
    let curl = '';

    if (provider.type === 'anthropic') {
      curl = `curl -X POST "${endpoint}/v1/messages" \\
  -H "x-api-key: ${cred.value}" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{"model":"claude-sonnet-4","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'`;
    } else if (provider.type === 'google') {
      curl = `curl -X GET "${endpoint}/v1beta/models?key=${cred.value}"`;
    } else {
      // Default OpenAI-compatible
      curl = `curl -X GET "${endpoint}/v1/models" \\
  -H "Authorization: Bearer ${cred.value}"`;
    }

    await navigator.clipboard.writeText(curl);
    setCopiedCredId(credId);
    setTimeout(() => setCopiedCredId(null), 2000);
  };

  const models = useMemo(() => {
    // Static model data - would be loaded from public/models/*.json in production
    const modelMap: Record<string, Array<{ name: string; price: string; capabilities: string; available: boolean }>> = {
      openai: [
        { name: 'gpt-4o', price: '$2.50/1M', capabilities: 'Text + Vision', available: true },
        { name: 'gpt-4o-mini', price: '$0.15/1M', capabilities: 'Text', available: true },
        { name: 'o1', price: '$15.00/1M', capabilities: 'Reasoning', available: true },
        { name: 'gpt-3.5-turbo', price: '$0.50/1M', capabilities: 'Text', available: true },
      ],
      anthropic: [
        { name: 'claude-sonnet-4', price: '$3.00/1M', capabilities: 'Text + Vision', available: true },
        { name: 'claude-opus-4', price: '$15.00/1M', capabilities: 'Text + Vision', available: true },
        { name: 'claude-haiku-3.5', price: '$0.80/1M', capabilities: 'Text', available: true },
      ],
    };
    return modelMap[provider.type] || [];
  }, [provider.type]);

  return (
    <div className="provider-detail" role="region" aria-label={`${provider.name} details`}>
      <div className="provider-detail__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`status-dot status-dot--${provider.status}`} />
          <h2 className="provider-detail__name">{provider.name}</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>
            {providerLatencyStatus === 'checking'
              ? t('modal.checking')
              : latencyData?.status === 'success'
                ? `${latencyData.latency}ms`
                : latencyData?.status === 'timeout'
                  ? t('card.timeout')
                  : statusLabel}
          </span>
          <button className="btn btn--primary" onClick={() => checkLatency(provider.id, 'full')} disabled={providerLatencyStatus === 'checking'}>
            {providerLatencyStatus === 'checking' ? t('modal.checking') : t('header.checkAll')}
          </button>
          <button className="btn btn--ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>

      <div className="provider-detail__section">
        <h3 className="provider-detail__section-title">{t('detail.models')}</h3>
        <div className="provider-detail__table">
          <div className="provider-detail__table-header">
            <span>{t('detail.modelName')}</span>
            <span>{t('detail.price')}</span>
            <span>{t('detail.capabilities')}</span>
            <span>{t('detail.status')}</span>
          </div>
          {models.map((m) => (
            <div key={m.name} className="provider-detail__table-row">
              <span className="mono">{m.name}</span>
              <span className="mono" style={{ color: 'var(--text-secondary)' }}>{m.price}</span>
              <span>{m.capabilities}</span>
              <span>{m.available ? '✅' : '⚠️'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="provider-detail__section">
        <h3 className="provider-detail__section-title">{t('detail.credentials')}</h3>
        <div className="provider-detail__credentials">
          {provider.credentials.map((cred) => (
            <div key={cred.id} className="provider-detail__credential">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <span className={`status-dot status-dot--${cred.status}`} />
                <span className="mono" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cred.type === 'api_key' ? `sk-****${(cred.value || '').slice(-4)}` : cred.type}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {cred.status === 'valid' ? t('status.valid') : t('status.error')}
                </span>
                <button
                  className="btn btn--ghost"
                  style={{ fontSize: '11px', padding: '0 8px', height: '28px' }}
                  onClick={() => handleCopyCurl(cred.id)}
                  title="Copy curl command for testing"
                >
                  {copiedCredId === cred.id ? '✅ Copied' : '📋 Copy curl'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
