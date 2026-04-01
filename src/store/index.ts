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
  // Sync
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncAt: string | null;
  // Export
  exportStatus: Record<string, 'idle' | 'exporting' | 'done' | 'error'>;
  // UI
  viewMode: ViewMode;
  theme: Theme;
  searchQuery: string;
  commandPaletteOpen: boolean;
  showSyncModal: boolean;
  showExportModal: boolean;
  showSettingsModal: boolean;
  // Settings
  settings: Partial<AppSettings>;
  // Methods
  loadProviders: () => Promise<void>;
  addProvider: (provider: Provider) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  setSelectedProvider: (id: string | null) => void;
  checkLatency: (providerId: string, mode: LatencyMode) => Promise<void>;
  checkAll: (mode: LatencyMode, concurrency: number, timeout: number) => Promise<void>;
  uploadSync: (protocol: string, connectionConfig: Record<string, string>) => Promise<void>;
  downloadSync: (protocol: string, connectionConfig: Record<string, string>) => Promise<void>;
  pushToTarget: (target: string, config: Record<string, unknown>) => Promise<void>;
  exportToFile: (target: string, config: Record<string, unknown>) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  setSearchQuery: (query: string) => void;
  toggleCommandPalette: () => void;
  setShowSyncModal: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
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
  syncStatus: 'idle',
  lastSyncAt: null,
  exportStatus: {},
  viewMode: 'card',
  theme: 'dark',
  searchQuery: '',
  commandPaletteOpen: false,
  showSyncModal: false,
  showExportModal: false,
  showSettingsModal: false,
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
    set({ latencyStatus: initialStatus });
    try {
      await window.electronAPI.latencyCheckAll({ mode, concurrency, timeout });
    } catch {
      // Error handled via IPC
    }
  },

  // Sync methods
  uploadSync: async (protocol: string, connectionConfig: Record<string, string>) => {
    set({ syncStatus: 'syncing' });
    try {
      const appConfig = getConfig(get());
      await window.electronAPI.syncUpload({ protocol, config: { ...connectionConfig, ...appConfig } });
      set({ syncStatus: 'idle', lastSyncAt: new Date().toISOString() });
    } catch {
      set({ syncStatus: 'error' });
    }
  },
  downloadSync: async (protocol: string, connectionConfig: Record<string, string>) => {
    set({ syncStatus: 'syncing' });
    try {
      const result = await window.electronAPI.syncDownload({ protocol, config: connectionConfig });
      if (result.success) {
        set({ syncStatus: 'idle', lastSyncAt: result.timestamp });
      }
    } catch {
      set({ syncStatus: 'error' });
    }
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
  setShowSyncModal: (show: boolean) => set({ showSyncModal: show }),
  setShowExportModal: (show: boolean) => set({ showExportModal: show }),
  setShowSettingsModal: (show: boolean) => set({ showSettingsModal: show }),

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
    useStore.setState({ latencyStatus: newStatus, latencyResults: newResults });
  });

  window.electronAPI.onSyncStatus((data: any) => {
    useStore.setState({ syncStatus: data.status });
  });
}
