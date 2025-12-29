<script>
    import { character, modalState, characterActions } from '$lib/stores/characterStore';
    import { Rewind, FastForward, Eraser, Plus, Edit, Trash2, Clock, Clover } from 'lucide-svelte';
    import { MOD_TYPES, MOD_TARGETS, DURATION_TYPES } from '../../../routes/sofww';

    const { advanceRound, deleteEffect, checkLuckEnds } = characterActions;

    function openModal(type, data = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div class="flex items-center gap-4">
            <button on:click={() => advanceRound('prev')} class="p-2 hover:bg-slate-700 rounded text-slate-400"><Rewind size={20}/></button>
            <div class="text-center">
                <div class="text-[10px] text-slate-500 font-bold uppercase">Rodada Atual</div>
                <div class="text-2xl font-mono font-bold text-white">{$character.currentRound || 1}</div>
            </div>
            <button on:click={() => advanceRound('next')} class="p-2 hover:bg-slate-700 rounded text-white"><FastForward size={20}/></button>
        </div>
        <div class="flex gap-2">
            <button on:click={characterActions.cleanInactiveEffects} class="bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 border border-slate-700"><Eraser size={14}/> Limpar Inativos</button>
            <button on:click={() => openModal('effect')} class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Plus size={14}/> Novo Efeito</button>
        </div>
    </div>
    <div class="space-y-2">
        {#if $character.effects.length === 0}<div class="text-center text-slate-500 italic py-4">Nenhum efeito ativo.</div>{/if}
        {#each $character.effects as eff}
            <div class="p-3 rounded border flex flex-col gap-2 transition-all {eff.isActive ? 'bg-slate-900 border-indigo-900' : 'bg-slate-950 border-slate-800 opacity-60'}">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2">
                        <button on:click={() => characterActions.toggleEffect(eff.id)} class="w-8 h-4 rounded-full relative transition-colors {eff.isActive ? 'bg-green-500' : 'bg-slate-600'}">
                            <div class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all {eff.isActive ? 'left-4.5' : 'left-0.5'}"></div>
                        </button>
                        <span class="font-bold text-white">{eff.name}</span>
                    </div>
                    <div class="flex gap-2">
                        <button on:click={() => openModal('effect', eff)} class="text-slate-500 hover:text-white"><Edit size={14}/></button>
                        <button on:click={() => deleteEffect(eff.id)} class="text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                    </div>
                </div>
                <div class="text-xs text-slate-400">{eff.description}</div>
                {#if eff.isActive && Array.isArray(eff.modifiers)}
                    <div class="flex flex-wrap gap-1 mt-1">
                        {#each eff.modifiers as mod}
                            <span class="text-[9px] px-1 rounded border {mod.type === MOD_TYPES.SET ? 'bg-yellow-900/30 text-yellow-200 border-yellow-800' : 'bg-slate-800 text-slate-300 border-slate-700'}">
                                {MOD_TARGETS[mod.target] || mod.target}: {mod.type === MOD_TYPES.SET ? '=' : mod.type === MOD_TYPES.MULT ? 'x' : (mod.value > 0 ? '+' : '')}{mod.value}
                            </span>
                        {/each}
                    </div>
                {/if}
                <div class="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 border-t border-slate-800 pt-2">
                    <span class="flex items-center gap-1"><Clock size={10}/> {DURATION_TYPES[eff.duration]} {eff.duration === 'ROUNDS' ? `(${eff.roundsLeft})` : ''}</span>
                    {#if eff.duration === 'LUCK_ENDS' && eff.isActive}
                        <button on:click={() => checkLuckEnds(eff.id)} class="bg-yellow-900/40 hover:bg-yellow-800/40 text-yellow-500 border border-yellow-800 px-2 py-0.5 rounded flex items-center gap-1"><Clover size={10}/> Sorte Encerra</button>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
 </div>
