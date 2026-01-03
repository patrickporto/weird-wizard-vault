
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// 1. Mock de dependências ANTES dos imports que as usam
vi.mock('$lib/db', () => ({
    campaignsMap: new Map(),
    charactersMap: new Map(),
    enemiesMap: new Map(),
    encountersMap: new Map(),
    imagesMap: new Map(),
    deletedIdsMap: new Map()
}));

// Variável para controlar os dados retornados pelo mock das live stores
let mockCampaignsData: any[] = [];
let mockCharactersData: any[] = [];

vi.mock('$lib/stores/live', () => ({
    // Implementação simplificada de store svelte-like que funciona com get()
    liveCampaigns: {
        subscribe: (cb: any) => { cb(mockCampaignsData); return () => { }; }
    },
    liveCharacters: {
        subscribe: (cb: any) => { cb(mockCharactersData); return () => { }; },
        filter: () => []
    },
    liveEnemies: { subscribe: (cb: any) => { cb([]); return () => { }; }, filter: () => [] },
    liveEncounters: { subscribe: (cb: any) => { cb([]); return () => { }; }, filter: () => [] }
}));

vi.mock('$lib/stores/syncStatus', () => ({
    syncStatus: { set: vi.fn() },
    lastSyncTime: { set: vi.fn() },
    authError: { set: vi.fn() }
}));

vi.mock('$lib/stores/characterStore', () => ({
    appSettings: { subscribe: (cb: any) => { cb({}); return () => { }; }, set: vi.fn() },
    character: { subscribe: vi.fn() }
}));

// Import modules under test
import { syncToCloud, googleSession } from '$lib/logic/googleDrive';
import { campaignsMap, charactersMap, deletedIdsMap } from '$lib/db';

describe('Google Drive Sync Regression - Player Removal', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.useFakeTimers();

        googleSession.set({
            signedIn: true,
            accessToken: 'mock-token',
            tokenExpiry: Date.now() + 3600000,
            userProfile: { name: 'Test User', picture: '' },
            isInited: true
        });

        global.fetch = vi.fn();
        mockCampaignsData = [];
      mockCharactersData = [];
        (campaignsMap as Map<string, any>).clear();
      (charactersMap as Map<string, any>).clear();
      (deletedIdsMap as Map<string, any>).clear();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('should correctly sync campaign update when a player is removed', async () => {
        // Setup scenarios
        const campaignId = 'camp-1';
        let campaignData = {
            id: campaignId,
            name: 'Test Campaign',
            members: [
                { id: 'player-1', name: 'Player 1' },
                { id: 'player-2', name: 'Player 2' }
            ]
        };

        // 1. Initial State: Campaign with 2 players
        mockCampaignsData = [campaignData]; // Updates liveCampaigns store
        (campaignsMap as Map<string, any>).set(campaignId, campaignData);

        // Mock fetch for listBackups (found existing file)
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ files: [{ id: 'backup-file-id', name: 'weird-wizard-backup.json' }] })
        });
        // Mock fetch for uploadBackup (PATCH)
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'backup-file-id' })
        });

        // Execute first sync
        await syncToCloud();
        await vi.advanceTimersByTimeAsync(2500); // Advance debounce

        // Verify first upload has 2 members
        const firstCall = (global.fetch as any).mock.calls.find((call: any[]) =>
            call[1].method === 'PATCH'
        );
        expect(firstCall).toBeDefined();
        const firstBody = JSON.parse(firstCall[1].body);
        expect(firstBody.campaigns[0].members).toHaveLength(2);

        // 2. Remove Player 2
        (global.fetch as any).mockClear(); // Clear previous calls

        campaignData = {
            ...campaignData,
            members: [{ id: 'player-1', name: 'Player 1' }]
        };
        // Update stores/db
        mockCampaignsData = [campaignData];
        (campaignsMap as Map<string, any>).set(campaignId, campaignData);

        // Mock fetches again for second sync
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ files: [{ id: 'backup-file-id' }] })
        });
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'backup-file-id' })
        });

        // Execute second sync
        await syncToCloud();
        await vi.advanceTimersByTimeAsync(2500);

        // Verify second upload
        const secondCall = (global.fetch as any).mock.calls.find((call: any[]) =>
            call[1].method === 'PATCH'
        );

        expect(secondCall).toBeDefined();
        const secondBody = JSON.parse(secondCall[1].body);

        // Assertions for Regression
        const syncedCamp = secondBody.campaigns.find((c: any) => c.id === campaignId);
        expect(syncedCamp).toBeDefined();
        expect(syncedCamp.members).toHaveLength(1, 'Campaign should have only 1 member after removal');
        expect(syncedCamp.members[0].id).toBe('player-1');
    });

  it('should correctly sync character update when an item is removed', async () => {
    const charId = 'char-1';
    let charData = {
      id: charId,
      name: 'Test Wizard',
      equipment: [
        { id: 'item-1', name: 'Staff', quantity: 1 },
        { id: 'item-2', name: 'Potion', quantity: 1 }
      ],
      lastUpdate: Date.now()
    };

    // 1. Initial State
    mockCharactersData = [charData];
    (charactersMap as Map<string, any>).set(charId, charData);

    // Mock fetches
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [{ id: 'backup-char-id', name: 'weird-wizard-backup.json' }] })
    });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'backup-char-id' })
    });

    // Sync 1
    await syncToCloud();
    await vi.advanceTimersByTimeAsync(2500);

    // Verify Sync 1
    const firstCall = (global.fetch as any).mock.calls.find((call: any[]) =>
      call[1].method === 'PATCH'
    );
    const firstBody = JSON.parse(firstCall[1].body);
    const syncedChar1 = firstBody.characters.find((c: any) => c.id === charId);
    expect(syncedChar1.equipment).toHaveLength(2);

    // 2. Remove Item (Potion)
    (global.fetch as any).mockClear();

    charData = {
      ...charData,
      equipment: [{ id: 'item-1', name: 'Staff', quantity: 1 }],
      lastUpdate: Date.now() + 1000 // Newer timestamp
    };

    mockCharactersData = [charData];
    (charactersMap as Map<string, any>).set(charId, charData);

    // Mock fetches for Sync 2
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [{ id: 'backup-char-id' }] })
    });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'backup-char-id' })
    });

    // Sync 2
    await syncToCloud();
    await vi.advanceTimersByTimeAsync(2500);

    // Verify Sync 2
    const secondCall = (global.fetch as any).mock.calls.find((call: any[]) =>
      call[1].method === 'PATCH'
    );

    expect(secondCall).toBeDefined();
    const secondBody = JSON.parse(secondCall[1].body);

    const syncedChar2 = secondBody.characters.find((c: any) => c.id === charId);
    expect(syncedChar2).toBeDefined();
    expect(syncedChar2.equipment).toHaveLength(1, 'Character should have only 1 item after removal');
    expect(syncedChar2.equipment[0].id).toBe('item-1');
  });
});
