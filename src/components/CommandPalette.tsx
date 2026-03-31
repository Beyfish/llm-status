import React, { useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { useTranslation } from 'react-i18next';

export const CommandPalette: React.FC = () => {
  const { t } = useTranslation();
  const { commandPaletteOpen, toggleCommandPalette } = useStore();
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

  return (
    <div className="command-palette-overlay" ref={overlayRef}>
      <input
        className="command-palette__input"
        placeholder={t('search.placeholder')}
        autoFocus
      />
      <div className="command-palette__list">
        <div className="command-palette__item">
          <span>⚡</span>
          <span>{t('header.checkAll')}</span>
        </div>
        <div className="command-palette__item">
          <span>☁️</span>
          <span>{t('header.sync')}</span>
        </div>
        <div className="command-palette__item">
          <span>📤</span>
          <span>{t('header.export')}</span>
        </div>
        <div className="command-palette__item">
          <span>🌙</span>
          <span>{t('header.theme')}</span>
        </div>
        <div className="command-palette__item">
          <span>⚙️</span>
          <span>{t('header.settings')}</span>
        </div>
      </div>
    </div>
  );
};
