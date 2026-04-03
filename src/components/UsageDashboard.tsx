import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

export const UsageDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { usageSummary, fetchUsageSummary } = useStore();

  useEffect(() => {
    fetchUsageSummary();
  }, [fetchUsageSummary]);

  if (!usageSummary || usageSummary.totalCost === 0) {
    return (
      <div className="app-empty-state" role="status" aria-live="polite">
        <div className="app-empty-state__icon">📊</div>
        <h2 className="app-empty-state__title">{t('usage.emptyTitle', 'No usage data yet')}</h2>
        <p className="app-empty-state__desc">
          {t('usage.emptyDesc', 'Usage tracking will begin as you check providers and test prompts.')}
        </p>
      </div>
    );
  }

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;

  return (
    <div className="provider-detail" role="region" aria-label="Usage Dashboard">
      <div className="provider-detail__header">
        <h2 className="provider-detail__name">{t('usage.title', 'API Usage (30 days)')}</h2>
      </div>

      {/* Summary Cards */}
      <div className="provider-detail__section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-card)', background: 'var(--bg-elevated)', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>
              {formatCost(usageSummary.totalCost)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              {t('usage.totalCost', 'Total Cost')}
            </div>
          </div>
          <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-card)', background: 'var(--bg-elevated)', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--green)' }}>
              {usageSummary.totalChecks}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              {t('usage.totalChecks', 'Health Checks')}
            </div>
          </div>
          <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-card)', background: 'var(--bg-elevated)', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--yellow)' }}>
              {usageSummary.totalPrompts}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              {t('usage.totalPrompts', 'Prompt Tests')}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Provider Breakdown */}
      <div className="provider-detail__section">
        <h3 className="provider-detail__section-title">{t('usage.byProvider', 'By Provider')}</h3>
        <div className="provider-detail__table">
          <div className="provider-detail__table-header">
            <span>{t('detail.provider', 'Provider')}</span>
            <span>{t('usage.cost', 'Cost')}</span>
            <span>{t('usage.checks', 'Checks')}</span>
            <span>{t('usage.prompts', 'Prompts')}</span>
          </div>
          {Object.entries(usageSummary.byProvider).map(([providerId, data]) => (
            <div key={providerId} className="provider-detail__table-row">
              <span className="mono">{providerId}</span>
              <span className="mono" style={{ color: 'var(--accent)' }}>{formatCost(data.cost)}</span>
              <span>{data.checks}</span>
              <span>{data.prompts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
