import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

interface LatencyModalProps {
  onClose: () => void;
}

export const LatencyModal: React.FC<LatencyModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { checkAll } = useStore();
  const [mode, setMode] = useState<'lightweight' | 'full'>('full');
  const [timeout, setTimeoutVal] = useState(10);
  const [concurrency, setConcurrency] = useState(5);
  const [checking, setChecking] = useState(false);

  const handleStart = async () => {
    setChecking(true);
    await checkAll(mode, concurrency, timeout);
    setChecking(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t('modal.latencyTitle')}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('modal.latencyTitle')}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">
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
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>{t('modal.cancel')}</button>
          <button className="btn btn--primary" onClick={handleStart} disabled={checking}>
            {checking ? t('modal.checking') : t('modal.start')}
          </button>
        </div>
      </div>
    </div>
  );
};
