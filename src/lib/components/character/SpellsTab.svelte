<script>
    import { character, modalState } from '$lib/stores/characterStore';
    import { Plus, Edit } from 'lucide-svelte';

    function openModal(type, data = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }
</script>

<div class="space-y-6">
    <div class="flex justify-between items-center"><h3 class="text-xs font-bold text-slate-500 uppercase">Grimório</h3><button on:click={() => openModal('spell')} class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold flex items-center gap-1"><Plus size={14} /> Add</button></div>
    {#each ['Novice', 'Expert', 'Master'] as tier}
        {#if $character.spells.some(s => s.tier === tier)}
            <div>
                <h4 class="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2">{tier} Spells</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {#each $character.spells.filter(s => s.tier === tier) as spell}
                        <div class="p-4 bg-slate-950 rounded-lg border border-slate-800 group hover:border-slate-600">
                            <div class="flex justify-between mb-2"><div class="font-bold text-white">{spell.name} <span class="text-[10px] text-slate-500 font-normal ml-1">({spell.tradition} • {spell.tier})</span></div><button on:click={() => openModal('spell', spell)} class="text-slate-600 hover:text-white"><Edit size={12}/></button></div>
                            <div class="text-xs text-slate-400 mb-3 line-clamp-2">{spell.description}</div>
                            <div class="flex items-center justify-between bg-slate-900 p-2 rounded"><span class="text-[10px] font-bold text-slate-500 uppercase">Castings</span><div class="flex items-center gap-2"><span class="text-sm font-mono font-bold {spell.castings === 0 ? 'text-red-500' : 'text-white'}">{spell.castings}/{spell.maxCastings}</span><button on:click={() => openModal('confirm_spell', spell)} disabled={spell.castings === 0} class="bg-indigo-600 disabled:opacity-50 text-white text-[10px] px-2 py-1 rounded">CAST</button></div></div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/each}
 </div>
