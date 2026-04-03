import { create } from 'zustand';
import type {
  Provider,
  AppConfig,
  AppSettings,
  LatencyResult,
  LatencyMode,
  ViewMode,
  Theme,
} from '@/types';

interface StoreState {
  // Provider
  providers: Provider[];
  selectedProviderId: string | null;
  // Latency
  latencyStatus: Record<string, 'idle' | 'checking' | 'done' | 'error'>;
  latencyResults: Record<string, LatencyResult>;
  bulkChecking: boolean;
  // Sync
  syncStatus: 'idle' | 'syncing' | 'error' | 'conflict';
  syncConflict: { localVersion?: string; remoteVersion?: string; localModifiedAt?: string; remoteModifiedAt?: string } | null;
  lastSyncAt: string | null;
  // Export
  exportStatus: Record<string, 'idle' | 'exporting' | 'done' | 'error'>;
  // UI
  viewMode: ViewMode;
  theme: Theme;
  searchQuery: string;
  commandPaletteOpen: boolean;
  // Settings
  settings: Partial<AppSettings>;
  // Methods
  loadProviders: () => Promise<void>;
  addProvider: (provider: Provider) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  setSelectedProvider: (id: string | null) => void;
  checkLatency: (providerId: string, mode: LatencyMode) => Promise<void>;
  checkAll: (mode: LatencyMode, concurrency: number, timeout: number) => Promise<void>;
  uploadSync: () => Promise<void>;
  downloadSync: () => Promise<void>;
  forceSyncUpload: () => Promise<void>;
  resolveSyncConflict: (strategy: 'local' | 'remote') => Promise<void>;
  pushToTarget: (target: string, config: Record<string, unknown>) => Promise<void>;
  exportToFile: (target: string, config: Record<string, unknown>) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  setSearchQuery: (query: string) => void;
  toggleCommandPalette: () => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

function getConfig(state: StoreState): Partial<AppConfig> {
  return {
    providers: state.providers,
    settings: state.settings,
    schemaVersion: 1,
  } as Partial<AppConfig>;
}

export const useStore = create<StoreState>()((set, get) => ({
  // Initial state
  providers: [],
  selectedProviderId: null,
  latencyStatus: {},
  latencyResults: {},
  bulkChecking: false,
  syncStatus: 'idle',
  syncConflict: null,
  lastSyncAt: null,
  exportStatus: {},
  viewMode: 'card',
  theme: 'dark',
  searchQuery: '',
  commandPaletteOpen: false,
  settings: {},

  // Provider methods
  loadProviders: async () => {
    try {
      const config = await window.electronAPI.configRead();
      set({ providers: (config as any).providers || [] });
    } catch {
      // Empty state on first launch
    }
  },
  addProvider: async (provider: Provider) => {
    const state = get();
    const newProviders = [...state.providers, provider];
    await window.electronAPI.configWrite({ ...getConfig(state), providers: newProviders });
    set({ providers: newProviders });
  },
  removeProvider: async (id: string) => {
    const state = get();
    const newProviders = state.providers.filter((p: Provider) => p.id !== id);
    await window.electronAPI.configWrite({ ...getConfig(state), providers: newProviders });
    set({ providers: newProviders });
  },
  setSelectedProvider: (id: string | null) => {
    set({ selectedProviderId: id });
  },

  // Latency methods
  checkLatency: async (providerId: string, mode: LatencyMode) => {
    set((s) => ({
      latencyStatus: { ...s.latencyStatus, [providerId]: 'checking' },
    }));
    try {
      await window.electronAPI.latencyCheck({ providerId, mode, credentialId: '' });
    } catch {
      set((s) => ({
        latencyStatus: { ...s.latencyStatus, [providerId]: 'error' },
      }));
    }
  },
  checkAll: async (mode: LatencyMode, concurrency: number, timeout: number) => {
    const state = get();
    const initialStatus: Record<string, 'idle' | 'checking' | 'done' | 'error'> = {};
    state.providers.forEach((p: Provider) => {
      initialStatus[p.id] = 'checking';
    });
    set({ latencyStatus: initialStatus, bulkChecking: true });
    try {
      await window.electronAPI.latencyCheckAll({ mode, concurrency, timeout });
    } catch {
      set({ bulkChecking: false });
      // Error handled via IPC
    }
  },

  // Sync methods
  uploadSync: async () => {
    set({ syncStatus: 'syncing', syncConflict: null });
    try {
      const config = getConfig(get());
      const result = await window.electronAPI.syncUpload({ protocol: 'webdav', config });
      if (result.conflict?.hasConflict) {
        set({
          syncStatus: 'conflict',
          syncConflict: {
            localVersion: result.conflict.localVersion,
            remoteVersion: result.conflict.remoteVersion,
            localModifiedAt: result.conflict.localModifiedAt,
            remoteModifiedAt: result.conflict.remoteModifiedAt,
          },
        });
      } else {
        set({ syncStatus: 'idle', lastSyncAt: result.timestamp });
      }
    } catch {
      set({ syncStatus: 'error' });
    }
  },
  downloadSync: async () => {
    set({ syncStatus: 'syncing', syncConflict: null });
    try {
      const result = await window.electronAPI.syncDownload({ protocol: 'webdav', config: {} });
      if (result.success && result.data) {
        const remoteConfig = result.data as any;
        if (remoteConfig.providers) {
          set({
            providers: remoteConfig.providers,
            settings: remoteConfig.settings || {},
            syncStatus: 'idle',
            syncConflict: null,
            lastSyncAt: result.timestamp,
          });
          await window.electronAPI.configWrite(remoteConfig);
        } else {
          set({ syncStatus: 'idle', syncConflict: null, lastSyncAt: result.timestamp });
        }
      } else {
        set({ syncStatus: 'idle', syncConflict: null, lastSyncAt: result.timestamp });
      }
    } catch {
      set({ syncStatus: 'error' });
    }
  },

  forceSyncUpload: async () => {
    // Force upload ignoring conflicts
    set({ syncStatus: 'syncing', syncConflict: null });
    try {
      const config = getConfig(get());
      const configWithForce = { ...config, forceUpload: true };
      await window.electronAPI.syncUpload({ protocol: 'webdav', config: configWithForce });
      set({ syncStatus: 'idle', lastSyncAt: new Date().toISOString() });
    } catch {
      set({ syncStatus: 'error' });
    }
  },

  resolveSyncConflict: async (strategy: 'local' | 'remote') => {
    if (strategy === 'remote') {
      // Download remote version and overwrite local
      await get().downloadSync();
    } else {
      // Force upload local version
      await get().forceSyncUpload();
    }
    set({ syncConflict: null });
  },

  // Export methods
  pushToTarget: async (target: string, config: Record<string, unknown>) => {
    set((s) => ({
      exportStatus: { ...s.exportStatus, [target]: 'exporting' },
    }));
    try {
      await window.electronAPI.exportPush({ target, data: config });
      set((s) => ({
        exportStatus: { ...s.exportStatus, [target]: 'done' },
      }));
    } catch {
      set((s) => ({
        exportStatus: { ...s.exportStatus, [target]: 'error' },
      }));
    }
  },
  exportToFile: async (target: string, config: Record<string, unknown>) => {
    set((s) => ({
      exportStatus: { ...s.exportStatus, [target]: 'exporting' },
    }));
    try {
      await window.electronAPI.exportFile({ target, data: config });
      set((s) => ({
        exportStatus: { ...s.exportStatus, [target]: 'done' },
      }));
    } catch {
      set((s) => ({
        exportStatus: { ...s.exportStatus, [target]: 'error' },
      }));
    }
  },

  // UI methods
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setTheme: (theme: Theme) => set({ theme }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  // Settings methods
  updateSettings: async (settings: Partial<AppSettings>) => {
    const state = get();
    const newSettings = { ...state.settings, ...settings };
    await window.electronAPI.configWrite({ ...getConfig(state), settings: newSettings });
    set({ settings: newSettings });
  },
}));

// Setup IPC listeners
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.onLatencyProgress((data: any) => {
    useStore.setState((s) => ({
      bulkChecking: true,
      latencyStatus: { ...s.latencyStatus, [data.providerId]: 'checking' },
      latencyResults: { ...s.latencyResults, [data.providerId]: data },
    }));
  });

  window.electronAPI.onLatencyComplete((data: any) => {
    const newStatus: Record<string, 'idle' | 'checking' | 'done' | 'error'> = {};
    const newResults: Record<string, LatencyResult> = {};
    data.results?.forEach((r: LatencyResult) => {
      newStatus[r.providerId] = r.status === 'success' ? 'done' : 'error';
      newResults[r.providerId] = r;
    });
    useStore.setState({ latencyStatus: newStatus, latencyResults: newResults, bulkChecking: false });
  });

  window.electronAPI.onSyncStatus((data: any) => {
    useStore.setState({ syncStatus: data.status });
  });
}
