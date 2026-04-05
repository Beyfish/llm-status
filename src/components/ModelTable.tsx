import React from 'react';

interface ModelInfo {
  name: string;
  price: string;
  capabilities: string;
  contextWindow?: string;
  available: boolean;
}

interface ModelTableProps {
  models: ModelInfo[];
  providerName: string;
}

export const ModelTable: React.FC<ModelTableProps> = ({ models, providerName }) => {
  if (models.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        No models available for {providerName}
      </div>
    );
  }

  return (
    <div className="provider-detail__table">
      <div className="provider-detail__table-header">
        <span>Model</span>
        <span>Price</span>
        <span>Capabilities</span>
        <span>Status</span>
      </div>
      {models.map((m) => (
        <div key={m.name} className="provider-detail__table-row">
          <span className="mono">{m.name}</span>
          <span className="mono" style={{ color: 'var(--text-secondary)' }}>{m.price}</span>
          <span>{m.capabilities}</span>
          <span>{m.available ? '✓' : '–'}</span>
        </div>
      ))}
    </div>
  );
};
