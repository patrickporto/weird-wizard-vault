import { writable } from 'svelte/store';

export const DEFAULT_TRACKER_URL = 'wss://tracker.openwebtorrent.com';

export const AVAILABLE_TRACKERS = [
    { label: 'OpenWebTorrent (Standard)', value: 'wss://tracker.openwebtorrent.com' },
    { label: 'Files.fm', value: 'wss://tracker.files.fm:7073/announce' },
    { label: 'WebTorrent Dev', value: 'wss://tracker.webtorrent.dev' },
    { label: 'Vibe Community', value: 'wss://toad.vibe.community:443/announce' },
    { label: 'BTorrent', value: 'wss://tracker.btorrent.xyz' }
];

const createPersistentStore = <T>(key: string, startValue: T) => {
    let initialValue = startValue;

    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) {
            initialValue = JSON.parse(stored);
        }
    }

    const { subscribe, set, update } = writable<T>(initialValue);

    return {
        subscribe,
        set: (value: T) => {
            if (typeof window !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
            }
            set(value);
        },
        update: (fn: (v: T) => T) => {
            update((v) => {
                const updated = fn(v);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(key, JSON.stringify(updated));
                }
                return updated;
            });
        }
    };
};

export const trackerUrl = createPersistentStore<string>('app_tracker_url', DEFAULT_TRACKER_URL);
