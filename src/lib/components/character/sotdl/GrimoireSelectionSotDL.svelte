<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Wand2 } from 'lucide-svelte';
    import { modalState } from '$lib/stores/characterStore';
    import { sotdlCharacter, sotdlCharacterActions } from '$lib/stores/characterStoreSotDL';
    import { getSotDLCastings } from '$lib/constants';
    import Modal from '$lib/components/common/Modal.svelte';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'cast_spell' && $modalState.system === 'sofdl');
    let power = $derived($sotdlCharacter.power);
    let spells = $derived($sotdlCharacter.spells);

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function getRemainingCastings(rank: number): number {
        const maxCastings = getSotDLCastings(power, rank);
        const usedCastings = spells.filter(s => s.rank === rank).reduce((sum, s) => sum + (s.castingsUsed || 0), 0);
        return Math.max(0, maxCastings - usedCastings);
    }

    function selectSpell(spell: any) {
        const remaining = getRemainingCastings(spell.rank);
        if (remaining <= 0) return;
        // Cast the spell immediately
        sotdlCharacterActions.castSpell(spell.id);
        onClose();
    }
</script>

<Modal {isOpen} title={$t('character.modals.grimoire')} {onClose}>
    <div class="space-y-3 p-1">
        {#each spells as spell}
            {@const remaining = getRemainingCastings(spell.rank)}
            {@const maxCast = getSotDLCastings(power, spell.rank)}
            <button
                onclick={() => selectSpell(spell)}
                class="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-purple-500/50 transition-all flex justify-between items-center group {remaining <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}"
            >
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-black uppercase">R{spell.rank}</span>
                        <h4 class="font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">{spell.name}</h4>
                    </div>
                    <p class="text-xs text-slate-500 italic uppercase font-bold tracking-widest">{spell.tradition}</p>
                </div>

                <div class="text-right shrink-0">
                    <span class="block text-[10px] text-slate-500 uppercase font-bold text-center mb-1">{$t('character.modals.casts')}</span>
                    <div class="flex gap-0.5">
                        {#each Array(maxCast) as _, i}
                            <div class="w-3 h-1 rounded-full {i < remaining ? 'bg-purple-500' : 'bg-slate-700'}"></div>
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
