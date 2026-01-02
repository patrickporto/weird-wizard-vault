import { describe, it, expect } from 'vitest';

describe('AppSettings Merge Logic', () => {
    it('should prioritize local settings over cloud settings', () => {
        // Simulate current local settings with recent changes
        const currentSettings = {
            autoOpenHistory: true,  // User just changed this
            stickyHistory: false,
            theme: 'dark',
            userName: 'Local User'  // User just changed this
        };

        // Simulate stale cloud settings
        const cloudSettings = {
            autoOpenHistory: false,  // Old value
            stickyHistory: false,
            theme: 'dark',
            userName: 'Old User'  // Old value
        };

        // Merge with local priority
        const mergedSettings = {
            ...cloudSettings,
            ...currentSettings
        };

        // Local changes should be preserved
        expect(mergedSettings.autoOpenHistory).toBe(true);
        expect(mergedSettings.userName).toBe('Local User');
    });

    it('should use cloud values for fields not present locally', () => {
        const currentSettings = {
            autoOpenHistory: true,
            theme: 'dark'
            // Missing stickyHistory and userName
        };

        const cloudSettings = {
            autoOpenHistory: false,
            stickyHistory: true,  // From cloud
            theme: 'light',
            userName: 'Cloud User'  // From cloud
        };

        const mergedSettings = {
            ...cloudSettings,
            ...currentSettings
        };

        // Local values override
        expect(mergedSettings.autoOpenHistory).toBe(true);
        expect(mergedSettings.theme).toBe('dark');

        // Cloud values fill in missing fields
        expect(mergedSettings.stickyHistory).toBe(true);
        expect(mergedSettings.userName).toBe('Cloud User');
    });

    it('should handle empty local settings', () => {
        const currentSettings = {};

        const cloudSettings = {
            autoOpenHistory: false,
            stickyHistory: true,
            theme: 'dark',
            userName: 'Cloud User'
        };

        const mergedSettings = {
            ...cloudSettings,
            ...currentSettings
        };

        // All cloud values should be used
        expect(mergedSettings).toEqual(cloudSettings);
    });

    it('should handle empty cloud settings', () => {
        const currentSettings = {
            autoOpenHistory: true,
            stickyHistory: false,
            theme: 'dark',
            userName: 'Local User'
        };

        const cloudSettings = {};

        const mergedSettings = {
            ...cloudSettings,
            ...currentSettings
        };

        // All local values should be preserved
        expect(mergedSettings).toEqual(currentSettings);
    });
});
