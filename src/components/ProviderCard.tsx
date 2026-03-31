import React from 'react';
import type { Provider } from '@/types';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

interface ProviderCardProps {
  provider: Provider;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const { t } = useTranslation();
  const setSelectedProvider = useStore((s) => s.setSelectedProvider);

  const statusLabel = provider.status === 'valid'
    ? t('status.valid')
    : provider.status === 'warning'
      ? t('status.warning')
      : provider.status === 'error'
        ? t('status.error')
        : t('status.idle');

  const latencyDisplay = provider.averageLatency
    ? `${provider.averageLatency}${t('card.ms')}`
    : provider.status === 'error'
      ? t('card.timeout')
      : t('card.never');

  const handleClick = () => {
    setSelectedProvider(provider.id);
  };

  return (
    <div className="provider-card" onClick={handleClick} role="button" tabIndex={0} aria-label={`${provider.name} - ${statusLabel}`}>
      <div className="provider-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-dot status-dot--${provider.status}`} />
          <span className="provider-card__name">{provider.name}</span>
        </div>
        <span className="provider-card__latency">{latencyDisplay}</span>
      </div>
      <div className="provider-card__meta">
        <span>{provider.modelCount || 0} {t('card.models')}</span>
        <span>{provider.credentials.length} {t('card.creds')}</span>
      </div>
    </div>
  );
};
