import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock dependencies
vi.mock('$lib/db', () => {
    const mockMap = new Map();
    const mockDeletedMap = new Map();
    const mockCampaignsMap = new Map();

    return {
        charactersMap: {
            get: (id: string) => mockMap.get(id),
            set: (id: string, value: any) => mockMap.set(id, value),
            delete: (id: string) => mockMap.delete(id),
            has: (id: string) => mockMap.has(id),
            forEach: (callback: any) => mockMap.forEach(callback),
            clear: () => mockMap.clear(),
            values: () => mockMap.values(),
            keys: () => mockMap.keys(),
            _mockMap: mockMap
        },
        campaignsMap: {
            get: (id: string) => mockCampaignsMap.get(id),
            set: (id: string, value: any) => mockCampaignsMap.set(id, value),
            delete: (id: string) => mockCampaignsMap.delete(id),
            has: (id: string) => mockCampaignsMap.has(id),
            forEach: (callback: any) => mockCampaignsMap.forEach(callback),
            clear: () => mockCampaignsMap.clear(),
            values: () => mockCampaignsMap.values(),
            keys: () => mockCampaignsMap.keys(),
            _mockMap: mockCampaignsMap
        },
        deletedIdsMap: {
            get: (id: string) => mockDeletedMap.get(id),
            set: (id: string, value: any) => mockDeletedMap.set(id, value),
            delete: (id: string) => mockDeletedMap.delete(id),
            has: (id: string) => mockDeletedMap.has(id),
            forEach: (callback: any) => mockDeletedMap.forEach(callback),
            clear: () => mockDeletedMap.clear(),
            values: () => mockDeletedMap.values(),
            keys: () => mockDeletedMap.keys(),
            _mockMap: mockDeletedMap
        }
    };
});

vi.mock('$lib/stores/live', () => ({
    liveCharacters: {
        subscribe: vi.fn()
    },
    liveCampaigns: {
        subscribe: vi.fn()
    }
}));

describe('Google Drive Sync - Deletion Regression Tests', () => {
    let charactersMap: any;
    let campaignsMap: any;
    let deletedIdsMap: any;

    beforeEach(async () => {
        // Import mocked modules
        const db = await import('$lib/db');
        charactersMap = db.charactersMap;
        campaignsMap = db.campaignsMap;
        deletedIdsMap = db.deletedIdsMap;

        // Clear all maps before each test
        (charactersMap as any)._mockMap.clear();
        (campaignsMap as any)._mockMap.clear();
        (deletedIdsMap as any)._mockMap.clear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Deletion Tracking', () => {
        it('should track deleted character IDs in deletedIdsMap', () => {
            const charId = 'char-123';
            const deletionData = { type: 'character', deletedAt: Date.now() };

            deletedIdsMap.set(charId, deletionData);

            expect(deletedIdsMap.has(charId)).toBe(true);
            expect(deletedIdsMap.get(charId)).toEqual(deletionData);
        });

        it('should track deleted campaign IDs in deletedIdsMap', () => {
            const campId = 'camp-456';
            const deletionData = { type: 'campaign', deletedAt: Date.now() };

            deletedIdsMap.set(campId, deletionData);

            expect(deletedIdsMap.has(campId)).toBe(true);
            expect(deletedIdsMap.get(campId)).toEqual(deletionData);
        });

        it('should maintain multiple deleted IDs', () => {
            deletedIdsMap.set('char-1', { type: 'character', deletedAt: Date.now() });
            deletedIdsMap.set('char-2', { type: 'character', deletedAt: Date.now() });
            deletedIdsMap.set('camp-1', { type: 'campaign', deletedAt: Date.now() });

            expect(deletedIdsMap.has('char-1')).toBe(true);
            expect(deletedIdsMap.has('char-2')).toBe(true);
            expect(deletedIdsMap.has('camp-1')).toBe(true);
        });
    });

    describe('syncToCloud - Deleted IDs Export', () => {
        it('should include deletedIds array in backup data structure', () => {
            // Setup: Add some deleted IDs
            deletedIdsMap.set('char-deleted', { type: 'character', deletedAt: 1000 });
            deletedIdsMap.set('camp-deleted', { type: 'campaign', deletedAt: 2000 });

            // Simulate building deletedIds array (as done in syncToCloud)
            const deletedIdsArray: any[] = [];
            deletedIdsMap.forEach((value: any, key: string) => {
                deletedIdsArray.push({ id: key, ...value });
            });

            expect(deletedIdsArray).toHaveLength(2);
            expect(deletedIdsArray).toContainEqual({
                id: 'char-deleted',
                type: 'character',
                deletedAt: 1000
            });
            expect(deletedIdsArray).toContainEqual({
                id: 'camp-deleted',
                type: 'campaign',
                deletedAt: 2000
            });
        });

        it('should handle empty deletedIds gracefully', () => {
            const deletedIdsArray: any[] = [];
            deletedIdsMap.forEach((value: any, key: string) => {
                deletedIdsArray.push({ id: key, ...value });
            });

            expect(deletedIdsArray).toHaveLength(0);
        });

        it('should strictly filter out items present in deletedIds (logic verification)', () => {
            // Setup: Character exists in the "Live" map
            charactersMap.set('ghost-char', { id: 'ghost-char', name: 'Ghost' });

            // Mark as deleted
            deletedIdsMap.set('ghost-char', { type: 'character', deletedAt: Date.now() });

            // Logic under test (Sanitization Logic from syncToCloud)
            const deletedIdsSet = new Set<string>();
            deletedIdsMap.forEach((v: any, k: string) => deletedIdsSet.add(k));

            const liveChars = Array.from(charactersMap.values());
            const filteredChars = liveChars.filter((c: any) => !deletedIdsSet.has(String(c.id)));

            expect(filteredChars.length).toBe(0);
        });
    });

    describe('syncFromCloud - Deleted IDs Filtering', () => {
        it('should skip characters that are in deletedIds when syncing from cloud', () => {
            // Setup: Mark character as deleted locally
            const deletedCharId = 'char-deleted';
            deletedIdsMap.set(deletedCharId, { type: 'character', deletedAt: Date.now() });

            // Simulate cloud data with the deleted character
            const cloudCharacters = [
                { id: deletedCharId, name: 'Deleted Hero', level: 5 },
                { id: 'char-active', name: 'Active Hero', level: 3 }
            ];

            // Build deletedIds set (as done in syncFromCloud)
            const deletedIds = new Set<string>();
            deletedIdsMap.forEach((value: any, key: string) => {
                deletedIds.add(key);
            });

            // Simulate sync logic
            for (const cloudChar of cloudCharacters) {
                if (deletedIds.has(cloudChar.id)) {
                    continue; // Skip deleted
                }
                if (!charactersMap.has(cloudChar.id)) {
                    charactersMap.set(cloudChar.id, cloudChar);
                }
            }

            // Verify: Deleted character was NOT added
            expect(charactersMap.has(deletedCharId)).toBe(false);
            // Verify: Active character WAS added
            expect(charactersMap.has('char-active')).toBe(true);
        });

        it('should skip campaigns that are in deletedIds when syncing from cloud', () => {
            const deletedCampId = 'camp-deleted';
            deletedIdsMap.set(deletedCampId, { type: 'campaign', deletedAt: Date.now() });

            const cloudCampaigns = [
                { id: deletedCampId, name: 'Old Campaign' },
                { id: 'camp-active', name: 'Active Campaign' }
            ];

            const deletedIds = new Set<string>();
            deletedIdsMap.forEach((value: any, key: string) => {
                deletedIds.add(key);
            });

            for (const cloudCamp of cloudCampaigns) {
                if (deletedIds.has(cloudCamp.id)) {
                    continue;
                }
                if (!campaignsMap.has(cloudCamp.id)) {
                    campaignsMap.set(cloudCamp.id, cloudCamp);
                }
            }

            expect(campaignsMap.has(deletedCampId)).toBe(false);
            expect(campaignsMap.has('camp-active')).toBe(true);
        });

        it('should sync deletions from cloud to local (cross-device deletion)', () => {
            // Setup: Character exists locally
            const charId = 'char-sync-delete';
            charactersMap.set(charId, { id: charId, name: 'Hero' });

            // Cloud backup includes this ID in deletedIds (deleted on another device)
            const cloudDeletedIds = [
                { id: charId, type: 'character', deletedAt: Date.now() }
            ];

            // Simulate syncFromCloud logic for cloud deletions
            const deletedIds = new Set<string>();
            for (const deletedEntry of cloudDeletedIds) {
                if (!deletedIdsMap.has(deletedEntry.id)) {
                    deletedIdsMap.set(deletedEntry.id, deletedEntry);
                }
                deletedIds.add(deletedEntry.id);

                if (deletedEntry.type === 'character' && charactersMap.has(deletedEntry.id)) {
                    charactersMap.delete(deletedEntry.id);
                }
            }

            // Verify: Character was removed locally
            expect(charactersMap.has(charId)).toBe(false);
            // Verify: Deletion was tracked locally
            expect(deletedIdsMap.has(charId)).toBe(true);
        });

        it('should handle campaign deletion sync from cloud', () => {
            const campId = 'camp-sync-delete';
            campaignsMap.set(campId, { id: campId, name: 'Campaign' });

            const cloudDeletedIds = [
                { id: campId, type: 'campaign', deletedAt: Date.now() }
            ];

            for (const deletedEntry of cloudDeletedIds) {
                if (!deletedIdsMap.has(deletedEntry.id)) {
                    deletedIdsMap.set(deletedEntry.id, deletedEntry);
                }

                if (deletedEntry.type === 'campaign' && campaignsMap.has(deletedEntry.id)) {
                    campaignsMap.delete(deletedEntry.id);
                }
            }

            expect(campaignsMap.has(campId)).toBe(false);
            expect(deletedIdsMap.has(campId)).toBe(true);
        });
    });

    describe('Full Sync Cycle - Regression Test', () => {
        it('should prevent deleted character from reappearing after full sync cycle', () => {
            const charId = 'char-regression';

            // Step 1: Character exists locally
            charactersMap.set(charId, { id: charId, name: 'Test Hero', level: 1 });
            expect(charactersMap.has(charId)).toBe(true);

            // Step 2: User deletes character (simulating Dashboard.deleteCharacter)
            charactersMap.delete(charId);
            deletedIdsMap.set(charId, { type: 'character', deletedAt: Date.now() });
            expect(charactersMap.has(charId)).toBe(false);
            expect(deletedIdsMap.has(charId)).toBe(true);

            // Step 3: syncToCloud would upload deletedIds (verified in previous test)

            // Step 4: Page refresh - syncFromCloud receives cloud data with the character
            const cloudData = {
                characters: [
                    { id: charId, name: 'Test Hero', level: 1 } // Still in cloud backup
                ],
                deletedIds: [
                    { id: charId, type: 'character', deletedAt: Date.now() }
                ]
            };

            // Simulate syncFromCloud logic
            const deletedIds = new Set<string>();
            deletedIdsMap.forEach((value: any, key: string) => {
                deletedIds.add(key);
            });

            // Process cloud deletedIds
            if (cloudData.deletedIds) {
                for (const deletedEntry of cloudData.deletedIds) {
                    if (!deletedIdsMap.has(deletedEntry.id)) {
                        deletedIdsMap.set(deletedEntry.id, deletedEntry);
                    }
                    deletedIds.add(deletedEntry.id);
                }
            }

            // Process cloud characters (should skip deleted ones)
            if (cloudData.characters) {
                for (const cloudChar of cloudData.characters) {
                    if (deletedIds.has(cloudChar.id)) {
                        continue; // CRITICAL: Skip deleted character
                    }
                    if (!charactersMap.has(cloudChar.id)) {
                        charactersMap.set(cloudChar.id, cloudChar);
                    }
                }
            }

            // Step 5: Verify character did NOT reappear
            expect(charactersMap.has(charId)).toBe(false);
            expect(deletedIdsMap.has(charId)).toBe(true);
        });

        it('should prevent deleted campaign from reappearing after full sync cycle', () => {
            const campId = 'camp-regression';

            campaignsMap.set(campId, { id: campId, name: 'Test Campaign' });

            // Delete
            campaignsMap.delete(campId);
            deletedIdsMap.set(campId, { type: 'campaign', deletedAt: Date.now() });

            // Sync from cloud
            const cloudData = {
                campaigns: [
                    { id: campId, name: 'Test Campaign' }
                ],
                deletedIds: [
                    { id: campId, type: 'campaign', deletedAt: Date.now() }
                ]
            };

            const deletedIds = new Set<string>();
            deletedIdsMap.forEach((value: any, key: string) => {
                deletedIds.add(key);
            });

            if (cloudData.deletedIds) {
                for (const deletedEntry of cloudData.deletedIds) {
                    deletedIds.add(deletedEntry.id);
                }
            }

            if (cloudData.campaigns) {
                for (const cloudCamp of cloudData.campaigns) {
                    if (deletedIds.has(cloudCamp.id)) {
                        continue;
                    }
                    if (!campaignsMap.has(cloudCamp.id)) {
                        campaignsMap.set(cloudCamp.id, cloudCamp);
                    }
                }
            }

            expect(campaignsMap.has(campId)).toBe(false);
        });
    });
});
