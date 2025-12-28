<script>
    import { character, modalState, characterActions } from '$lib/stores/characterStore';
    import { Plus, Edit, Zap, Infinity as InfinityIcon, Minus } from 'lucide-svelte';

    const { recoverTalent } = characterActions;

    function openModal(type, data = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center mb-4"><h3 class="text-xs font-bold text-slate-500 uppercase">Talentos & Habilidades</h3><button on:click={() => openModal('talent')} class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold flex items-center gap-1"><Plus size={14} /> Add</button></div>
    <div class="grid grid-cols-1 gap-3">
        {#each $character.talents as talent}
            <div class="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center gap-4 group hover:border-slate-600 transition-colors">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1"><h4 class="font-bold text-white flex items-center gap-2"><Zap size={14} class="text-yellow-500" /> {talent.name}</h4><button on:click={() => openModal('talent', talent)} class="text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={12}/></button></div>
                    <p class="text-sm text-slate-400">{talent.description}</p>
                </div>
                <div class="shrink-0 flex items-center gap-3 bg-slate-900 p-2 rounded border border-slate-800">
                   <div class="text-center">
                      {#if talent.isPassive}
                          <span class="block text-[10px] text-slate-500 uppercase font-bold">Tipo</span>
                          <span class="font-bold text-white text-xs flex items-center justify-center gap-1"><InfinityIcon size={12}/> Passivo</span>
                      {:else}
                          <span class="block text-[10px] text-slate-500 uppercase font-bold">Usos</span>
                          <span class="font-mono font-bold {talent.uses === 0 ? 'text-red-500' : 'text-white'}">{talent.uses}/{talent.maxUses}</span>
                      {/if}
                   </div>
                   {#if !talent.isPassive}
                       <div class="flex flex-col gap-1"><button on:click={() => recoverTalent(talent.id)} disabled={talent.uses >= talent.maxUses} class="bg-slate-700 disabled:opacity-30 hover:bg-slate-600 text-green-400 p-1 rounded h-6 w-6 flex items-center justify-center"><Plus size={12} /></button><button on:click={() => openModal('confirm_talent', talent)} disabled={talent.uses === 0} class="bg-slate-700 disabled:opacity-30 hover:bg-slate-600 text-white p-1 rounded h-6 w-6 flex items-center justify-center"><Minus size={12} /></button></div>
                   {/if}
                </div>
            </div>
        {/each}
    </div>
 </div>
