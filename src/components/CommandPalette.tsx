import React, { useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { useTranslation } from 'react-i18next';

export const CommandPalette: React.FC = () => {
  const { t } = useTranslation();
  const {
    commandPaletteOpen, toggleCommandPalette, setTheme, theme,
    checkAll, setShowSyncModal, setShowExportModal, setShowSettingsModal,
  } = useStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        toggleCommandPalette();
      }
    };
    if (commandPaletteOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [commandPaletteOpen, toggleCommandPalette]);

  if (!commandPaletteOpen) return null;

  const commands = [
    { label: t('header.checkAll'), action: () => { checkAll('full', 5, 10); toggleCommandPalette(); } },
    { label: t('header.sync'), action: () => { setShowSyncModal(true); toggleCommandPalette(); } },
    { label: t('header.export'), action: () => { setShowExportModal(true); toggleCommandPalette(); } },
    { label: t('header.theme'), action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); toggleCommandPalette(); } },
    { label: t('header.settings'), action: () => { setShowSettingsModal(true); toggleCommandPalette(); } },
  ];

  return (
    <div className="command-palette-overlay" ref={overlayRef}>
      <input
        className="command-palette__input"
        placeholder={t('search.placeholder')}
        autoFocus
      />
      <div className="command-palette__list">
        {commands.map((cmd, i) => (
          <button
            key={i}
            className="command-palette__item"
            onClick={cmd.action}
            type="button"
          >
            <span>{cmd.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
