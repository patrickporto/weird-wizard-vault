<script lang="ts">
    import { character, modalState, characterActions } from '$lib/stores/characterStore';
    import { Activity, Plus, X } from 'lucide-svelte';

    const { toggleAffliction } = characterActions;

    function openModal() {
        modalState.update(m => ({ ...m, type: 'affliction', isOpen: true }));
    }

    function handleRemove(e: MouseEvent, aff: string) {
        e.stopPropagation();
        toggleAffliction(aff);
    }
</script>

<div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
    <div class="flex justify-between items-center mb-2">
       <h4 class="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
           <Activity size={12}/> Aflições
       </h4>
       <button 
           onclick={openModal} 
           class="text-slate-500 hover:text-white"
           aria-label="Adicionar Aflição"
       >
           <Plus size={14}/>
       </button>
    </div>
    <div class="flex flex-wrap gap-2">
       {#if $character.afflictions.length === 0}
           <span class="text-xs text-slate-500 italic">Nenhuma aflição ativa.</span>
       {/if}
       {#each $character.afflictions as aff}
           <div class="group relative">
                <div class="text-xs bg-red-900/30 border border-red-700 text-red-200 px-2 py-1 rounded flex items-center gap-1 cursor-help" title="Aflição Ativa">
                   {aff}
                   <button 
                       onclick={(e) => handleRemove(e, aff)} 
                       class="ml-1 text-red-400 hover:text-white"
                       aria-label="Remover aflição {aff}"
                   >
                       <X size={10}/>
                   </button>
                </div>
           </div>
       {/each}
    </div>
 </div>
