import React from 'react';

interface ThemeToggleProps {
  currentTheme: 'light' | 'dark' | 'system';
  onChange: (theme: 'light' | 'dark' | 'system') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, onChange }) => {
  const themes = [
    { id: 'light' as const, icon: '☀️' },
    { id: 'dark' as const, icon: '🌙' },
    { id: 'system' as const, icon: '💻' },
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
          {t.icon}
        </button>
      ))}
    </div>
  );
};
