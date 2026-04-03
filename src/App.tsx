import React, { useState, useEffect } from 'react';
import { ProviderDetail } from './components/ProviderDetail';
import { CommandPalette } from './components/CommandPalette';
import { LatencyModal } from './components/LatencyModal';
import { SettingsModal } from './components/SettingsModal';
import { SmartImportModal } from './components/SmartImportModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { SyncModal } from './components/SyncModal';
import { ExportModal } from './components/ExportModal';
import { useStore } from './store';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    providers, selectedProviderId, theme, searchQuery, latencyStatus,
    setSelectedProvider, setSearchQuery, setTheme, toggleCommandPalette,
    loadProviders, settings,
  } = useStore();

  const [showLatencyModal, setShowLatencyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('llm-status-onboarding-complete') !== 'true';
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  // Check for expiring credentials after providers load
  useEffect(() => {
    if (providers.length === 0) return;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const provider of providers) {
      for (const cred of provider.credentials) {
        if (cred.expiresAt) {
          const expiryDate = new Date(cred.expiresAt);
          if (expiryDate <= sevenDaysFromNow && expiryDate > now) {
            const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            if (window.electronAPI?.notifyDesktop) {
              window.electronAPI.notifyDesktop({
                title: 'Key Expiring Soon',
                body: `${provider.name} key expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
                type: 'warning' as const,
                providerId: provider.id,
                timestamp: new Date().toISOString(),
              });
            }
          } else if (expiryDate <= now) {
            if (window.electronAPI?.notifyDesktop) {
              window.electronAPI.notifyDesktop({
                title: 'Key Expired',
                body: `${provider.name} key has expired`,
                type: 'error' as const,
                providerId: provider.id,
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }
    }
  }, [providers]);

  // Apply theme
  useEffect(() => {
    const effectiveTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [theme]);

  // Apply language
  useEffect(() => {
    if (settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('.app-header__search')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setShowSettingsModal(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
      if (e.key === 'Escape') {
        setSelectedProvider(null);
        setShowLatencyModal(false);
        setShowSettingsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme]);

  const filteredProviders = searchQuery
    ? providers.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : providers;

  const hasProviders = providers.length > 0;
  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  const renderSidebarStatus = (providerId: string) => {
    const status = latencyStatus[providerId];
    const latencyResult = useStore.getState().latencyResults[providerId];
    if (status === 'checking') {
      return <span className="app-sidebar__status app-sidebar__status--checking">{t('modal.checking')}</span>;
    }

    const provider = providers.find((p) => p.id === providerId);
    const label = latencyResult?.status === 'success'
      ? t('status.valid')
      : latencyResult?.status === 'timeout'
        ? t('card.timeout')
        : provider?.status === 'valid'
          ? t('status.valid')
          : provider?.status === 'warning'
            ? t('status.warning')
            : provider?.status === 'error'
              ? t('status.error')
              : t('status.idle');

    return <span className="app-sidebar__status">{label}</span>;
  };

  return (
    <div className={`app app--${theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme}`}>
      <header className="app-header">
        <div className="app-header__left">
          <span className="app-header__logo">⚡ LLM Status</span>
        </div>
        <div className="app-header__center">
          <input
            type="text"
            className="app-header__search"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="app-header__right">
          <button className="app-header__btn" onClick={() => i18n.changeLanguage(i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN')} title={t('header.language')}>
            🌐 {i18n.language === 'zh-CN' ? 'EN' : '中文'}
          </button>
          <button className="app-header__btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={t('header.theme')}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          <button className="app-header__btn" onClick={() => setShowLatencyModal(true)} title={t('header.checkAll')}>
            ⚡
          </button>
          <button className="app-header__btn" onClick={() => setShowExportModal(true)} title={t('header.export')}>
            📤
          </button>
          <button className="app-header__btn" onClick={() => setShowSyncModal(true)} title={t('header.sync')}>
            ☁️
          </button>
          <button className="app-header__btn" onClick={() => setShowSettingsModal(true)} title={t('header.settings')}>
            ⚙️
          </button>
        </div>
      </header>

      <main className="app-main">
        <aside className="app-sidebar">
          <nav className="app-sidebar__nav">
            {filteredProviders.map((p) => (
              <button
                key={p.id}
                className={`app-sidebar__item ${selectedProviderId === p.id ? 'app-sidebar__item--active' : ''}`}
                onClick={() => setSelectedProvider(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedProvider(p.id);
                  }
                }}
              >
                <span className={`status-dot status-dot--${latencyStatus[p.id] === 'checking' ? 'idle' : p.status}`} />
                <div className="app-sidebar__item-content">
                  <span className="app-sidebar__name">{p.name}</span>
                  {renderSidebarStatus(p.id)}
                </div>
                <span className={`status-dot status-dot--${latencyStatus[p.id] === 'checking' ? 'idle' : p.status}`} />
              </button>
            ))}
            <button className="app-sidebar__add" onClick={() => setShowSmartImport(true)}>+ {t('sidebar.add')}</button>
          </nav>
        </aside>

        <section className="app-content">
          {!hasProviders && (
            <div className="app-empty-state" role="status" aria-live="polite">
              <div className="app-empty-state__icon">⚡</div>
              <h2 className="app-empty-state__title">{t('onboarding.welcomeTitle', 'Add your first provider')}</h2>
              <p className="app-empty-state__desc">
                {t('onboarding.welcomeDesc', 'Paste an API key, verify it instantly, and keep your provider health in one place.')}
              </p>
              <button className="btn btn--primary" onClick={() => setShowSmartImport(true)}>
                {t('sidebar.add')}
              </button>
            </div>
          )}

          {hasProviders && selectedProvider && (
            <ProviderDetail
              provider={selectedProvider}
              onClose={() => setSelectedProvider(null)}
            />
          )}

          {hasProviders && !selectedProvider && (
            <div className="app-empty-state app-empty-state--panel" role="status" aria-live="polite">
              <div className="app-empty-state__icon">👈</div>
              <h2 className="app-empty-state__title">Select a provider</h2>
              <p className="app-empty-state__desc">
                Pick a provider from the sidebar to inspect credentials, run checks, and diagnose latency.
              </p>
            </div>
          )}
        </section>
      </main>

      <CommandPalette />

      {showLatencyModal && <LatencyModal onClose={() => setShowLatencyModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
      {showSmartImport && <SmartImportModal onClose={() => setShowSmartImport(false)} onImport={(p) => useStore.getState().addProvider(p)} />}
      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
      {showSyncModal && <SyncModal onClose={() => setShowSyncModal(false)} />}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={(p) => {
            useStore.getState().addProvider(p);
            localStorage.setItem('llm-status-onboarding-complete', 'true');
            setShowOnboarding(false);
          }}
          onSkip={() => {
            localStorage.setItem('llm-status-onboarding-complete', 'true');
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
