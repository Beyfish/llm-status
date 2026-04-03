export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure-openai'
  | 'aws-bedrock'
  | 'zhipu'
  | 'dashscope'
  | 'qianfan'
  | 'vllm'
  | 'ollama'
  | 'localai'
  | 'custom';

export type CredentialType =
  | 'api_key'
  | 'oauth'
  | 'service_account'
  | 'aws_iam'
  | 'azure_entra_id'
  | 'setup_token';

export type CredentialStatus = 'valid' | 'invalid' | 'expired' | 'unknown';

export type LatencyMode = 'lightweight' | 'full';

export type ViewMode = 'card' | 'list' | 'compact';

export type Theme = 'light' | 'dark' | 'system';

export type SyncProtocol = 'webdav' | 's3' | 'gdrive' | 'onedrive';

export type SyncDirection = 'upload' | 'download' | 'auto';

export interface Credential {
  id: string;
  type: CredentialType;
  status: CredentialStatus;
  encrypted: boolean;
  lastVerified?: string;
  expiresAt?: string;
  complianceWarning?: boolean;
  // api_key
  value?: string;
  // oauth
  accessToken?: string;
  refreshToken?: string;
  // service_account
  project?: string;
  clientEmail?: string;
  privateKey?: string;
  // aws_iam
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  // azure_entra_id
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  scope?: string;
}

export type ProviderEnvironment = 'personal' | 'work' | 'production' | 'staging' | 'custom';

export interface LatencyRecord {
  timestamp: string;
  latency: number;
}

export interface Provider {
  id: string;
  type: ProviderType;
  name: string;
  baseUrl?: string;
  region?: string;
  environment?: ProviderEnvironment;
  credentials: Credential[];
  latencyHistory: LatencyRecord[];
  status: 'valid' | 'warning' | 'error' | 'idle';
  averageLatency?: number;
  modelCount?: number;
  checkCount?: number;
  promptCount?: number;
}

export interface AppSettings {
  storageMode: 'plaintext' | 'encrypted';
  defaultLatencyMode: LatencyMode;
  autoCheckInterval: number;
  language: string;
  configPath: string;
  theme: Theme;
  shortcuts: Record<string, string>;
  notifications: {
    statusChange: boolean;
    syncComplete: boolean;
    exportComplete: boolean;
    oauthComplete: boolean;
    budgetAlert: boolean;
    keyExpiry: boolean;
  };
  proxy?: {
    mode: 'system' | 'manual' | 'none';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
  smartImport?: {
    engine: 'local' | 'cloud' | 'auto';
    cloudProvider?: string;
    cloudApiKey?: string;
    autoVerify: boolean;
    autoFetchModels: boolean;
  };
  webhook?: {
    enabled: boolean;
    platforms: Array<{
      type: string;
      url: string;
      secret?: string;
    }>;
  };
}

export interface CloudSyncConfig {
  protocol: SyncProtocol;
  connectionConfig: Record<string, string>;
  lastSyncTimestamp?: string;
  syncDirection: SyncDirection;
}

export interface AppConfig {
  schemaVersion: number;
  providers: Provider[];
  settings: AppSettings;
  cloudSync?: CloudSyncConfig;
  exportPresets?: Record<string, Record<string, string>>;
}

export interface LatencyResult {
  providerId: string;
  latency: number;
  status: 'success' | 'timeout' | 'error';
  error?: string;
  timestamp: string;
}

export interface LatencyProgress {
  providerId: string;
  latency: number;
  status: string;
}

export interface LatencyError {
  providerId: string;
  error: string;
  message: string;
}

export interface CheckRequest {
  providerId: string;
  mode: LatencyMode;
  credentialId: string;
}

export interface CheckAllRequest {
  mode: LatencyMode;
  concurrency: number;
  timeout: number;
}

export interface CheckAllResult {
  results: LatencyResult[];
}

export interface SyncRequest {
  protocol: SyncProtocol;
  config: Record<string, string>;
}

export interface SyncResult {
  success: boolean;
  timestamp: string;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error';
  message: string;
}

export interface SyncError {
  protocol: SyncProtocol;
  error: string;
  message: string;
}

export interface ExportRequest {
  target: string;
  data: Record<string, unknown>;
  url?: string;
  apiKey?: string;
}

export interface ExportResult {
  success: boolean;
  message: string;
}

export interface ExportError {
  target: string;
  error: string;
  message: string;
}

export interface OAuthRequest {
  provider: string;
  state: string;
}

export interface OAuthCallback {
  code: string;
  state: string;
}

export interface OAuthResult {
  provider: string;
  tokens: Record<string, string>;
}

export interface OAuthError {
  provider: string;
  error: string;
  message: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ConfigError {
  code: string;
  message: string;
}

export interface UsageError {
  providerId: string;
  error: string;
  message: string;
}
