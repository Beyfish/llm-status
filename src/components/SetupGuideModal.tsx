import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SetupGuideModalProps {
  platform: string;
  onClose: () => void;
  onComplete: (config: { clientId: string; clientSecret: string; accessToken?: string }) => void;
}

interface Step {
  title: string;
  description: string;
  link?: { text: string; url: string };
  action?: 'input' | 'confirm';
  field?: { label: string; placeholder: string; type?: string };
}

const PLATFORM_GUIDES: Record<string, { name: string; icon: string; steps: Step[] }> = {
  openrouter: {
    name: 'OpenRouter',
    icon: '',
    steps: [
      {
        title: 'Step 1: Open OpenRouter',
        description: 'Go to the OpenRouter website and sign in.',
        link: { text: 'Open openrouter.ai', url: 'https://openrouter.ai' },
      },
      {
        title: 'Step 2: Create Account',
        description: 'Click "Sign In" in the top-right corner. Use email or Google/GitHub account. No credit card required.',
      },
      {
        title: 'Step 3: Create API Key',
        description: 'Go to Keys page and click "Create Key". Name it "LLM Status" and copy the key.',
        link: { text: 'Open Keys Page', url: 'https://openrouter.ai/keys' },
        action: 'input',
        field: { label: 'API Key', placeholder: 'sk-or-v1-...', type: 'password' },
      },
      {
        title: 'Step 4: Verify Connection',
        description: 'Test your API key to ensure it works.',
        action: 'confirm',
      },
    ],
  },
  siliconflow: {
    name: '硅基流动 (SiliconFlow)',
    icon: '',
    steps: [
      {
        title: '第一步：打开硅基流动官网',
        description: '访问 siliconflow.cn 并注册账号。',
        link: { text: '打开 siliconflow.cn', url: 'https://siliconflow.cn' },
      },
      {
        title: '第二步：注册账号',
        description: '使用手机号注册，新用户赠送 1400 万 tokens 免费额度。',
      },
      {
        title: '第三步：获取 API Key',
        description: '进入"个人中心" → "API Key" → 点击"创建 API Key"，复制 Key。',
        link: { text: '打开 API Key 页面', url: 'https://cloud.siliconflow.cn/account/ak' },
        action: 'input',
        field: { label: 'API Key', placeholder: 'sk-...', type: 'password' },
      },
      {
        title: '第四步：验证连接',
        description: '测试你的 API Key 是否可用。',
        action: 'confirm',
      },
    ],
  },
  alibaba: {
    name: '阿里云百炼 (Alibaba Bailian)',
    icon: '',
    steps: [
      {
        title: '第一步：打开阿里云百炼控制台',
        description: '访问 bailian.console.aliyun.com 并登录。',
        link: { text: '打开百炼控制台', url: 'https://bailian.console.aliyun.com' },
      },
      {
        title: '第二步：开通服务',
        description: '使用阿里云账号登录（没有则注册）。首次开通自动领取 100 万 tokens 免费额度，有效期 180 天。',
      },
      {
        title: '第三步：获取 API Key',
        description: '进入"API-KEY 管理"页面 → 点击"创建新的 API-KEY" → 复制 Key。',
        link: { text: '打开 API Key 管理', url: 'https://bailian.console.aliyun.com/?apiKey=1' },
        action: 'input',
        field: { label: 'API Key', placeholder: 'sk-...', type: 'password' },
      },
      {
        title: '第四步：验证连接',
        description: '测试你的 API Key 是否可用。',
        action: 'confirm',
      },
    ],
  },
  zhipu: {
    name: '智谱 AI (Zhipu)',
    icon: '',
    steps: [
      {
        title: '第一步：打开智谱 AI 开放平台',
        description: '访问 open.bigmodel.cn 并注册账号。',
        link: { text: '打开智谱开放平台', url: 'https://open.bigmodel.cn' },
      },
      {
        title: '第二步：注册账号',
        description: '使用手机号注册，新用户有免费额度。',
      },
      {
        title: '第三步：获取 API Key',
        description: '进入"API Keys"页面 → 点击"创建 API Key" → 复制 Key。',
        link: { text: '打开 API Key 页面', url: 'https://open.bigmodel.cn/usercenter/apikeys' },
        action: 'input',
        field: { label: 'API Key', placeholder: '...', type: 'password' },
      },
      {
        title: '第四步：验证连接',
        description: '测试你的 API Key 是否可用。',
        action: 'confirm',
      },
    ],
  },
};

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ platform, onClose, onComplete }) => {
  const { t } = useTranslation();
  const guide = PLATFORM_GUIDES[platform];
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKey, setApiKey] = useState('');

  if (!guide) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal__header">
            <h2>Setup Guide</h2>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
          <div className="modal__body">
            <p>Guide not available for this platform.</p>
          </div>
        </div>
      </div>
    );
  }

  const step = guide.steps[currentStep];
  const isLast = currentStep === guide.steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete({ clientId: '', clientSecret: '', accessToken: apiKey });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{guide.name} {t('setupGuide.title', 'Setup Guide')}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">
          {/* Progress */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
            {guide.steps.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: i <= currentStep ? 'var(--accent)' : 'var(--border-color)',
                }}
              />
            ))}
          </div>

          {/* Step content */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{step.title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              {step.description}
            </p>

            {step.link && (
              <a
                href={step.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', textDecoration: 'none' }}
              >
                {step.link.text}
              </a>
            )}

            {step.action === 'input' && step.field && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '80px' }}>
                  {step.field.label}
                </label>
                <input
                  type={step.field.type || 'text'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={step.field.placeholder}
                  className="smart-import__input"
                  style={{ flex: 1 }}
                />
              </div>
            )}

            {step.action === 'confirm' && (
              <div style={{ padding: '16px', borderRadius: 'var(--radius-btn)', background: 'color-mix(in srgb, var(--green) 10%, transparent)', color: 'var(--green)', fontSize: '14px', textAlign: 'center' }}>
                {t('setupGuide.ready', 'Ready to connect!')}
              </div>
            )}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>{t('modal.cancel')}</button>
          {currentStep > 0 && (
            <button className="btn btn--ghost" onClick={() => setCurrentStep(currentStep - 1)}>
              {t('setupGuide.back', 'Back')}
            </button>
          )}
          <button
            className="btn btn--primary"
            onClick={handleNext}
            disabled={step.action === 'input' && !apiKey}
          >
            {isLast ? t('setupGuide.finish', 'Finish') : t('setupGuide.next', 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
};
