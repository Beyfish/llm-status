import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const zhCN = {
  translation: {
    search: { placeholder: '搜索模型或提供商...' },
    header: { language: '切换语言', theme: '切换主题', checkAll: '全部检测', export: '导出', sync: '云同步', settings: '设置' },
    sidebar: { add: '添加提供商' },
    card: { models: '个模型', keys: '个密钥', creds: '个凭证', ms: 'ms', timeout: '超时', never: '从未检测' },
    status: { valid: '正常', warning: '慢', error: '异常', idle: '未检测' },
    detail: { models: '可用模型', credentials: '凭证管理', modelName: '模型名称', price: '价格', capabilities: '能力', status: '状态' },
    modal: { latencyTitle: '延迟检测模式', lightweight: '轻量模式', lightweightDesc: '快速，不消耗配额', full: '完整模式', fullDesc: '准确反映真实体验', timeout: '超时时间（秒）', concurrency: '并发数', cancel: '取消', start: '开始检测', checking: '检测中...', done: '完成' },
    settings: { title: '设置', general: '通用', detection: '检测', appearance: '外观', advanced: '高级', language: '语言', storageMode: '存储方式', encrypted: '加密存储', plaintext: '明文存储', defaultMode: '默认检测模式', autoCheck: '自动检测间隔', off: '关闭', minutes: '分钟', hour: '小时', theme: '主题', configPath: '配置文件路径' },
    smartImport: { title: '智能导入', textPlaceholder: '粘贴配置文本，例如：\nURL: https://api.openai.com\nKey: sk-xxx...\nModel: gpt-4o', jsonPlaceholder: '粘贴 JSON 配置...', urlPlaceholder: '粘贴 API 端点 URL...', parse: '🔍 解析配置', result: '解析结果', providerType: '提供商', baseUrl: '端点', apiKey: 'API Key', confidence: '置信度', edit: '✏️ 编辑', name: '名称', confirm: '✅ 确认导入' },
    onboarding: {
      welcome: '欢迎使用 LLM Status',
      welcomeDesc: '在一个地方管理所有你的 LLM API。检测状态、管理凭证、跨设备同步。',
      getStarted: '开始使用',
      skip: '稍后设置',
      selectProvider: '选择提供商类型',
      selectAuth: '选择认证方式',
      enterCredentials: '输入凭证信息',
      providerName: '提供商名称',
      baseUrl: 'API 端点',
      apiKey: 'API Key',
      verify: '验证连接',
      verifying: '验证中...',
      verifySuccess: '连接成功！API 可用。',
      verifyError: '连接失败，请检查端点和 Key。',
      security: '安全说明',
      securityDesc: '你的 API Key 会被安全存储，不会被发送到任何第三方。',
      securityEncrypted: 'API Key 使用系统级加密存储',
      securitySync: '支持云端同步，跨设备无缝使用',
      securityExport: '可导出到 One API、sub2api 等第三方工具',
      finish: '完成设置',
      back: '上一步',
      next: '下一步',
    },
  },
};

const enUS = {
  translation: {
    search: { placeholder: 'Search models or providers...' },
    header: { language: 'Toggle language', theme: 'Toggle theme', checkAll: 'Check All', export: 'Export', sync: 'Cloud Sync', settings: 'Settings' },
    sidebar: { add: 'Add Provider' },
    card: { models: 'models', keys: 'keys', creds: 'creds', ms: 'ms', timeout: 'Timeout', never: 'Never checked' },
    status: { valid: 'Normal', warning: 'Slow', error: 'Error', idle: 'Not checked' },
    detail: { models: 'Available Models', credentials: 'Credentials', modelName: 'Model', price: 'Price', capabilities: 'Capabilities', status: 'Status' },
    modal: { latencyTitle: 'Latency Check Mode', lightweight: 'Lightweight', lightweightDesc: 'Fast, no quota usage', full: 'Full', fullDesc: 'Accurate real-world experience', timeout: 'Timeout (seconds)', concurrency: 'Concurrency', cancel: 'Cancel', start: 'Start Check', checking: 'Checking...', done: 'Done' },
    settings: { title: 'Settings', general: 'General', detection: 'Detection', appearance: 'Appearance', advanced: 'Advanced', language: 'Language', storageMode: 'Storage Mode', encrypted: 'Encrypted', plaintext: 'Plaintext', defaultMode: 'Default Mode', autoCheck: 'Auto-check Interval', off: 'Off', minutes: 'min', hour: 'hour', theme: 'Theme', configPath: 'Config Path' },
    smartImport: { title: 'Smart Import', textPlaceholder: 'Paste config text, e.g.:\nURL: https://api.openai.com\nKey: sk-xxx...\nModel: gpt-4o', jsonPlaceholder: 'Paste JSON config...', urlPlaceholder: 'Paste API endpoint URL...', parse: '🔍 Parse Config', result: 'Parsed Result', providerType: 'Provider', baseUrl: 'Endpoint', apiKey: 'API Key', confidence: 'Confidence', edit: '✏️ Edit', name: 'Name', confirm: '✅ Confirm Import' },
    onboarding: {
      welcome: 'Welcome to LLM Status',
      welcomeDesc: 'Manage all your LLM APIs in one place. Check status, manage credentials, sync across devices.',
      getStarted: 'Get Started',
      skip: 'Skip for now',
      selectProvider: 'Select Provider Type',
      selectAuth: 'Choose Authentication Method',
      enterCredentials: 'Enter Credentials',
      providerName: 'Provider Name',
      baseUrl: 'API Endpoint',
      apiKey: 'API Key',
      verify: 'Verify Connection',
      verifying: 'Verifying...',
      verifySuccess: 'Connection successful! API is available.',
      verifyError: 'Connection failed. Please check endpoint and key.',
      security: 'Security Notice',
      securityDesc: 'Your API keys are stored securely and never sent to any third party.',
      securityEncrypted: 'API keys stored with system-level encryption',
      securitySync: 'Cloud sync available for cross-device access',
      securityExport: 'Export to One API, sub2api, and other tools',
      finish: 'Finish Setup',
      back: 'Back',
      next: 'Next',
    },
    compare: { title: 'Model Comparison' },
  },
};

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
  lng: 'zh-CN',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
