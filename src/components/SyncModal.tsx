import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

interface SyncModalProps {
  onClose: () => void;
}

type Protocol = 'webdav' | 's3' | 'gdrive' | 'onedrive';

const PROTOCOLS: Array<{ id: Protocol; name: string; icon: string }> = [
  { id: 'webdav', name: 'WebDAV', icon: '' },
  { id: 's3', name: 'S3', icon: '' },
  { id: 'gdrive', name: 'Google Drive', icon: '' },
  { id: 'onedrive', name: 'OneDrive', icon: '' },
];

export const SyncModal: React.FC<SyncModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { uploadSync, downloadSync, syncStatus, syncConflict, lastSyncAt, resolveSyncConflict } = useStore();
  const [protocol, setProtocol] = useState<Protocol>('webdav');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [direction, setDirection] = useState<'upload' | 'download'>('upload');
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      if (direction === 'upload') {
        await uploadSync();
      } else {
        await downloadSync();
      }
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('sync.title', 'Cloud Sync')}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">
          {/* Protocol selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {PROTOCOLS.map((p) => (
              <button
                key={p.id}
                className={`btn ${protocol === p.id ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setProtocol(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Connection config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {protocol === 'webdav' && (
              <>
                <SyncField label="URL" value={config.url || ''} onChange={(v) => setConfig({ ...config, url: v })} placeholder="https://dav.example.com" />
                <SyncField label="Username" value={config.username || ''} onChange={(v) => setConfig({ ...config, username: v })} />
                <SyncField label="Password" type="password" value={config.password || ''} onChange={(v) => setConfig({ ...config, password: v })} />
              </>
            )}
            {protocol === 's3' && (
              <>
                <SyncField label="Endpoint" value={config.endpoint || ''} onChange={(v) => setConfig({ ...config, endpoint: v })} placeholder="https://s3.example.com" />
                <SyncField label="Region" value={config.region || ''} onChange={(v) => setConfig({ ...config, region: v })} placeholder="us-east-1" />
                <SyncField label="Bucket" value={config.bucket || ''} onChange={(v) => setConfig({ ...config, bucket: v })} />
                <SyncField label="Access Key" value={config.accessKey || ''} onChange={(v) => setConfig({ ...config, accessKey: v })} />
                <SyncField label="Secret Key" type="password" value={config.secretKey || ''} onChange={(v) => setConfig({ ...config, secretKey: v })} />
              </>
            )}
            {(protocol === 'gdrive' || protocol === 'onedrive') && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                <p>OAuth authorization required</p>
                <button className="btn btn--primary" style={{ marginTop: '12px' }}>
                  Authorize {protocol === 'gdrive' ? 'Google Drive' : 'OneDrive'}
                </button>
              </div>
            )}
          </div>

          {/* Direction */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              className={`btn ${direction === 'upload' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setDirection('upload')}
            >
              ↑ {t('sync.upload', 'Upload to Cloud')}
            </button>
            <button
              className={`btn ${direction === 'download' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setDirection('download')}
            >
              ↓ {t('sync.download', 'Download from Cloud')}
            </button>
          </div>

          {/* Status */}
          {lastSyncAt && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {t('sync.lastSync', 'Last sync')}: {new Date(lastSyncAt).toLocaleString()}
            </div>
          )}
          {error && (
            <div style={{ padding: '12px', borderRadius: 'var(--radius-btn)', background: 'color-mix(in srgb, var(--red) 10%, transparent)', color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>
              {error}
            </div>
          )}
          {syncStatus === 'syncing' && (
            <div style={{ padding: '12px', borderRadius: 'var(--radius-btn)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', fontSize: '13px', marginBottom: '12px' }}>
              Syncing...
            </div>
          )}
          {syncStatus === 'conflict' && syncConflict && (
            <div style={{ padding: '16px', borderRadius: 'var(--radius-btn)', background: 'color-mix(in srgb, var(--yellow) 10%, transparent)', border: '1px solid var(--yellow)', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--yellow)', marginBottom: '8px' }}>
                Sync Conflict Detected
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Your local version differs from the cloud version. Choose which version to keep:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ padding: '12px', borderRadius: 'var(--radius-btn)', background: 'var(--bg-elevated)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Local Version</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Version: {syncConflict.localVersion || 'unknown'}
                  </div>
                  {syncConflict.localModifiedAt && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Modified: {new Date(syncConflict.localModifiedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px', borderRadius: 'var(--radius-btn)', background: 'var(--bg-elevated)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Cloud Version</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Version: {syncConflict.remoteVersion || 'unknown'}
                  </div>
                  {syncConflict.remoteModifiedAt && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Modified: {new Date(syncConflict.remoteModifiedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn--primary"
                  onClick={() => resolveSyncConflict('local')}
                  style={{ flex: 1 }}
                >
                  ↑ Keep Local (Upload)
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => resolveSyncConflict('remote')}
                  style={{ flex: 1 }}
                >
                  ↓ Keep Cloud (Download)
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>{t('modal.cancel')}</button>
          <button className="btn btn--primary" onClick={handleSync} disabled={syncing}>
            {syncing ? t('sync.syncing', 'Syncing...') : t('sync.syncNow', 'Sync Now')}
          </button>
        </div>
      </div>
    </div>
  );
};

const SyncField: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '100px' }}>{label}</label>
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
