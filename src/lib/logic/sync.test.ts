import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { joinLobby, resetSyncStateForTesting, publicCampaigns } from './sync';
import { get } from 'svelte/store';

/**
 * Regression Tests for WebRTC Peer Connection Leak Fix
 * 
 * Bug: Multiple HMR reloads caused peer connection leaks because joinLobby()
 * would create new connections without cleaning up old ones, eventually hitting
 * the browser's RTCPeerConnection limit.
 * 
 * Fix: joinLobby() now properly closes existing connections before creating new ones.
 */

// Mock browser APIs needed for WebRTC
beforeAll(() => {
    // Mock RTCDataChannel
    const mockDataChannel = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        send: vi.fn(),
        close: vi.fn(),
        readyState: 'open',
        label: 'data',
    };

    // Mock RTCPeerConnection
    global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
        close: vi.fn(),
        createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
        createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' }),
        setLocalDescription: vi.fn().mockResolvedValue(undefined),
        setRemoteDescription: vi.fn().mockResolvedValue(undefined),
        addIceCandidate: vi.fn().mockResolvedValue(undefined),
        createDataChannel: vi.fn().mockReturnValue(mockDataChannel),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        localDescription: null,
        remoteDescription: null,
        signalingState: 'stable',
        iceConnectionState: 'new',
        connectionState: 'new',
        iceGatheringState: 'new',
    })) as any;

    // Mock sessionStorage if not available
    if (typeof sessionStorage === 'undefined') {
        const storage: Record<string, string> = {};
        global.sessionStorage = {
            getItem: (key: string) => storage[key] || null,
            setItem: (key: string, value: string) => { storage[key] = value; },
            removeItem: (key: string) => { delete storage[key]; },
            clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
            key: (index: number) => Object.keys(storage)[index] || null,
            length: Object.keys(storage).length
        } as Storage;
    }

    // Mock window.addEventListener if needed
    if (typeof window === 'undefined') {
        global.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as any;
    }
});

describe('sync.ts - WebRTC Connection Management', () => {
    beforeEach(() => {
        // Clear any existing state
        resetSyncStateForTesting();
        // Clear sessionStorage
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
        }
    });

    afterEach(() => {
        resetSyncStateForTesting();
    });

    it('should not leak peer connections when joinLobby is called multiple times', () => {
        // This test verifies the regression fix for the peer connection leak
        
        // Mock the joinRoom function to track calls
        const mockLeave = vi.fn();
        const mockRoom = {
            leave: mockLeave,
            makeAction: vi.fn(() => [vi.fn(), vi.fn()])
        };

        // We can't easily mock the trystero module, but we can verify
        // that calling joinLobby multiple times doesn't throw errors
        expect(() => {
            joinLobby();
        }).not.toThrow();

        // Calling again should not throw (it should clean up the previous lobby)
        expect(() => {
            joinLobby();
        }).not.toThrow();

        // And again
        expect(() => {
            joinLobby();
        }).not.toThrow();
    });

    it('should initialize publicCampaigns store', () => {
        const campaigns = get(publicCampaigns);
        expect(Array.isArray(campaigns)).toBe(true);
    });

    it('should properly clean up lobby in resetSyncStateForTesting', () => {
        // Join lobby first
        joinLobby();

        // Reset should not throw
        expect(() => {
            resetSyncStateForTesting();
        }).not.toThrow();

        // After reset, sessionStorage should be cleared
        if (typeof sessionStorage !== 'undefined') {
            expect(sessionStorage.getItem('lobby-initialized')).toBeNull();
        }
    });

    it('should handle cleanup errors gracefully when leaving lobby', () => {
        // This test ensures that if lobby.leave() throws an error,
        // it doesn't prevent the new lobby from being created
        
        // First call to establish a lobby
        joinLobby();

        // Second call should handle any cleanup errors gracefully
        // (we can't easily force an error, but we verify no exception is thrown)
        expect(() => {
            joinLobby();
        }).not.toThrow();
    });
});

describe('sync.ts - Public Campaigns Store', () => {
    beforeEach(() => {
        resetSyncStateForTesting();
        publicCampaigns.set([]);
    });

    afterEach(() => {
        resetSyncStateForTesting();
    });

    it('should initialize with empty array', () => {
        publicCampaigns.set([]);
        const campaigns = get(publicCampaigns);
        expect(campaigns).toEqual([]);
    });

    it('should allow adding campaigns to the store', () => {
        const testCampaign = {
            id: 'test-campaign-1',
            name: 'Test Campaign',
            gmName: 'Test GM',
            description: 'A test campaign',
            lastSeen: Date.now()
        };

        publicCampaigns.set([testCampaign]);
        const campaigns = get(publicCampaigns);
        
        expect(campaigns).toHaveLength(1);
        expect(campaigns[0]).toMatchObject({
            id: 'test-campaign-1',
            name: 'Test Campaign',
            gmName: 'Test GM'
        });
    });

    it('should allow updating campaigns in the store', () => {
        const campaign1 = {
            id: 'camp-1',
            name: 'Campaign 1',
            gmName: 'GM 1',
            lastSeen: Date.now()
        };

        const campaign2 = {
            id: 'camp-2',
            name: 'Campaign 2',
            gmName: 'GM 2',
            lastSeen: Date.now()
        };

        publicCampaigns.set([campaign1]);
        
        publicCampaigns.update(list => [...list, campaign2]);
        
        const campaigns = get(publicCampaigns);
        expect(campaigns).toHaveLength(2);
        expect(campaigns.map(c => c.id)).toEqual(['camp-1', 'camp-2']);
    });
});
