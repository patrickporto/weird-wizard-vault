/**
 * Tab Sync - BroadcastChannel-based synchronization between browser tabs
 * Much simpler than WebRTC for same-browser communication
 */
import { writable } from 'svelte/store';
import { campaignsMap, charactersMap } from '$lib/db';

// Store for combat state synced across tabs
export const tabSyncedCombat = writable<any>(null);

let channel: BroadcastChannel | null = null;
let currentCampaignId: string | null = null;

/**
 * Subscribe to combat updates for a campaign
 */
export function subscribeToCampaignTab(campaignId: string) {
    if (typeof window === 'undefined') return;

    // Close existing channel if different campaign
    if (channel && currentCampaignId !== campaignId) {
        channel.close();
        channel = null;
    }

    currentCampaignId = campaignId;
    channel = new BroadcastChannel(`campaign-${campaignId}`);

    // Listen for updates from other tabs
    channel.onmessage = (event) => {
        const { type, data } = event.data;
        console.log('[TabSync] Received:', type, data);
        if (type === 'combat-update') {
            tabSyncedCombat.set(data);
        } else if (type === 'campaign-update') {
            // Update local copy of campaign
            const current = campaignsMap.get(campaignId);
            if (current) {
                console.log('[TabSync] Updating campaign, current:', current, 'new data:', data);
                campaignsMap.set(campaignId, { ...current, ...data });
                // Force trigger Y.js observe by doing a no-op set
                setTimeout(() => {
                    const updated = campaignsMap.get(campaignId);
                    if (updated) {
                        campaignsMap.set(campaignId, { ...updated });
                    }
                }, 0);
            }
        } else if (type === 'character-update') {
            // Update local character (from charactersMap)
            const current = charactersMap.get(data.id);
            if (current) {
                charactersMap.set(data.id, { ...current, ...data });
            }
        }
    };

    // Request current state from other tabs
    channel.postMessage({ type: 'request-state' });
}

/**
 * Broadcast combat update to all tabs
 */
export function broadcastCombatUpdate(campaignId: string, combatData: any) {
    if (!channel || currentCampaignId !== campaignId) {
        subscribeToCampaignTab(campaignId);
    }
    if (channel) {
        channel.postMessage({ type: 'combat-update', data: combatData });
    }
}

/**
 * Broadcast full campaign update to all tabs
 */
export function broadcastCampaignUpdate(campaignId: string, campaignData: any) {
    if (!channel || currentCampaignId !== campaignId) {
        subscribeToCampaignTab(campaignId);
    }
    if (channel) {
        console.log('[TabSync] Broadcasting campaign-update:', campaignData);
        channel.postMessage({ type: 'campaign-update', data: campaignData });
    }
}

/**
 * Broadcast character update to all tabs
 */
export function broadcastCharacterUpdate(campaignId: string, characterData: any) {
    if (!channel || currentCampaignId !== campaignId) {
        subscribeToCampaignTab(campaignId);
    }
    if (channel) {
        channel.postMessage({ type: 'character-update', data: characterData });
    }
}

/**
 * Cleanup channel on unmount
 */
export function unsubscribeFromCampaignTab() {
    if (channel) {
        channel.close();
        channel = null;
    }
    currentCampaignId = null;
}
