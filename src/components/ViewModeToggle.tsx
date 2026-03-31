import React from 'react';

interface ViewModeToggleProps {
  currentMode: 'card' | 'list' | 'compact';
  onChange: (mode: 'card' | 'list' | 'compact') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ currentMode, onChange }) => {
  const modes = [
    { id: 'card' as const, icon: '▦', label: 'Card' },
    { id: 'list' as const, icon: '☰', label: 'List' },
    { id: 'compact' as const, icon: '▪', label: 'Compact' },
  ];

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {modes.map((m) => (
        <button
          key={m.id}
          className={`btn ${currentMode === m.id ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => onChange(m.id)}
          title={`${m.label} view`}
          style={{ padding: '0 8px', minWidth: '32px' }}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
};
