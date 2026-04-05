import React from 'react';
import { useTranslation } from 'react-i18next';

interface ThemeToggleProps {
  currentTheme: 'light' | 'dark' | 'system';
  onChange: (theme: 'light' | 'dark' | 'system') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, onChange }) => {
  const { t } = useTranslation();
  const themes = [
    { id: 'light' as const, label: t('themeOptions.light') },
    { id: 'dark' as const, label: t('themeOptions.dark') },
    { id: 'system' as const, label: t('themeOptions.system') },
  ];

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {themes.map((t) => (
        <button
          key={t.id}
          className={`btn ${currentTheme === t.id ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => onChange(t.id)}
          title={`${t.id} theme`}
          style={{ padding: '0 8px', minWidth: '32px' }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};
