import { joinRoom, selfId } from 'trystero/torrent';
import { writable, get, derived } from 'svelte/store';
import { characterActions, character, isHistoryOpen, damage, currentHealth, normalHealth } from '$lib/stores/characterStore';
import { sotdlCharacter, sotdlCharacterActions } from '$lib/stores/characterStoreSotDL';
import { campaignsMap } from '$lib/db';
import { appId } from '../../app';

export const roomConfig = {
    appId,
    trackerUrls: [
        'wss://tracker.openwebtorrent.com',
        'wss://tracker.files.fm:7073/announce',
        'wss://tracker.webtorrent.dev',
        'wss://toad.vibe.community:443/announce',
        'wss://tracker.btorrent.xyz'
    ]
};

export const syncState = writable({
    roomId: null as string | null,
    peers: [] as string[],
    currentCharacterId: null as string | null,
    lastGmUpdate: 0,
    isGM: false,
    isConnected: false
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

// Track connection attempts for rate limiting
let lastLobbyJoinAttempt = 0;
let lastCampaignJoinAttempt = 0;
const MIN_JOIN_INTERVAL_MS = 2000; // Minimum 2 seconds between join attempts

// Global Discovery
const lobbyConfig = { appId: 'weird-wizard-vault-lobby' };
export const publicCampaigns = writable<any[]>([]);

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

export function joinLobby() {
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

    try {
        lobby = joinRoom(lobbyConfig, 'public-discovery');
        const [sendDiscovery, getDiscovery] = lobby.makeAction('discovery');

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

        return sendDiscovery;
    } catch (e) {
        console.error('Failed to join lobby:', e);
        lobby = null;
        return null;
    }
}


let sendDiscovery: any;

function initLobby() {
    if (typeof window !== 'undefined') {
        // Use sessionStorage to track initialization across HMR reloads
        const alreadyInitialized = sessionStorage.getItem('lobby-initialized');
        if (!alreadyInitialized) {
            sessionStorage.setItem('lobby-initialized', 'true');
            sendDiscovery = joinLobby();
        } else if (!lobby) {
            // Lobby was initialized before but lost (e.g., due to HMR), rejoin
            sendDiscovery = joinLobby();
        }
    }
}

// Only initialize once on first module load
if (typeof window !== 'undefined') {
    initLobby();

    // Cleanup on page unload to prevent dangling peer connections
    window.addEventListener('beforeunload', () => {
        cleanupAllConnections();
    });

    // Also handle visibility change for mobile browsers
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // Page is being hidden, cleanup connections
            cleanupAllConnections();
        }
    });
}

/**
 * Cleanup all WebRTC connections
 */
function cleanupAllConnections() {
    if (lobbyCleanupInterval) {
        clearInterval(lobbyCleanupInterval);
        lobbyCleanupInterval = null;
    }
    if (campaignHeartbeatInterval) {
        clearInterval(campaignHeartbeatInterval);
        campaignHeartbeatInterval = null;
    }
    safeLeave(lobby, 'lobby');
    safeLeave(room, 'room');
    lobby = null;
    room = null;
}


let currentRoomId: string | null = null;

export function joinCampaignRoom(campaignId: string, isGM: boolean = false, charId: string | null = null) {
    const targetRoomId = `campaign-${campaignId}`;

    // Prevent duplicate connections to the same room
    if (currentRoomId === targetRoomId && room) {
        // Just update the state if we're already in this room
        syncState.update(s => ({
            ...s,
            isGM,
            currentCharacterId: charId
        }));
        return room;
    }

    // Rate limit campaign join attempts
    if (!canAttemptJoin(lastCampaignJoinAttempt)) {
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

    // Clear broadcasters
    broadcastCombat = null;
    broadcastHistory = null;
    broadcastCharacterUpdate = null;
    broadcastCampaign = null;

    try {
        currentRoomId = targetRoomId;
        room = joinRoom(roomConfig, currentRoomId);

        syncState.set({
            isConnected: true,
            isGM,
            currentCharacterId: charId,
            peers: [],
            roomId: campaignId,
            lastGmUpdate: 0
        });

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
                    passwordHash: data.passwordHash
                }));
            }
        });

        // Heartbeat discovery for this campaign if GM
        if (isGM && sendDiscovery) {
            campaignHeartbeatInterval = setInterval(() => {
                const current = campaignsMap.get(campaignId);
                if (current && current.isPublished) {
                    sendDiscovery({
                        id: campaignId,
                        name: current.name,
                        gmName: current.gmName || 'Mestre',
                        description: current.description
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

        room.onPeerJoin((peerId: string) => {
            syncState.update(s => ({ ...s, peers: [...s.peers, peerId] }));
            // If GM, send current state to the new peer
            if (isGM) {
                const current = campaignsMap.get(campaignId);
                if (current) {
                    if (current.combat) sendCombat(current.combat);
                    sendCampaign({
                        name: current.name,
                        gmName: current.gmName || 'Mestre',
                        passwordHash: current.passwordHash
                    });
                }
            }
        });

        room.onPeerLeave((peerId: string) => {
            syncState.update(s => ({ ...s, peers: s.peers.filter(p => p !== peerId) }));
        });

        return room;
    } catch (e) {
        console.error('Failed to join campaign room:', e);
        room = null;
        currentRoomId = null;
        syncState.set({
            isConnected: false,
            isGM: false,
            currentCharacterId: null,
            peers: [],
            roomId: null,
            lastGmUpdate: 0
        });
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
            passwordHash: campaignData.passwordHash
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
    safeLeave(room, 'campaign room');
    room = null;
    currentRoomId = null;
    broadcastCombat = null;
    broadcastHistory = null;
    broadcastCharacterUpdate = null;
    broadcastCampaign = null;
    syncState.set({
        isConnected: false,
        isGM: false,
        currentCharacterId: null,
        peers: [],
        roomId: null,
        lastGmUpdate: 0
    });
}

export function resetSyncStateForTesting() {
    // Clear all intervals
    if (lobbyCleanupInterval) {
        clearInterval(lobbyCleanupInterval);
        lobbyCleanupInterval = null;
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

    // Reset rate limiting
    lastLobbyJoinAttempt = 0;
    lastCampaignJoinAttempt = 0;

    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('lobby-initialized');
    }
}
