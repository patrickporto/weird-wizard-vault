<script>
    import { character, modalState, derivedStats } from '$lib/stores/characterStore';
    import { Edit } from 'lucide-svelte';

    function openModal(type, data) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }
</script>

<div class="grid grid-cols-2 gap-2">
    {#each $character.attributes as attr}
       <!-- svelte-ignore a11y-click-events-have-key-events -->
       <div on:click={() => openModal('pre_roll', {type:'attribute', source: attr})} class="bg-slate-900 p-2 rounded border border-slate-800 text-center cursor-pointer hover:bg-slate-800 transition-colors group relative">
          <span class="text-[10px] uppercase text-slate-500 font-bold group-hover:text-indigo-400 transition-colors">{attr.name}</span>
          <div class="text-xl font-bold text-white flex justify-center items-center gap-1">
              {$derivedStats[attr.key]}
              {#if $derivedStats[attr.key] !== attr.value}
                  <span class="text-[10px] ml-1 {$derivedStats[attr.key] > attr.value ? 'text-green-400' : 'text-red-400'}">
                      ({$derivedStats[attr.key] > attr.value ? '+' : ''}{$derivedStats[attr.key] - attr.value})
                  </span>
              {/if}
          </div>
          <div class="text-xs text-indigo-400 font-mono">+{ $derivedStats[attr.key] - 10}</div>
          <button on:click|stopPropagation={() => openModal('attribute', attr)} class="absolute top-1 right-1 text-slate-600 hover:text-white"><Edit size={10} /></button>
       </div>
    {/each}
 </div>
