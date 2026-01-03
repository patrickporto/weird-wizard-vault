<script lang="ts">
    import { t } from 'svelte-i18n';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { liveCampaigns, liveCharacters } from '$lib/stores/live';
    import { subscribeToCampaignTab, unsubscribeFromCampaignTab } from '$lib/logic/tabSync';
    import CombatViewerCard from '$lib/components/manager/CombatViewerCard.svelte';
    import { sortCombatants } from '$lib/logic/initiative';
    import type { InitiativeStyle } from '$lib/systems';
    import { Clock, Swords } from 'lucide-svelte';

    let id = $derived($page.params.id);
    let campaign = $derived($liveCampaigns.find(c => c.id === id));

    // Connect to campaign tab channel for same-browser sync
    onMount(() => {
        if (id) {
            subscribeToCampaignTab(id);
        }
        return () => {
            unsubscribeFromCampaignTab();
        };
    });


    // Combat state from campaign
    let combat = $derived(campaign?.combat || { active: false, round: 1 });
    let activeEnemies = $derived(campaign?.activeEnemies || []);
    let roster = $derived(campaign?.sessionRoster || []);
    let campaignMembers = $derived(campaign?.members || []);
    let currentStyle = $derived<InitiativeStyle>(campaign?.initiativeStyle || 'dle');
    let healthDisplayModePlayer = $derived<'bar' | 'estimate'>(campaign?.healthDisplayModePlayer || 'bar');
    let healthDisplayModeEnemy = $derived<'bar' | 'estimate'>(campaign?.healthDisplayModeEnemy || 'bar');

    // Build players list by merging liveCharacters with campaignMembers (same logic as SessionView)
    let allPlayers = $derived((() => {
        const allMemberIds = Array.from(new Set([...roster, ...campaignMembers.map(m => m.id)]));
        return allMemberIds.map(pid => {
            const local = $liveCharacters.find(c => c.id === pid);
            const member = campaignMembers.find(m => m.id === pid);

            // Merge: local provides base info, member data overrides with synced real-time values
            if (local && member) {
                return {
                    ...local,
                    ...member,
                    type: 'player',
                    lastUpdate: member.lastUpdate
                };
            }
            if (local) return { ...local, type: 'player' };
            if (member) return { ...member, type: 'player' };
            return null;
        }).filter(Boolean);
    })());

    let players = $derived(allPlayers.filter(p => !p.campaignApproval || p.campaignApproval === 'approved'));

    // Get only players in roster for combat
    let activePlayers = $derived(players.filter(p => roster.includes(p.id)));

    // Sorted combatants
    let sortedCombatants = $derived(sortCombatants(currentStyle, activePlayers, activeEnemies));
</script>

<svelte:head>
    <title>{campaign?.name ? `${$t('session.combat_viewer.title')} - ${campaign.name}` : $t('session.combat_viewer.title')}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                    <Swords size={20} />
                </div>
                <div>
                    <h1 class="text-lg font-bold">{$t('session.combat_viewer.title')}</h1>
                    <p class="text-xs text-slate-400">{campaign?.name || ''}</p>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-6">
        {#if campaign}
            {#if combat.active}
                <!-- Round Counter -->
                <div class="flex items-center justify-center gap-3 mb-6 py-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <Clock size={24} class="text-indigo-400" />
                    <div class="text-center">
                        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{$t('session.combat.round')}</div>
                        <div class="text-4xl font-mono font-bold text-white leading-none">{combat.round}</div>
                    </div>
                </div>

                <!-- Combatants List -->
                <div class="space-y-3">
                    {#each sortedCombatants as entity (entity.type === 'player' ? entity.id : entity.instanceId)}
                        <CombatViewerCard {entity} {healthDisplayModePlayer} {healthDisplayModeEnemy} />
                    {/each}
                    {#if sortedCombatants.length === 0}
                        <div class="text-center text-slate-500 italic py-8">{$t('session.combat.empty')}</div>
                    {/if}
                </div>
            {:else}
                <div class="text-center py-24">
                    <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                        <Swords size={40} />
                    </div>
                    <p class="text-xl text-slate-400 font-bold">{$t('session.combat_viewer.no_combat')}</p>
                    <p class="text-sm text-slate-500 mt-2">{$t('session.combat_viewer.waiting')}</p>
                </div>
            {/if}
        {:else}
            <div class="text-center py-24">
                <p class="text-slate-500">{$t('campaign.not_found.title')}</p>
            </div>
        {/if}
    </main>
</div>
