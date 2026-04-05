import React from 'react';

const LOGOS: Record<string, React.FC<{ size: number }>> = {
  openai: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14.98 3.09c-.34.02-.68.07-1.01.15a5.13 5.13 0 00-3.66 3.13 5.12 5.12 0 00-.31 3.66c.08.34.13.68.15 1.01a5.13 5.13 0 00-3.13 3.66 5.12 5.12 0 00-.15 1.01c-.02.34-.07.68-.15 1.01a5.13 5.13 0 003.13 3.66c.34.08.68.13 1.01.15a5.12 5.12 0 003.66-3.13 5.13 5.13 0 00.31-3.66c-.08-.34-.13-.68-.15-1.01a5.13 5.13 0 003.13-3.66 5.12 5.12 0 00.15-1.01c.02-.34.07-.68.15-1.01a5.13 5.13 0 00-3.13-3.66 5.12 5.12 0 00-1.01-.15z" fill="#10A37F"/>
      <path d="M14.5 7.5c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5 3.5-1.5 3.5-3.5-1.5-3.5-3.5-3.5z" fill="#fff"/>
      <circle cx="14.5" cy="11" r="1.2" fill="#10A37F"/>
    </svg>
  ),
  anthropic: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="#D97706"/>
      <path d="M12 6l-4 2.5v5L12 16l4-2.5v-5L12 6z" fill="#fff" opacity="0.9"/>
      <path d="M12 9l-2 1.2v2.6L12 14l2-1.2v-2.6L12 9z" fill="#D97706"/>
    </svg>
  ),
  google: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#gemini-grad)"/>
      <defs>
        <linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0%" stopColor="#4285F4"/>
          <stop offset="25%" stopColor="#34A853"/>
          <stop offset="50%" stopColor="#FBBC04"/>
          <stop offset="75%" stopColor="#EA4335"/>
          <stop offset="100%" stopColor="#4285F4"/>
        </linearGradient>
      </defs>
      <path d="M12 6l1.5 3.5L17 10l-2.5 2.5L15 16l-3-2-3 2 .5-3.5L7 10l3.5-.5L12 6z" fill="#fff"/>
    </svg>
  ),
  'azure-openai': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13.5 2L6 14h4l-1.5 8L18 10h-4l1.5-8h-2z" fill="#0078D4"/>
      <path d="M13.5 2L6 14h4l-1.5 8L18 10h-4l1.5-8z" fill="#0078D4" opacity="0.8"/>
      <path d="M13.5 2L6 14h4l-1.5 8L18 10h-4l1.5-8z" fill="#50E6FF" opacity="0.3"/>
    </svg>
  ),
  'aws-bedrock': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 18c0-6 3-10 6-10s6 4 6 10" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 8v10" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8 14c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 18c-1 0-2-.5-2-1.5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  zhipu: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width={size} height={size} rx={size * 0.15} fill="#6366F1"/>
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize={size * 0.4} fontWeight="700">智</text>
    </svg>
  ),
  dashscope: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width={size} height={size} rx={size * 0.15} fill="#8B5CF6"/>
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize={size * 0.4} fontWeight="700">通</text>
    </svg>
  ),
  qianfan: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width={size} height={size} rx={size * 0.15} fill="#0EA5E9"/>
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize={size * 0.4} fontWeight="700">文</text>
    </svg>
  ),
  vllm: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width={size} height={size} rx={size * 0.15} fill="#EF4444"/>
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize={size * 0.35} fontWeight="800">vLLM</text>
    </svg>
  ),
  ollama: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width={size} height={size} rx={size * 0.15} fill="#14B8A6"/>
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize={size * 0.35} fontWeight="700">🦙</text>
    </svg>
  ),
  localai: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width={size} height={size} rx={size * 0.15} fill="#64748B"/>
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize={size * 0.3} fontWeight="700">Local</text>
    </svg>
  ),
  custom: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width={size} height={size} rx={size * 0.15} fill="#71717A"/>
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize={size * 0.25} fontWeight="700">⚙</text>
    </svg>
  ),
};

interface ProviderLogoProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({ type, size = 'md' }) => {
  const sizes = { sm: 24, md: 32, lg: 48 };
  const Logo = LOGOS[type] || LOGOS.custom;
  return <Logo size={sizes[size]} />;
};
