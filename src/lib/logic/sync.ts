import { joinRoom, selfId } from 'trystero/torrent';
import { writable, get, derived } from 'svelte/store';
import { characterActions, character, isHistoryOpen, damage, currentHealth, normalHealth } from '$lib/stores/characterStore';
import { sotdlCharacter, sotdlCharacterActions } from '$lib/stores/characterStoreSotDL';
import { campaignsMap } from '$lib/db';
import { appId } from '../../app';
import { trackerUrl } from '../stores/settingsStore';

// Dynamic config to support user-defined tracker URL
export function getTrackerConfig() {
  const url = get(trackerUrl);
  return {
    appId,
    trackerUrls: [url]
  };
}

// Connection Status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export const syncState = writable({
  roomId: null as string | null,
  peers: [] as string[],
  currentCharacterId: null as string | null,
  lastGmUpdate: 0,
  isGM: false,
  isConnected: false,
  connectionStatus: 'disconnected' as ConnectionStatus
});

export const isGmOnline = derived(syncState, $s => {
  if (!$s.lastGmUpdate) return false;
  return (Date.now() - $s.lastGmUpdate) < 60000; // 60s timeout
});

let room: any = null;
let lobby: any = null;
let broadcastCombat: any = null;
let broadcastHistory: any = null;
let broadcastCharacterUpdate: any = null;
let broadcastCampaign: any = null;
let lobbyCleanupInterval: any = null;
let campaignHeartbeatInterval: any = null;
let connectionMonitorInterval: any = null;

// Track connection attempts for rate limiting
let lastLobbyJoinAttempt = 0;
let lastCampaignJoinAttempt = 0;
const MIN_JOIN_INTERVAL_MS = 2000; // Minimum 2 seconds between join attempts
const CHECK_INTERVAL_MS = 120000; // Check every 2 minutes

// Global Discovery
export const publicCampaigns = writable<any[]>([]);

// Lobby connection status
export type LobbyStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export const lobbyStatus = writable<LobbyStatus>('disconnected');

/**
 * Check connectivity to a WebSocket tracker
 */
async function checkTrackerConnection(url: string, timeout = 60000): Promise<boolean> {
  if (!url) return false;
  return new Promise((resolve) => {
    let ws: WebSocket | null = null;
    let resolved = false;

    // Prevent hanging promise
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (ws) {
          ws.onopen = null;
          ws.onerror = null;
          try {
            // Only close if appropriate to reduce console noise
            if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          } catch { }
        }
        resolve(false);
      }
    }, timeout);

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (resolved) {
          try { ws?.close(); } catch { }
          return;
        }
        resolved = true;
        clearTimeout(timer);
        try { ws?.close(); } catch { }
        resolve(true);
      };

      ws.onerror = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve(false); // Connection failed
      };
    } catch (e) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(false);
      }
    }
  });
}

function startConnectionMonitor(url: string) {
  if (connectionMonitorInterval) clearInterval(connectionMonitorInterval);
  connectionMonitorInterval = setInterval(async () => {
    // Increased timeout for monitor
    const isOnline = await checkTrackerConnection(url, 60000);
    syncState.update(s => {
      if (!isOnline && s.connectionStatus === 'connected') {
        return { ...s, connectionStatus: 'reconnecting' };
      } else if (isOnline && s.connectionStatus === 'reconnecting') {
        return { ...s, connectionStatus: 'connected' };
      }
      return s;
    });
  }, CHECK_INTERVAL_MS); // Check every 70s
}

/**
 * Safely leave a room/lobby, handling any errors gracefully
 */
function safeLeave(roomOrLobby: any, name: string): boolean {
  if (!roomOrLobby) return true;
  try {
    roomOrLobby.leave();
    return true;
  } catch (e) {
    console.warn(`Failed to leave ${name}:`, e);
    return false;
  }
}

/**
 * Check if we can attempt a new connection (rate limiting)
 */
function canAttemptJoin(lastAttempt: number): boolean {
  const now = Date.now();
  return (now - lastAttempt) >= MIN_JOIN_INTERVAL_MS;
}

// Monitoring variables
let lobbyMonitorInterval: any = null;

function startLobbyMonitor(url: string) {
  if (lobbyMonitorInterval) clearInterval(lobbyMonitorInterval);
  lobbyMonitorInterval = setInterval(async () => {
    const isOnline = await checkTrackerConnection(url, 60000);
    lobbyStatus.update(s => {
      if (!isOnline && s === 'connected') {
        console.warn('Lobby monitor: Tracker unreachable');
        return 'error';
      }
      if (isOnline && (s === 'disconnected' || s === 'error')) return 'connected';
      return s;
    });
  }, CHECK_INTERVAL_MS); // Check every 70s
}

let sendDiscovery: any;

export async function joinLobby() {
  const currentTracker = get(trackerUrl);

  // If lobby already exists, return the existing sendDiscovery function
  if (lobby && sendDiscovery) {
    console.log('Lobby already connected, reusing existing connection');
    lobbyStatus.set('connected');

    // Ensure monitor is running even if reusing
    startLobbyMonitor(currentTracker);

    return sendDiscovery;
  }

  // Rate limit lobby join attempts
  if (!canAttemptJoin(lastLobbyJoinAttempt)) {
    console.warn('Lobby join rate limited. Skipping duplicate join attempt.');
    return null;
  }
  lastLobbyJoinAttempt = Date.now();

  // Clear any existing cleanup interval
  if (lobbyCleanupInterval) {
    clearInterval(lobbyCleanupInterval);
    lobbyCleanupInterval = null;
  }

  // If lobby already exists, leave it first to prevent peer connection leaks
  safeLeave(lobby, 'existing lobby');
  lobby = null;

  lobbyStatus.set('connecting');

  // Verify tracker connectivity first
  const isOnline = await checkTrackerConnection(currentTracker);

  if (!isOnline) {
    console.warn(`Tracker ${currentTracker} appears offline.`);
    lobbyStatus.set('error');
    lobby = null;
    return null;
  }

  try {
    const config = getTrackerConfig();
    lobby = joinRoom(config, 'public-discovery');
    const [sendFn, getDiscovery] = lobby.makeAction('discovery');

    getDiscovery((data: any) => {
      publicCampaigns.update(list => {
        const idx = list.findIndex(c => c.id === data.id);
        if (idx !== -1) {
          const newList = [...list];
          newList[idx] = { ...data, lastSeen: Date.now() };
          return newList;
        }
        return [...list, { ...data, lastSeen: Date.now() }];
      });
    });

    // Cleanup stale campaigns from lobby view
    lobbyCleanupInterval = setInterval(() => {
      const now = Date.now();
      publicCampaigns.update(list => list.filter(c => (now - c.lastSeen) < 120000));
    }, 60000);

    lobbyStatus.set('connected');
    sendDiscovery = sendFn; // Store for reuse and announceCampaign

    // Start Monitor
    startLobbyMonitor(currentTracker);

    return sendFn;
  } catch (e) {
    console.error('Failed to join lobby:', e);
    lobby = null;
    lobbyStatus.set('error');
    return null;
  }
}

/**
 * Immediately announce a campaign to the public lobby.
 * Should be called when a campaign is published to ensure immediate visibility.
 */
export function announceCampaign(campaignData: { id: string; name: string; gmName?: string; description?: string; system?: string }) {
  if (!sendDiscovery) {
    console.warn('Cannot announce campaign: lobby not initialized');
    return false;
  }

  sendDiscovery({
    id: campaignData.id,
    name: campaignData.name,
    gmName: campaignData.gmName || 'Mestre',
    description: campaignData.description,
    system: campaignData.system
  });

  return true;
}

function initLobby() {
  if (typeof window !== 'undefined') {
    // joinLobby now handles duplicate detection internally and sets sendDiscovery
    joinLobby().catch(err => console.error('Error initializing lobby:', err));
  }
}

// Only initialize once on first module load
if (typeof window !== 'undefined') {
  initLobby();

  // Auto-reconnect when tracker URL changes
  let lastTrackerUrl = get(trackerUrl);
  trackerUrl.subscribe(newUrl => {
    if (newUrl === lastTrackerUrl) return;
    lastTrackerUrl = newUrl;

    console.log('Tracker URL changed, reconnecting...');

    // Reconnect Lobby
    if (get(lobbyStatus) !== 'disconnected') {
      lastLobbyJoinAttempt = 0; // Bypass rate limit
      joinLobby();
    }

    // Reconnect Campaign
    if (get(syncState).roomId) {
      lastCampaignJoinAttempt = 0; // Bypass rate limit
      reconnectCampaign();
    }
  });

  // Cleanup on page unload to prevent dangling peer connections
  window.addEventListener('beforeunload', () => {
    cleanupAllConnections();
  });

  window.addEventListener('online', () => {
    syncState.update(s => s.isConnected ? { ...s, connectionStatus: 'reconnecting' } : s);
    // Optionally trigger a reconnnect logic here if needed, but WebRTC might handle it.
    // For UI feedback, show reconnecting.
    setTimeout(() => {
      if (get(syncState).isConnected) {
        syncState.update(s => ({ ...s, connectionStatus: 'connected' }));
      }
    }, 2000);
  });

  window.addEventListener('offline', () => {
    syncState.update(s => s.isConnected ? { ...s, connectionStatus: 'disconnected' } : s);
  });

  // Note: Removed visibilitychange cleanup as it was causing excessive reconnections
  // WebRTC connections can survive brief page hides and will be cleaned up on actual navigation
}

/**
 * Cleanup all WebRTC connections
 */
function cleanupAllConnections() {
  if (lobbyCleanupInterval) {
    clearInterval(lobbyCleanupInterval);
    lobbyCleanupInterval = null;
  }
  if (lobbyMonitorInterval) {
    clearInterval(lobbyMonitorInterval);
    lobbyMonitorInterval = null;
  }
  if (campaignHeartbeatInterval) {
    clearInterval(campaignHeartbeatInterval);
    campaignHeartbeatInterval = null;
  }
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
    connectionMonitorInterval = null;
  }
  safeLeave(lobby, 'lobby');
  safeLeave(room, 'room');
  lobby = null;
  room = null;
  sendDiscovery = null; // Reset to prevent using stale function reference
  lobbyStatus.set('disconnected');
  syncState.update(s => ({ ...s, isConnected: false, connectionStatus: 'disconnected' }));
}


let currentRoomId: string | null = null;

export async function joinCampaignRoom(campaignId: string, isGM: boolean = false, charId: string | null = null) {
  const targetRoomId = `campaign-${campaignId}`;

  // Prevent duplicate connections to the same room
  if (currentRoomId === targetRoomId && room) {
    // Just update the state if we're already in this room
    syncState.update(s => ({
      ...s,
      isGM,
      currentCharacterId: charId,
      connectionStatus: 'connected'
    }));
    return room;
  }

  // Rate limit campaign join attempts (reduced logic for reconnections)
  if (!canAttemptJoin(lastCampaignJoinAttempt) && currentRoomId !== targetRoomId) {
    console.warn('Campaign join rate limited. Skipping duplicate join attempt.');
    return room;
  }
  lastCampaignJoinAttempt = Date.now();

  // Cleanup existing room
  if (campaignHeartbeatInterval) {
    clearInterval(campaignHeartbeatInterval);
    campaignHeartbeatInterval = null;
  }
  safeLeave(room, 'existing campaign room');
  room = null;
  currentRoomId = null;

  syncState.update(s => ({ ...s, connectionStatus: 'connecting' }));

  // Clear broadcasters
  broadcastCombat = null;
  broadcastHistory = null;
  broadcastCharacterUpdate = null;
  broadcastCampaign = null;

  // Verify tracker connectivity first
  const trackerConf = get(trackerUrl);
  const isOnline = await checkTrackerConnection(trackerConf);

  if (!isOnline) {
    console.warn(`Tracker ${trackerConf} appears offline.`);
    syncState.update(s => ({ ...s, connectionStatus: 'error', isConnected: false }));
    return null;
  }

  try {
    currentRoomId = targetRoomId;
    const config = getTrackerConfig();
    room = joinRoom(config, currentRoomId);

    syncState.set({
      isConnected: true,
      connectionStatus: 'connected',
      isGM,
      currentCharacterId: charId,
      peers: [],
      roomId: campaignId,
      lastGmUpdate: 0
    });

    // Start monitoring connection stability
    startConnectionMonitor(trackerConf);

    // Actions
    const [sendCombat, getCombat] = room.makeAction('combat');
    const [sendHistory, getHistory] = room.makeAction('history');
    const [sendCharUpdate, getCharUpdate] = room.makeAction('charUpdate');
    const [sendCampaign, getCampaign] = room.makeAction('campaign');

    broadcastCombat = sendCombat;
    broadcastHistory = sendHistory;
    broadcastCharacterUpdate = sendCharUpdate;
    broadcastCampaign = sendCampaign;

    // Listeners
    getCombat((data: any) => {
      if (!isGM) {
        // Player updates their character state based on GM broadcast
        character.update(c => ({
          ...c,
          currentRound: data.round,
          combatActive: data.active
        }));
      }
    });

    getCampaign((data: any) => {
      syncState.update(s => ({ ...s, lastGmUpdate: Date.now() }));
      if (!isGM) {
        character.update(c => ({
          ...c,
          campaignName: data.name,
          gmName: data.gmName,
          passwordHash: data.passwordHash,
          system: data.system
        }));
      }
    });

    // Heartbeat discovery for this campaign if GM
    if (isGM) {
      campaignHeartbeatInterval = setInterval(() => {
        if (!sendDiscovery) return;

        const current = campaignsMap.get(campaignId);
        if (current && current.isPublished) {
          sendDiscovery({
            id: campaignId,
            name: current.name,
            gmName: current.gmName || 'Mestre',
            description: current.description,
            system: current.system
          });
        }
      }, 30000);
    }

    getHistory((data: any) => {
      characterActions.addToHistory(data, false);
    });

    getCharUpdate((charData: any) => {
      if (isGM) {
        // GM updates the campaign's member list
        const current = campaignsMap.get(campaignId);
        if (current) {
          const members = current.members || [];
          const idx = members.findIndex((m: any) => m.id === charData.id);

          let newMembers;
          if (idx !== -1) {
            newMembers = [...members];
            const existing = newMembers[idx];

            // Don't let a 'pending' status from the player override an 'approved' status in the GM's database
            const mergedData = { ...charData };
            if (existing.campaignApproval === 'approved' && charData.campaignApproval === 'pending') {
              delete mergedData.campaignApproval;
            }

            newMembers[idx] = { ...existing, ...mergedData, lastUpdate: Date.now() };
          } else {
            newMembers = [...members, { ...charData, lastUpdate: Date.now() }];
          }

          // Also update in combat if present
          const enemies = current.activeEnemies || [];
          const eIdx = enemies.findIndex((e: any) => e.id === charData.id && e.type === 'player');
          let newEnemies = enemies;
          if (eIdx !== -1) {
            newEnemies = [...enemies];
            newEnemies[eIdx] = { ...newEnemies[eIdx], ...charData };
          }

          campaignsMap.set(campaignId, {
            ...current,
            members: newMembers,
            activeEnemies: newEnemies
          });
        }
      } else {
        // Player receives update from GM - check if this update is for our character
        const state = get(syncState);
        const charStoreData = get(character);
        const myCharId = state.currentCharacterId || charStoreData?.id;

        if (myCharId && myCharId === charData.id) {
          const isSotDL = charData.system === 'sofdl';

          // If GM sent a rejection or removal (campaignId null)
          if (charData.campaignApproval === 'rejected' || charData.campaignId === null) {
            if (isSotDL) {
              sotdlCharacterActions.leaveCampaign();
            } else {
              character.update(c => ({
                ...c,
                campaignId: null,
                campaignName: null,
                gmName: null,
                campaignApproval: null
              }));
            }
            return;
          }

          if (isSotDL) {
            sotdlCharacterActions.set({
              name: charData.name,
              afflictions: charData.afflictions,
              senses: charData.senses,
              initiative: charData.initiative,
              acted: charData.acted,
              campaignApproval: charData.campaignApproval,
              imageUrl: charData.imageUrl,
              notes: charData.notes,
              damage: charData.damage,
              health: charData.health,
              healingRate: charData.healingRate,
              insanity: charData.insanity,
              corruption: charData.corruption,
              defense: charData.defense,
              speed: charData.speed,
              power: charData.power,
              attributes: charData.attributes
            });
          } else {
            character.update(c => ({
              ...c,
              name: charData.name || c.name,
              afflictions: charData.afflictions || c.afflictions,
              senses: charData.senses || c.senses,
              initiative: charData.initiative !== undefined ? charData.initiative : (c.initiative ?? false),
              acted: charData.acted !== undefined ? charData.acted : (c.acted ?? false),
              campaignApproval: charData.campaignApproval || c.campaignApproval,
              imageUrl: charData.imageUrl || c.imageUrl,
              notes: charData.notes !== undefined ? charData.notes : c.notes
            }));
            if (charData.damage !== undefined) damage.set(charData.damage);
            if (charData.currentHealth !== undefined) currentHealth.set(charData.currentHealth);
            if (charData.normalHealth !== undefined) normalHealth.set(charData.normalHealth);
          }
        }
      }
    });

    // Setup room events
    room.onPeerJoin((peerId: string) => {
      console.log('Peer joined:', peerId);
      // Send current character data if player
      if (!isGM && charId) {
        broadcastCharacterUpdate({ type: 'full', character: get(appSettings).characters?.[charId] });
      }
      syncState.update(s => ({ ...s, peers: [...s.peers, peerId] }));
      // If GM, send current state to the new peer
      if (isGM) {
        const current = campaignsMap.get(campaignId);
        if (current) {
          if (current.combat) sendCombat(current.combat);
          sendCampaign({
            name: current.name,
            gmName: current.gmName || 'Mestre',
            passwordHash: current.passwordHash,
            system: current.system
          });
        }
      }
    });

    room.onPeerLeave((peerId: string) => {
      console.log('Peer left:', peerId);
      syncState.update(s => ({ ...s, peers: s.peers.filter(p => p !== peerId) }));
    });

    return room;
  } catch (e) {
    console.error('Failed to join campaign room:', e);
    room = null;
    currentRoomId = null;
    syncState.update(s => ({ ...s, isConnected: false, connectionStatus: 'error' }));
    return null;
  }
}

export function syncCombat(campaignId: string, combatData: any) {
  if (broadcastCombat) {
    broadcastCombat(combatData);
  }
}

export function syncCampaign(campaignId: string, campaignData: any) {
  if (broadcastCampaign) {
    broadcastCampaign({
      name: campaignData.name,
      gmName: campaignData.gmName || 'Mestre',
      passwordHash: campaignData.passwordHash,
      system: campaignData.system
    });
  }
}

export function syncRoll(rollData: any) {
  if (broadcastHistory) {
    broadcastHistory(rollData);
  }
}

export function syncCharacter(charData: any) {
  if (broadcastCharacterUpdate) {
    broadcastCharacterUpdate(charData);
  }
}


export function leaveCampaignRoom() {
  if (campaignHeartbeatInterval) {
    clearInterval(campaignHeartbeatInterval);
    campaignHeartbeatInterval = null;
  }
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
    connectionMonitorInterval = null;
  }
  safeLeave(room, 'campaign room');
  room = null;
  currentRoomId = null;
  broadcastCombat = null;
  broadcastHistory = null;
  broadcastCharacterUpdate = null;
  broadcastCampaign = null;
  syncState.set({
    isConnected: false,
    connectionStatus: 'disconnected',
    isGM: false,
    currentCharacterId: null,
    peers: [],
    roomId: null,
    lastGmUpdate: 0
  });
}

/**
 * Manually attempt to reconnect to the current campaign room
 */
export function reconnectCampaign() {
  const state = get(syncState);
  if (state.roomId) {
    console.log('Manual reconnection triggered');
    // Force status to connecting immediately for UI feedback
    syncState.update(s => ({ ...s, connectionStatus: 'connecting' }));
    // Small delay to ensure UI updates before heavy work
    setTimeout(() => {
      joinCampaignRoom(state.roomId!, state.isGM, state.currentCharacterId);
    }, 100);
  } else {
    console.warn('Cannot reconnect: no active campaign session found');
  }
}

export function resetSyncStateForTesting() {
  // Clear all intervals
  if (lobbyCleanupInterval) {
    clearInterval(lobbyCleanupInterval);
    lobbyCleanupInterval = null;
  }
  if (lobbyMonitorInterval) {
    clearInterval(lobbyMonitorInterval);
    lobbyMonitorInterval = null;
  }
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
    connectionMonitorInterval = null;
  }
  if (campaignHeartbeatInterval) {
    clearInterval(campaignHeartbeatInterval);
    campaignHeartbeatInterval = null;
  }

  safeLeave(lobby, 'lobby');
  safeLeave(room, 'room');
  lobby = null;
  room = null;
  currentRoomId = null;
  broadcastCombat = null;
  broadcastHistory = null;
  broadcastCharacterUpdate = null;
  broadcastCampaign = null;
  sendDiscovery = null;

  // Reset rate limiting
  lastLobbyJoinAttempt = 0;
  lastCampaignJoinAttempt = 0;
}
