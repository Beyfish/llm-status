import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

interface ExportModalProps {
  onClose: () => void;
}

const TARGETS = [
  { id: 'one-api', name: 'One API', icon: '🔗', pushMode: true },
  { id: 'new-api', name: 'New API', icon: '🔗', pushMode: true },
  { id: 'sub2api', name: 'sub2api', icon: '🔗', pushMode: true },
  { id: 'litellm', name: 'LiteLLM', icon: '🔗', pushMode: true },
  { id: 'openrouter', name: 'OpenRouter', icon: '🌐', pushMode: true },
  { id: 'cherry-studio', name: 'Cherry Studio', icon: '🍒', pushMode: false },
  { id: 'lobechat', name: 'LobeChat', icon: '💬', pushMode: false },
  { id: 'chatgpt-next-web', name: 'ChatGPT Next Web', icon: '🤖', pushMode: false },
  { id: 'dify', name: 'Dify', icon: '🧩', pushMode: false },
  { id: 'anythingllm', name: 'AnythingLLM', icon: '🗂️', pushMode: false },
  { id: 'json', name: 'Generic JSON', icon: '📄', pushMode: false },
];

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { providers, pushToTarget, exportToFile } = useStore();
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState('');
  const [targetApiKey, setTargetApiKey] = useState('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const target = TARGETS.find((t) => t.id === selectedTarget);

  const handleExport = async () => {
    if (!selectedTarget) return;
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      if (target?.pushMode && targetUrl && targetApiKey) {
        // Push each provider individually — IPC handler expects flat single-provider data
        const results: Array<{ name: string; success: boolean; error?: string }> = [];
        for (const p of providers) {
          try {
            const providerData = {
              name: p.name,
              type: p.type,
              baseUrl: p.baseUrl,
              apiKey: p.credentials.find((c) => c.type === 'api_key')?.value || '',
              models: [],
            };
            await pushToTarget(selectedTarget, { ...providerData, url: targetUrl, apiKey: targetApiKey });
            results.push({ name: p.name, success: true });
          } catch (err: any) {
            results.push({ name: p.name, success: false, error: err.message });
          }
        }
        const succeeded = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        if (failed > 0) {
          const failedNames = results.filter((r) => !r.success).map((r) => r.name).join(', ');
          setSuccess(`${succeeded}/${providers.length} pushed. Failed: ${failedNames}`);
        } else {
          setSuccess(`Pushed ${succeeded}/${providers.length} to ${target.name} successfully`);
        }
      } else {
        const exportData = {
          providers: providers.map((p) => ({
            name: p.name,
            type: p.type,
            baseUrl: p.baseUrl,
            apiKey: p.credentials.find((c) => c.type === 'api_key')?.value,
            models: [],
          })),
        };
        await exportToFile(selectedTarget, exportData);
        setSuccess(`Exported to ${target?.name || 'file'} successfully`);
      }
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>📤 {t('export.title', 'Export Configuration')}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">
          {/* Target selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {TARGETS.map((tg) => (
              <button
                key={tg.id}
                className={`btn ${selectedTarget === tg.id ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setSelectedTarget(tg.id)}
                style={{ flexDirection: 'column', gap: '4px', padding: '12px' }}
              >
                <span style={{ fontSize: '20px' }}>{tg.icon}</span>
                <span style={{ fontSize: '12px' }}>{tg.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {tg.pushMode ? 'API Push' : 'File Export'}
                </span>
              </button>
            ))}
          </div>

          {/* API Push config */}
          {target?.pushMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <ExportField label="Target URL" value={targetUrl} onChange={setTargetUrl} placeholder="https://api.example.com" />
              <ExportField label="Admin API Key" type="password" value={targetApiKey} onChange={setTargetApiKey} placeholder="sk-admin-..." />
            </div>
          )}

          {/* Status */}
          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>
              ❌ {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--green)', fontSize: '13px', marginBottom: '12px' }}>
              ✅ {success}
            </div>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>{t('modal.cancel')}</button>
          <button className="btn btn--primary" onClick={handleExport} disabled={exporting || !selectedTarget}>
            {exporting ? t('export.exporting', 'Exporting...') : t('export.export', 'Export')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ExportField: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '120px' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="smart-import__input"
      style={{ flex: 1 }}
    />
  </div>
);
