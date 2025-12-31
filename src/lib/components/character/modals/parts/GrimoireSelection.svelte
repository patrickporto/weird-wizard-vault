<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Wand2 } from 'lucide-svelte';
    import { character, modalState } from '$lib/stores/characterStore';
    import Modal from '$lib/components/common/Modal.svelte';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'cast_spell' && ($modalState as any).system !== 'sofdl');

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function selectSpell(spell: any) {
        if (spell.castings <= 0) return;
        modalState.update(m => ({ ...m, type: 'confirm_spell', data: spell }));
    }
</script>

<Modal {isOpen} title={$t('character.modals.grimoire')} {onClose}>
    <div class="space-y-3 p-1">
        {#each $character.spells as spell}
            <button
                onclick={() => selectSpell(spell)}
                class="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-indigo-500/50 transition-all flex justify-between items-center group {spell.castings <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}"
            >
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-black uppercase">{spell.tier}</span>
                        <h4 class="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{spell.name}</h4>
                    </div>
                    <p class="text-xs text-slate-500 italic uppercase font-bold tracking-widest">{spell.tradition}</p>
                </div>

                <div class="text-right shrink-0">
                    <span class="block text-[10px] text-slate-500 uppercase font-bold text-center mb-1">{$t('character.modals.casts')}</span>
                    <div class="flex gap-0.5">
                        {#each Array(spell.maxCastings) as _, i}
                            <div class="w-3 h-1 rounded-full {i < spell.castings ? 'bg-indigo-500' : 'bg-slate-700'}"></div>
                        {/each}
                    </div>
                </div>
            </button>
        {:else}
            <div class="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                <Wand2 size={32} class="mx-auto text-slate-700 mb-2 opacity-20" />
                <p class="text-slate-500 italic text-sm">{$t('character.modals.grimoire_empty')}</p>
            </div>
        {/each}
    </div>
</Modal>
