import { joinRoom, selfId } from 'trystero';
import { writable, get, derived } from 'svelte/store';
import { characterActions, character, isHistoryOpen, damage, currentHealth, normalHealth } from '$lib/stores/characterStore';
import { campaignsMap } from '$lib/db';

const roomConfig = { appId: 'weird-wizard-vault' };

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

// Global Discovery
const lobbyConfig = { appId: 'weird-wizard-vault-lobby' };
export const publicCampaigns = writable<any[]>([]);

export function joinLobby() {
    if (lobby) return;
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
    setInterval(() => {
        const now = Date.now();
        publicCampaigns.update(list => list.filter(c => (now - c.lastSeen) < 120000));
    }, 60000);

    return sendDiscovery;
}

let sendDiscovery: any;
function initLobby() {
    if (typeof window !== 'undefined') {
        sendDiscovery = joinLobby();
    }
}
initLobby();

export function joinCampaignRoom(campaignId: string, isGM: boolean = false, charId: string | null = null) {
    if (room) room.leave();

    room = joinRoom(roomConfig, `campaign-${campaignId}`);

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
                gmName: data.gmName
            }));
        }
    });

    // Heartbeat discovery for this campaign if GM
    if (isGM) {
        setInterval(() => {
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
                    newMembers[idx] = { ...newMembers[idx], ...charData, lastUpdate: Date.now() };
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
                character.update(c => ({
                    ...c,
                    name: charData.name || c.name,
                    afflictions: charData.afflictions || c.afflictions,
                    initiative: charData.initiative !== undefined ? charData.initiative : (c.initiative ?? false),
                    acted: charData.acted !== undefined ? charData.acted : (c.acted ?? false)
                }));
                if (charData.damage !== undefined) damage.set(charData.damage);
                if (charData.currentHealth !== undefined) currentHealth.set(charData.currentHealth);
                if (charData.normalHealth !== undefined) normalHealth.set(charData.normalHealth);
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
                    gmName: current.gmName || 'Mestre'
                });
            }
        }
    });

    room.onPeerLeave((peerId: string) => {
        syncState.update(s => ({ ...s, peers: s.peers.filter(p => p !== peerId) }));
    });

    return room;
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
            gmName: campaignData.gmName || 'Mestre'
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
