import { joinRoom, selfId } from 'trystero';
import { writable, get } from 'svelte/store';
import { characterActions, character, isHistoryOpen } from '$lib/stores/characterStore';
import { campaignsMap } from '$lib/db';

const roomConfig = { appId: 'weird-wizard-vault' };

export const syncState = writable({
    isConnected: false,
    peers: [] as string[],
    isGM: false,
    room: null as any
});

let room: any = null;
let broadcastCombat: any = null;
let broadcastHistory: any = null;
let broadcastCharacterUpdate: any = null;

export function joinCampaignRoom(campaignId: string, isGM: boolean = false) {
    if (room) room.leave();

    room = joinRoom(roomConfig, `campaign-${campaignId}`);
    
    syncState.update(s => ({ ...s, isConnected: true, isGM, room }));

    // Actions
    const [sendCombat, getCombat] = room.makeAction('combat');
    const [sendHistory, getHistory] = room.makeAction('history');
    const [sendCharUpdate, getCharUpdate] = room.makeAction('charUpdate');

    broadcastCombat = sendCombat;
    broadcastHistory = sendHistory;
    broadcastCharacterUpdate = sendCharUpdate;

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

    getHistory((data: any) => {
        // Shared history - prevent duplicates if needed
        characterActions.addToHistory(data, false); // Add a flag to prevent re-broadcasting
    });

    getCharUpdate((data: any) => {
        if (isGM) {
            // GM updates the local DB/maps for this campaign
            const current = campaignsMap.get(campaignId);
            if (current) {
                const enemies = current.activeEnemies || [];
                const idx = enemies.findIndex((e: any) => e.id === data.id && e.type === 'player');
                if (idx !== -1) {
                    enemies[idx] = { ...enemies[idx], ...data };
                    campaignsMap.set(campaignId, { ...current, activeEnemies: [...enemies] });
                }
            }
        }
    });

    room.onPeerJoin((peerId: string) => {
        syncState.update(s => ({ ...s, peers: [...s.peers, peerId] }));
        // If GM, send current state to the new peer
        if (isGM) {
            const current = campaignsMap.get(campaignId);
            if (current && current.combat) {
                sendCombat(current.combat);
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
