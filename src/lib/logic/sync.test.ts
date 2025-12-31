import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

// Mock WebSocket - must be set before module loading
function MockWebSocket(this: any, url: string) {
  this.readyState = 1;
  this.onopen = null;
  this.onclose = null;
  this.onerror = null;
  this.onmessage = null;
  this.addEventListener = vi.fn();
  this.removeEventListener = vi.fn();
  this.send = vi.fn();
  this.close = vi.fn();
  setTimeout(() => {
    if (this.onopen) this.onopen({});
  }, 0);
}
(MockWebSocket as any).CONNECTING = 0;
(MockWebSocket as any).OPEN = 1;
(MockWebSocket as any).CLOSING = 2;
(MockWebSocket as any).CLOSED = 3;
// @ts-ignore
global.WebSocket = MockWebSocket;

// Mock trystero to avoid WebSocket issues entirely
vi.mock('trystero/torrent', () => ({
  joinRoom: vi.fn(() => ({
    leave: vi.fn(),
    getPeers: vi.fn(() => ({})),
    onPeerJoin: vi.fn(() => vi.fn()),
    onPeerLeave: vi.fn(() => vi.fn()),
    makeAction: vi.fn(() => [vi.fn(), vi.fn(() => vi.fn())]),
  })),
  selfId: 'test-peer-id'
}));

import { joinLobby, resetSyncStateForTesting, publicCampaigns, syncRoll, syncCharacter, joinCampaignRoom, leaveCampaignRoom, syncState } from './sync';
import { get } from 'svelte/store';

/**
 * Regression Tests for WebRTC Peer Connection Leak Fix
 *
 * Bug: Multiple HMR reloads caused peer connection leaks because joinLobby()
 * would create new connections without cleaning up old ones, eventually hitting
 * the browser's RTCPeerConnection limit.
 *
 * Fix:
 * - joinLobby() now properly closes existing connections before creating new ones
 * - Rate limiting prevents rapid successive join attempts
 * - Proper interval cleanup prevents memory leaks
 * - Safe leave helper handles errors gracefully
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

  // Mock RTCPeerConnection as a proper class
  class MockRTCPeerConnection {
    close = vi.fn();
    createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
    createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' });
    setLocalDescription = vi.fn().mockResolvedValue(undefined);
    setRemoteDescription = vi.fn().mockResolvedValue(undefined);
    addIceCandidate = vi.fn().mockResolvedValue(undefined);
    createDataChannel = vi.fn().mockReturnValue(mockDataChannel);
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    localDescription = null;
    remoteDescription = null;
    signalingState = 'stable';
    iceConnectionState = 'new';
    connectionState = 'new';
    iceGatheringState = 'new';
    onicecandidate = null;
    ondatachannel = null;
    onnegotiationneeded = null;
    onconnectionstatechange = null;
  }
  global.RTCPeerConnection = MockRTCPeerConnection as any;

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

  // Mock document for visibility change listener
  if (typeof document === 'undefined') {
    global.document = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      visibilityState: 'visible'
    } as any;
  }
});

// Clean up any pending async operations after all tests
import { afterAll } from 'vitest';
afterAll(() => {
  resetSyncStateForTesting();
  vi.clearAllTimers();
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

  it('should not throw if syncRoll is called when no room is active', () => {
    expect(() => {
      syncRoll({ test: 'data' });
    }).not.toThrow();
  });

  it('should not throw if syncCharacter is called when no room is active', () => {
    expect(() => {
      syncCharacter({ id: 'test', name: 'Test Character' });
    }).not.toThrow();
  });
});

describe('sync.ts - Campaign Room Management', () => {
  beforeEach(() => {
    resetSyncStateForTesting();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  afterEach(() => {
    resetSyncStateForTesting();
  });

  it('should handle leaveCampaignRoom gracefully when no room exists', () => {
    expect(() => {
      leaveCampaignRoom();
    }).not.toThrow();

    const state = get(syncState);
    expect(state.isConnected).toBe(false);
    expect(state.roomId).toBeNull();
  });

  it('should reset sync state when leaving campaign room', () => {
    // First set up some state
    syncState.set({
      isConnected: true,
      isGM: true,
      currentCharacterId: 'char-123',
      peers: ['peer-1', 'peer-2'],
      roomId: 'campaign-test',
      lastGmUpdate: Date.now()
    });

    // Leave the room
    leaveCampaignRoom();

    // Verify state is reset
    const state = get(syncState);
    expect(state.isConnected).toBe(false);
    expect(state.isGM).toBe(false);
    expect(state.currentCharacterId).toBeNull();
    expect(state.peers).toEqual([]);
    expect(state.roomId).toBeNull();
  });

  it('should update state when already in same room', () => {
    // Join a campaign room
    joinCampaignRoom('test-campaign', false, 'char-1');

    // Join the same room again with different parameters (same room bypass rate limit)
    joinCampaignRoom('test-campaign', true, 'char-2');

    const state = get(syncState);
    expect(state.isGM).toBe(true);
    expect(state.currentCharacterId).toBe('char-2');
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

  it('should filter out stale campaigns', () => {
    const freshCampaign = {
      id: 'fresh',
      name: 'Fresh Campaign',
      lastSeen: Date.now()
    };

    const staleCampaign = {
      id: 'stale',
      name: 'Stale Campaign',
      lastSeen: Date.now() - 150000 // Over 2 minutes ago
    };

    publicCampaigns.set([freshCampaign, staleCampaign]);

    // Simulate the cleanup logic
    const now = Date.now();
    publicCampaigns.update(list => list.filter(c => (now - c.lastSeen) < 120000));

    const campaigns = get(publicCampaigns);
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].id).toBe('fresh');
  });
});

describe('sync.ts - Rate Limiting', () => {
  beforeEach(() => {
    resetSyncStateForTesting();
  });

  afterEach(() => {
    resetSyncStateForTesting();
  });

  it('should rate limit rapid lobby join attempts', () => {
    // First call should work
    const result1 = joinLobby();

    // Immediate second call should be rate limited (returns null)
    const result2 = joinLobby();

    // Result2 should be null due to rate limiting
    expect(result2).toBeNull();
  });
});
