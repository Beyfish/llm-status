import { useStore } from './index';
import type { LatencyResult } from '@/types';

let cleanupFns: Array<() => void> = [];

export function setupIPCListeners(): void {
  if (typeof window === 'undefined' || !window.electronAPI) return;
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];

  const cleanupProgress = window.electronAPI.onLatencyProgress((data: any) => {
    useStore.setState((s) => ({
      latencyStatus: { ...s.latencyStatus, [data.providerId]: 'checking' },
      latencyResults: { ...s.latencyResults, [data.providerId]: data },
    }));
  });
  cleanupFns.push(cleanupProgress as unknown as () => void);

  const cleanupComplete = window.electronAPI.onLatencyComplete((data: any) => {
    const newStatus: Record<string, 'idle' | 'checking' | 'done' | 'error'> = {};
    const newResults: Record<string, LatencyResult> = {};
    data.results?.forEach((r: LatencyResult) => {
      newStatus[r.providerId] = r.status === 'success' ? 'done' : 'error';
      newResults[r.providerId] = r;
    });
    useStore.setState({ latencyStatus: newStatus, latencyResults: newResults });
  });
  cleanupFns.push(cleanupComplete as unknown as () => void);

  const cleanupSync = window.electronAPI.onSyncStatus((data: any) => {
    useStore.setState({ syncStatus: data.status });
  });
  cleanupFns.push(cleanupSync as unknown as () => void);
}

export function cleanupIPCListeners(): void {
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
}
