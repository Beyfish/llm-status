import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, theme, setTheme, providers } = useStore();
  const [activeTab, setActiveTab] = useState<'general' | 'detection' | 'appearance' | 'advanced' | 'audit'>('general');
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [backupStatus, setBackupStatus] = useState<'idle' | 'exporting' | 'importing' | 'success' | 'error'>('idle');
  const [backupMessage, setBackupMessage] = useState('');
  const electronAPI = window.electronAPI;
  const [configPathDisplay, setConfigPathDisplay] = useState('...');

  const tabs = [
    { id: 'general' as const, label: t('settings.general') },
    { id: 'detection' as const, label: t('settings.detection') },
    { id: 'appearance' as const, label: t('settings.appearance') },
    { id: 'advanced' as const, label: t('settings.advanced') },
    { id: 'audit' as const, label: t('audit.title') },
  ];

  // Audit log state
  const [auditEntries, setAuditEntries] = useState<Array<{ timestamp: string; providerId: string; action: string; detail?: string }>>([]);

  const fetchAuditLog = useCallback(async () => {
    if (!electronAPI?.auditFetch) {
      setAuditEntries([]);
      return;
    }

    const result = await electronAPI.auditFetch();
    setAuditEntries(result.entries);
  }, [electronAPI]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLog();
    }
  }, [activeTab, fetchAuditLog]);

  useEffect(() => {
    let cancelled = false;

    const loadConfigPath = async () => {
      if (!electronAPI?.configRead) {
        if (!cancelled) {
          setConfigPathDisplay(t('settings.configPathUnavailable'));
        }
        return;
      }

      try {
        const config = await electronAPI.configRead();
        const resolvedPath = (config as { settings?: { configPath?: string } })?.settings?.configPath;

        if (!cancelled) {
          setConfigPathDisplay(resolvedPath || t('settings.configPathUnavailable'));
        }
      } catch {
        if (!cancelled) {
          setConfigPathDisplay(t('settings.configPathUnavailable'));
        }
      }
    };

    void loadConfigPath();

    return () => {
      cancelled = true;
    };
  }, [electronAPI, t]);

  // Apply screen protection on mount if enabled
  useEffect(() => {
    if (electronAPI?.isMac && settings.screenRecordingProtection) {
      electronAPI.setScreenProtection?.(true);
    }
  }, [electronAPI, settings.screenRecordingProtection]);

  const handleClearAudit = async () => {
    if (!electronAPI?.auditClear) {
      return;
    }

    if (window.confirm(t('audit.clearConfirm'))) {
      await electronAPI.auditClear();
      setAuditEntries([]);
    }
  };

  const handleExportCredentials = async () => {
    if (!backupPassphrase || backupPassphrase.length < 8) {
      setBackupStatus('error');
      setBackupMessage(t('credentialBackup.passphraseTooShort'));
      return;
    }
    setBackupStatus('exporting');
    setBackupMessage('');
    if (!electronAPI?.credentialFileExport) {
      setBackupStatus('error');
      setBackupMessage(t('credentialBackup.unavailableExport'));
      return;
    }

    try {
      const config = { providers, settings };
      const result = await electronAPI.credentialFileExport(config, backupPassphrase);
      if (result.success) {
        setBackupStatus('success');
        setBackupMessage(result.message || t('credentialBackup.exportSuccess'));
      } else {
        setBackupStatus('error');
        const message = result.message?.trim();
        setBackupMessage(message || t('credentialBackup.exportFailed'));
      }
    } catch {
      setBackupStatus('error');
      setBackupMessage(t('credentialBackup.exportFailed'));
    }
  };

  const handleImportCredentials = async () => {
    if (!backupPassphrase || backupPassphrase.length < 8) {
      setBackupStatus('error');
      setBackupMessage(t('credentialBackup.passphraseTooShort'));
      return;
    }
    setBackupStatus('importing');
    setBackupMessage('');
    if (!electronAPI?.credentialFileImport) {
      setBackupStatus('error');
      setBackupMessage(t('credentialBackup.unavailableImport'));
      return;
    }

    try {
      const result = await electronAPI.credentialFileImport(backupPassphrase);
      if (result.success && result.data) {
        setBackupStatus('success');
        setBackupMessage(t('credentialBackup.importedCount', { count: result.data.providers.length }));
        // Reload providers from imported data
        for (const provider of result.data.providers) {
          await useStore.getState().addProvider(provider as any);
        }
      } else {
        setBackupStatus('error');
        const message = result.message?.trim();
        setBackupMessage(message || t('credentialBackup.importFailed'));
      }
    } catch {
      setBackupStatus('error');
      setBackupMessage(t('credentialBackup.importFailed'));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('settings.title')}</h2>
          <button className="modal__close" onClick={onClose} aria-label={t('modal.close')}>✕</button>
        </div>
        <div className="modal__body modal__body--settings settings-modal__body">
          <nav className="settings-tabs" role="tablist" aria-label="Settings sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`settings-panel-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="settings-content" role="tabpanel" id={`settings-panel-${activeTab}`}>
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
                  <div className="settings-theme-row">
                    {(['dark', 'light', 'system'] as const).map((themeOpt) => (
                      <button
                        key={themeOpt}
                        className={`btn ${theme === themeOpt ? 'btn--primary' : 'btn--ghost'}`}
                        onClick={() => setTheme(themeOpt)}
                      >
                        {themeOpt === 'dark' ? t('themeOptions.dark') : themeOpt === 'light' ? t('themeOptions.light') : t('themeOptions.system')}
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
                  <code className="mono settings-code-inline">{configPathDisplay}</code>
                </div>

                {electronAPI?.isMac && (
                  <>
                    <div className="modal__divider" />

                    <div className="settings-field">
                      <label id="screen-protection-label">{t('security.screenProtection')}</label>
                      <p className="settings-helper-text">
                        {t('security.screenProtectionDesc')}
                      </p>
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={settings.screenRecordingProtection || false}
                          onChange={(e) => {
                            updateSettings({ screenRecordingProtection: e.target.checked });
                            electronAPI.setScreenProtection?.(e.target.checked);
                          }}
                          className="toggle-input"
                          aria-labelledby="screen-protection-label"
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </>
                )}

                <div className="modal__divider" />

                <div className="settings-field">
                  <label>{t('credentialBackup.title')}</label>
                  <p className="settings-helper-text">
                    {t('credentialBackup.desc')}
                  </p>

                  <div className="settings-field">
                    <label>{t('credentialBackup.passphrase')}</label>
                    <input
                      type="password"
                      value={backupPassphrase}
                      onChange={(e) => setBackupPassphrase(e.target.value)}
                      className="settings-select settings-input settings-input--password"
                      placeholder={t('credentialBackup.passphrasePlaceholder')}
                    />
                  </div>

                  <div className="settings-action-row">
                    <button
                      className="btn btn--primary"
                      onClick={handleExportCredentials}
                      disabled={backupStatus === 'exporting' || backupStatus === 'importing'}
                    >
                      {backupStatus === 'exporting' ? t('credentialBackup.exporting') : t('credentialBackup.export')}
                    </button>
                    <button
                      className="btn btn--ghost"
                      onClick={handleImportCredentials}
                      disabled={backupStatus === 'exporting' || backupStatus === 'importing'}
                    >
                      {backupStatus === 'importing' ? t('credentialBackup.importing') : t('credentialBackup.import')}
                    </button>
                  </div>

                  {backupMessage && (
                    <div className={backupStatus === 'success' ? 'settings-feedback settings-feedback--success' : 'settings-feedback settings-feedback--error'}>
                      {backupStatus === 'success' ? '✓' : '✕'} {backupMessage}
                    </div>
                  )}
                </div>
              </>
            )}
            {activeTab === 'audit' && (
              <div className="audit-log-tab">
                <div className="audit-log-header">
                  <h3>{t('audit.title')}</h3>
                  {auditEntries.length > 0 && (
                    <button onClick={handleClearAudit} className="audit-clear-btn">
                      {t('audit.clear')}
                    </button>
                  )}
                </div>
                {auditEntries.length === 0 ? (
                  <p className="audit-empty">{t('audit.noEntries')}</p>
                ) : (
                  <div className="audit-log-list">
                    {auditEntries.slice().reverse().map((entry, index) => (
                      <div key={index} className="audit-log-entry">
                        <span className="audit-timestamp">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <span className={`audit-action audit-action-${entry.action}`}>
                          {t(`audit.actions.${entry.action}`)}
                        </span>
                        <span className="audit-provider">{entry.providerId}</span>
                        {entry.detail && (
                          <span className="audit-detail">{entry.detail}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
