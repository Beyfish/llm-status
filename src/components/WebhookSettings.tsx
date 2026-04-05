import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface WebhookSettingsProps {
  onClose: () => void;
  onSave: (config: { platforms: Array<{ type: string; url: string; secret?: string }> }) => void;
}

type PlatformType = 'dingtalk' | 'wecom' | 'feishu' | 'slack' | 'discord';

const PLATFORMS: Array<{ id: PlatformType; name: string; needsSecret: boolean; secretLabel: string; guideUrl: string }> = [
  { id: 'dingtalk', name: '钉钉 (DingTalk)', needsSecret: true, secretLabel: '加签密钥', guideUrl: 'https://open.dingtalk.com/document/orgapp/custom-robots-send-group-messages' },
  { id: 'wecom', name: '企业微信 (WeCom)', needsSecret: false, secretLabel: '', guideUrl: 'https://developer.work.weixin.qq.com/document/path/91770' },
  { id: 'feishu', name: '飞书 (Feishu)', needsSecret: false, secretLabel: '', guideUrl: 'https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot' },
  { id: 'slack', name: 'Slack', needsSecret: false, secretLabel: '', guideUrl: 'https://api.slack.com/messaging/webhooks' },
  { id: 'discord', name: 'Discord', needsSecret: false, secretLabel: '', guideUrl: 'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks' },
];

interface WebhookEntry {
  type: PlatformType;
  url: string;
  secret: string;
}

export const WebhookSettings: React.FC<WebhookSettingsProps> = ({ onClose, onSave }) => {
  const { t } = useTranslation();
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');

  const platform = PLATFORMS.find((p) => p.id === selectedPlatform);

  const handleAdd = () => {
    if (!selectedPlatform || !url) return;
    setWebhooks([...webhooks, { type: selectedPlatform, url, secret }]);
    setSelectedPlatform(null);
    setUrl('');
    setSecret('');
  };

  const handleRemove = (index: number) => {
    setWebhooks(webhooks.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      platforms: webhooks.map((w) => ({
        type: w.type,
        url: w.url,
        secret: w.secret || undefined,
      })),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('webhook.title', 'Webhook Alerts')}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">
          {/* Existing webhooks */}
          {webhooks.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                {t('webhook.configured', 'Configured Webhooks')}
              </h4>
              {webhooks.map((w, i) => {
                const p = PLATFORMS.find((pl) => pl.id === w.type);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{p?.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {w.url.substring(0, 40)}...
                      </span>
                    </div>
                    <button className="btn btn--ghost" style={{ padding: '0 8px', fontSize: '12px' }} onClick={() => handleRemove(i)}>
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new webhook */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              {t('webhook.add', 'Add Webhook')}
            </h4>

            {/* Platform selector */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  className={`btn ${selectedPlatform === p.id ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setSelectedPlatform(p.id)}
                  style={{ fontSize: '12px', padding: '0 10px' }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {platform && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '100px' }}>
                    Webhook URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="smart-import__input"
                    style={{ flex: 1 }}
                  />
                </div>

                {platform.needsSecret && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '100px' }}>
                      {platform.secretLabel}
                    </label>
                    <input
                      type="password"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder="SEC..."
                      className="smart-import__input"
                      style={{ flex: 1 }}
                    />
                  </div>
                )}

                <a
                  href={platform.guideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}
                >
                  {t('webhook.guide', 'How to get webhook URL')}
                </a>

                <button
                  className="btn btn--primary"
                  onClick={handleAdd}
                  disabled={!url}
                  style={{ alignSelf: 'flex-end' }}
                >
                  + {t('webhook.add', 'Add')}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>{t('modal.cancel')}</button>
          <button className="btn btn--primary" onClick={handleSave}>{t('modal.done', 'Save')}</button>
        </div>
      </div>
    </div>
  );
};
