import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Provider } from '@/types';

interface ModelCompareProps {
  providers: Provider[];
  onClose: () => void;
}

interface CompareModel {
  name: string;
  provider: string;
  price: string;
  contextWindow: string;
  capabilities: string;
  latency?: number;
}

const ALL_MODELS: CompareModel[] = [
  { name: 'gpt-4o', provider: 'OpenAI', price: '$2.50/1M', contextWindow: '128K', capabilities: 'Text + Vision' },
  { name: 'gpt-4o-mini', provider: 'OpenAI', price: '$0.15/1M', contextWindow: '128K', capabilities: 'Text' },
  { name: 'o1', provider: 'OpenAI', price: '$15.00/1M', contextWindow: '200K', capabilities: 'Reasoning' },
  { name: 'claude-sonnet-4', provider: 'Anthropic', price: '$3.00/1M', contextWindow: '200K', capabilities: 'Text + Vision' },
  { name: 'claude-opus-4', provider: 'Anthropic', price: '$15.00/1M', contextWindow: '200K', capabilities: 'Text + Vision' },
  { name: 'gemini-2.5-pro', provider: 'Google', price: '$1.25/1M', contextWindow: '1M', capabilities: 'Text + Vision + Audio' },
  { name: 'qwen-max', provider: 'DashScope', price: '$0.40/1M', contextWindow: '32K', capabilities: 'Text' },
  { name: 'glm-4', provider: 'Zhipu', price: '$0.10/1M', contextWindow: '128K', capabilities: 'Text' },
];

export const ModelCompare: React.FC<ModelCompareProps> = ({ providers: _providers, onClose }) => {
  const { t } = useTranslation();
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'context' | 'latency'>('price');

  const toggleModel = (name: string) => {
    setSelectedModels((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : prev.length < 4 ? [...prev, name] : prev
    );
  };

  const compareModels = ALL_MODELS.filter((m) => selectedModels.includes(m.name));
  const sorted = [...compareModels].sort((a, b) => {
    if (sortBy === 'price') return parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, ''));
    if (sortBy === 'context') return parseInt(b.contextWindow) - parseInt(a.contextWindow);
    return (a.latency || 0) - (b.latency || 0);
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>⚖️ {t('compare.title')}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {ALL_MODELS.map((m) => (
              <button
                key={m.name}
                className={`btn ${selectedModels.includes(m.name) ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => toggleModel(m.name)}
                style={{ fontSize: '12px', padding: '0 10px' }}
              >
                {m.name}
              </button>
            ))}
          </div>

          {compareModels.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
                {(['price', 'context', 'latency'] as const).map((s) => (
                  <button
                    key={s}
                    className={`btn ${sortBy === s ? 'btn--primary' : 'btn--ghost'}`}
                    onClick={() => setSortBy(s)}
                    style={{ fontSize: '11px', padding: '0 8px' }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="provider-detail__table">
                <div className="provider-detail__table-header">
                  <span>Model</span>
                  <span>Provider</span>
                  <span>Price</span>
                  <span>Context</span>
                  <span>Capabilities</span>
                </div>
                {sorted.map((m) => (
                  <div key={m.name} className="provider-detail__table-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 0.8fr 1.5fr' }}>
                    <span className="mono">{m.name}</span>
                    <span>{m.provider}</span>
                    <span className="mono" style={{ color: 'var(--green)' }}>{m.price}</span>
                    <span>{m.contextWindow}</span>
                    <span>{m.capabilities}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {compareModels.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Select models above to compare
            </div>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--primary" onClick={onClose}>{t('modal.done')}</button>
        </div>
      </div>
    </div>
  );
};
