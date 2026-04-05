import React from 'react';

interface ThemeToggleProps {
  currentTheme: 'light' | 'dark' | 'system';
  onChange: (theme: 'light' | 'dark' | 'system') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, onChange }) => {
  const themes = [
    { id: 'light' as const, label: 'Light' },
    { id: 'dark' as const, label: 'Dark' },
    { id: 'system' as const, label: 'System' },
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
