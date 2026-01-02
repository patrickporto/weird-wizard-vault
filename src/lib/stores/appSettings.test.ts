import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { appSettings } from './characterStore';

describe('appSettings', () => {
    beforeEach(() => {
        // Reset settings to default before each test
        appSettings.set({
            autoOpenHistory: false,
            stickyHistory: false,
            theme: 'dark',
            userName: ''
        });
        vi.clearAllMocks();
    });

    it('should update userName and persist to localStorage', () => {
        appSettings.update(s => ({ ...s, userName: 'Hero' }));

        const current = get(appSettings);
        expect(current.userName).toBe('Hero');

        const stored = window.localStorage.getItem('wwv_app_settings');
        expect(stored).toContain('"userName":"Hero"');
    });

    it('should not have defaultPlayerName or defaultGmName', () => {
        const current = get(appSettings) as any;
        expect(current.defaultPlayerName).toBeUndefined();
        expect(current.defaultGmName).toBeUndefined();
    });
});
