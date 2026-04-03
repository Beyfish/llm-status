import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

interface LatencyModalProps {
  onClose: () => void;
}

export const LatencyModal: React.FC<LatencyModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { checkAll, providers, latencyStatus, bulkChecking } = useStore();
  const [mode, setMode] = useState<'lightweight' | 'full'>('full');
  const [timeout, setTimeoutVal] = useState(10);
  const [concurrency, setConcurrency] = useState(5);

  const handleStart = async () => {
    await checkAll(mode, concurrency, timeout);
  };

  const checkedCount = providers.filter((provider) => latencyStatus[provider.id] === 'done' || latencyStatus[provider.id] === 'error').length;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t('modal.latencyTitle')}>
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('modal.latencyTitle')}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">
          <div className="latency-modal__summary">
            <div className="latency-modal__summary-copy">
              <strong>{bulkChecking ? t('modal.checking') : t('header.checkAll')}</strong>
              <span>
                {checkedCount}/{providers.length} providers processed
              </span>
            </div>
            <div className="latency-modal__progress" aria-hidden="true">
              <span className="latency-modal__progress-bar" style={{ width: `${providers.length ? (checkedCount / providers.length) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="modal__option" onClick={() => setMode('lightweight')}>
            <span className={`modal__radio ${mode === 'lightweight' ? 'modal__radio--checked' : ''}`} />
            <div>
              <div className="modal__option-title">{t('modal.lightweight')}</div>
              <div className="modal__option-desc">{t('modal.lightweightDesc')}</div>
            </div>
          </div>
          <div className="modal__option" onClick={() => setMode('full')}>
            <span className={`modal__radio ${mode === 'full' ? 'modal__radio--checked' : ''}`} />
            <div>
              <div className="modal__option-title">{t('modal.full')}</div>
              <div className="modal__option-desc">{t('modal.fullDesc')}</div>
            </div>
          </div>

          <div className="modal__divider" />

          <div className="modal__field">
            <label>{t('modal.timeout')}</label>
            <input type="number" value={timeout} onChange={(e) => setTimeoutVal(Number(e.target.value))} min={1} max={60} className="modal__input" />
          </div>
          <div className="modal__field">
            <label>{t('modal.concurrency')}</label>
            <input type="number" value={concurrency} onChange={(e) => setConcurrency(Number(e.target.value))} min={1} max={20} className="modal__input" />
          </div>

          <div className="latency-modal__providers" role="status" aria-live="polite">
            {providers.map((provider) => {
              const status = latencyStatus[provider.id] ?? 'idle';
              const statusText = status === 'checking'
                ? t('modal.checking')
                : status === 'done'
                  ? t('status.valid')
                  : status === 'error'
                    ? t('status.error')
                    : t('status.idle');

              return (
                <div key={provider.id} className="latency-modal__provider-row">
                  <span className="latency-modal__provider-name">{provider.name}</span>
                  <span className={`latency-modal__provider-state latency-modal__provider-state--${status}`}>{statusText}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>{t('modal.cancel')}</button>
          <button className="btn btn--primary" onClick={bulkChecking ? onClose : handleStart} disabled={!providers.length}>
            {bulkChecking ? t('modal.close', 'Close') : t('modal.start')}
          </button>
        </div>
      </div>
    </div>
  );
};
