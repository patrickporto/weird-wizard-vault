<script lang="ts">
    import { character, modalState, derivedStats } from '$lib/stores/characterStore';
    import { Edit } from 'lucide-svelte';

    function openModal(type: string, data: any) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }

    function handleAttributeClick(attr: any) {
        openModal('pre_roll', { type: 'attribute', source: attr });
    }

    function handleEditClick(e: MouseEvent, attr: any) {
        e.stopPropagation();
        openModal('attribute', attr);
    }
</script>

<div class="grid grid-cols-2 gap-3">
    {#each $character.attributes as attr}
       <!-- svelte-ignore a11y_click_events_have_key_events -->
       <div 
           onclick={() => handleAttributeClick(attr)} 
           class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 text-center transition-all hover:bg-slate-800 active:scale-[0.98] group relative shadow-lg shadow-black/20 cursor-pointer"
           role="button"
           tabindex="0"
           aria-label={`Rolar teste de ${attr.name}`}
       >
          <div class="py-2.5 px-2">
            <div class="text-[9px] uppercase text-slate-500 font-black tracking-widest group-hover:text-indigo-400 transition-colors mb-1">{attr.name}</div>
            
            <div class="flex items-center justify-center gap-1.5 mb-1.5">
                <div class="text-2xl font-black text-white leading-none">
                    {$derivedStats[attr.key]}
                </div>
                {#if $derivedStats[attr.key] !== attr.value}
                    <div class="text-[11px] font-bold {$derivedStats[attr.key] > attr.value ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                        {$derivedStats[attr.key] > attr.value ? '+' : ''}{$derivedStats[attr.key] - attr.value}
                    </div>
                {/if}
            </div>

            <div class="inline-flex px-2 py-0.5 bg-indigo-500/10 rounded-lg">
                <div class="text-xs text-indigo-400 font-black tracking-tight">+{ $derivedStats[attr.key] - 10}</div>
            </div>
          </div>

          <button 
              onclick={(e) => handleEditClick(e, attr)} 
              class="absolute top-1.5 right-1.5 p-1 text-slate-700 hover:text-white hover:bg-white/5 rounded-md transition-all"
              aria-label="Editar {attr.name}"
          >
              <Edit size={12} />
          </button>
       </div>
    {/each}
 </div>
