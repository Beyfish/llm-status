import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, theme, setTheme } = useStore();
  const [activeTab, setActiveTab] = useState<'general' | 'detection' | 'appearance' | 'advanced'>('general');

  const tabs = [
    { id: 'general' as const, label: t('settings.general') },
    { id: 'detection' as const, label: t('settings.detection') },
    { id: 'appearance' as const, label: t('settings.appearance') },
    { id: 'advanced' as const, label: t('settings.advanced') },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('settings.title')}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body modal__body--settings">
          <nav className="settings-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="settings-content">
            {activeTab === 'general' && (
              <>
                <div className="settings-field">
                  <label>{t('settings.language')}</label>
                  <select
                    value={i18n.language}
                    onChange={(e) => {
                      i18n.changeLanguage(e.target.value);
                      updateSettings({ language: e.target.value });
                    }}
                    className="settings-select"
                  >
                    <option value="zh-CN">中文</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label>{t('settings.storageMode')}</label>
                  <select
                    value={settings.storageMode || 'encrypted'}
                    onChange={(e) => updateSettings({ storageMode: e.target.value as any })}
                    className="settings-select"
                  >
                    <option value="encrypted">{t('settings.encrypted')}</option>
                    <option value="plaintext">{t('settings.plaintext')}</option>
                  </select>
                </div>
              </>
            )}
            {activeTab === 'detection' && (
              <>
                <div className="settings-field">
                  <label>{t('settings.defaultMode')}</label>
                  <select
                    value={settings.defaultLatencyMode || 'full'}
                    onChange={(e) => updateSettings({ defaultLatencyMode: e.target.value as any })}
                    className="settings-select"
                  >
                    <option value="full">{t('modal.full')}</option>
                    <option value="lightweight">{t('modal.lightweight')}</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label>{t('settings.autoCheck')}</label>
                  <select
                    value={settings.autoCheckInterval || 0}
                    onChange={(e) => updateSettings({ autoCheckInterval: Number(e.target.value) })}
                    className="settings-select"
                  >
                    <option value={0}>{t('settings.off')}</option>
                    <option value={5}>5 {t('settings.minutes')}</option>
                    <option value={15}>15 {t('settings.minutes')}</option>
                    <option value={60}>1 {t('settings.hour')}</option>
                  </select>
                </div>
              </>
            )}
            {activeTab === 'appearance' && (
              <>
                <div className="settings-field">
                  <label>{t('settings.theme')}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['dark', 'light', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        className={`btn ${theme === t ? 'btn--primary' : 'btn--ghost'}`}
                        onClick={() => setTheme(t)}
                      >
                        {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '💻'} {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {activeTab === 'advanced' && (
              <>
                <div className="settings-field">
                  <label>{t('settings.configPath')}</label>
                  <code className="mono" style={{ fontSize: '12px' }}>~/.llm-status/config.json</code>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--primary" onClick={onClose}>{t('modal.done')}</button>
        </div>
      </div>
    </div>
  );
};
