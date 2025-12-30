import { writable } from 'svelte/store';

export type SyncState = 'idle' | 'syncing' | 'error' | 'success' | 'offline';

export const syncStatus = writable<SyncState>('idle');
export const lastSyncTime = writable<number | null>(null);
