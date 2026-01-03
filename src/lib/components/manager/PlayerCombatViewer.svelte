<script lang="ts">
    import { t } from 'svelte-i18n';
    import { X, Swords, Clock } from 'lucide-svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import CombatViewerCard from './CombatViewerCard.svelte';
    import { sortCombatants } from '$lib/logic/initiative';
    import type { InitiativeStyle } from '$lib/systems';

    interface Props {
        isOpen: boolean;
        campaign: any;
        onClose: () => void;
    }

    let { isOpen = false, campaign, onClose }: Props = $props();

    // Combat state from campaign
    let combat = $derived(campaign?.combat || { active: false, round: 1 });
    let activeEnemies = $derived(campaign?.activeEnemies || []);
    let roster = $derived(campaign?.sessionRoster || []);
    let members = $derived(campaign?.members || []);
    let currentStyle = $derived<InitiativeStyle>(campaign?.initiativeStyle || 'dle');
    let healthDisplayMode = $derived<'bar' | 'estimate'>(campaign?.healthDisplayMode || 'bar');

    // Build players list from members in roster
    let players = $derived(members.filter(m => roster.includes(m.id) && (!m.campaignApproval || m.campaignApproval === 'approved')).map(m => ({ ...m, type: 'player' })));

    // Sorted combatants
    let sortedCombatants = $derived(sortCombatants(currentStyle, players, activeEnemies));
</script>

<Modal {isOpen} {onClose} title={$t('session.combat_viewer.title')} maxWidth="max-w-lg">
    {#if combat.active}
        <!-- Round Counter -->
        <div class="flex items-center justify-center gap-3 mb-4 py-3 bg-slate-900/50 rounded-xl border border-slate-800">
            <Clock size={18} class="text-indigo-400" />
            <div class="text-center">
                <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{$t('session.combat.round')}</div>
                <div class="text-2xl font-mono font-bold text-white leading-none">{combat.round}</div>
            </div>
        </div>

        <!-- Combatants List -->
        <div class="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
            {#each sortedCombatants as entity (entity.type === 'player' ? entity.id : entity.instanceId)}
                <CombatViewerCard {entity} {healthDisplayMode} />
            {/each}
            {#if sortedCombatants.length === 0}
                <div class="text-center text-slate-500 italic py-8">{$t('session.combat.empty')}</div>
            {/if}
        </div>
    {:else}
        <div class="text-center py-12">
            <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <Swords size={32} />
            </div>
            <p class="text-slate-400 font-bold">{$t('session.combat_viewer.no_combat')}</p>
        </div>
    {/if}
</Modal>
