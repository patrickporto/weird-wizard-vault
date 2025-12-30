<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Check } from 'lucide-svelte';
    import { AFFLICTIONS_DATA } from '../../../../../routes/sofww';
    import { character, characterActions, modalState } from '$lib/stores/characterStore';
    import Modal from '$lib/components/common/Modal.svelte';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'affliction');

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }
</script>

<Modal {isOpen} title={$t('character.modals.manage_afflictions')} {onClose}>
    <div class="space-y-6 p-1">
        <div class="grid grid-cols-2 gap-2">
            {#each Object.keys(AFFLICTIONS_DATA) as aff}
                <button
                    onclick={() => characterActions.toggleAffliction(aff)}
                    class="p-3 rounded-lg border text-sm font-bold transition-all text-left flex justify-between items-center {$character.afflictions.includes(aff) ? 'bg-red-900/40 border-red-500 text-red-200 shadow-lg shadow-red-900/20' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-850'}"
                >
                    {$t(`character.afflictions.${aff}`)}
                    {#if $character.afflictions.includes(aff)}
                        <Check size={14} />
                    {/if}
                </button>
            {/each}
        </div>

        <div class="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <p class="text-[10px] text-slate-500 uppercase font-bold mb-2">{$t('character.modals.effects_summary')}</p>
            <div class="space-y-2">
                {#each $character.afflictions as aff}
                    <div class="text-xs">
                        <span class="text-red-400 font-bold">{$t(`character.afflictions.${aff}`)}:</span>
                        <span class="text-slate-400">{$t(`sofww.afflictions.${aff.toLowerCase().replace(' ', '_')}.effect`)}</span>
                    </div>
                {/each}
                {#if $character.afflictions.length === 0}
                    <p class="text-xs text-slate-600 italic text-center">{$t('character.modals.no_affliction_selected')}</p>
                {/if}
            </div>
        </div>
    </div>
</Modal>
