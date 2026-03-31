import React, { useState, useEffect } from 'react';
import { ProviderCard } from './components/ProviderCard';
import { ProviderDetail } from './components/ProviderDetail';
import { CommandPalette } from './components/CommandPalette';
import { LatencyModal } from './components/LatencyModal';
import { SettingsModal } from './components/SettingsModal';
import { SmartImportModal } from './components/SmartImportModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { useStore } from './store';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    providers, selectedProviderId, viewMode, theme, searchQuery,
    setSelectedProvider, setSearchQuery, setTheme, toggleCommandPalette,
    loadProviders, settings,
  } = useStore();

  const [showLatencyModal, setShowLatencyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('llm-status-onboarding-complete') !== 'true';
  });

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

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

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

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
          <button className="app-header__btn" title={t('header.export')}>
            📤
          </button>
          <button className="app-header__btn" title={t('header.sync')}>
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
            {providers.map((p) => (
              <button
                key={p.id}
                className={`app-sidebar__item ${selectedProviderId === p.id ? 'app-sidebar__item--active' : ''}`}
                onClick={() => setSelectedProvider(p.id)}
              >
                <span className={`status-dot status-dot--${p.status}`} />
                <span className="app-sidebar__name">{p.name}</span>
              </button>
            ))}
            <button className="app-sidebar__add">+ {t('sidebar.add')}</button>
          </nav>
        </aside>

        <section className="app-content">
          <div className={`app-grid app-grid--${viewMode}`}>
            {filteredProviders.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>

          {selectedProvider && (
            <ProviderDetail
              provider={selectedProvider}
              onClose={() => setSelectedProvider(null)}
            />
          )}
        </section>
      </main>

      <CommandPalette />

      {showLatencyModal && <LatencyModal onClose={() => setShowLatencyModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
      {showSmartImport && <SmartImportModal onClose={() => setShowSmartImport(false)} onImport={(p) => useStore.getState().addProvider(p)} />}
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
