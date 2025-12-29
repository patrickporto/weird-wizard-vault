<script lang="ts">
    import { character, modalState, totalDefense, effectiveSpeed } from '$lib/stores/characterStore';
    import { Shield, Zap, Sword, Minus, Plus } from 'lucide-svelte';

    function openModal(type: string, data: any) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }

    function decreaseBonusDamage() {
        character.update(c => ({...c, bonusDamage: Math.max(0, (c.bonusDamage || 0) - 1)}));
    }

    function increaseBonusDamage() {
        character.update(c => ({...c, bonusDamage: (c.bonusDamage || 0) + 1}));
    }
</script>

<div class="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-3">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        onclick={() => openModal('stat', 'defense')} 
        class="flex justify-between items-center border-b border-slate-800 pb-2 cursor-pointer hover:bg-slate-800/50 rounded px-1 -mx-1 transition-colors"
        role="button"
        tabindex="0"
    >
       <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Shield size={14}/> Defesa</span>
       <span class="text-xl font-bold text-white cursor-help border-b border-dotted border-slate-600" title={`Natural + Armadura + Escudos + Efeitos`}>{$totalDefense}</span>
    </div>

    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        onclick={() => openModal('stat', 'speed')} 
        class="flex justify-between items-center border-b border-slate-800 pb-2 cursor-pointer hover:bg-slate-800/50 rounded px-1 -mx-1 transition-colors"
        role="button"
        tabindex="0"
    >
       <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Zap size={14}/> Speed</span>
       <div class="flex flex-col items-end">
          <span class="text-xl font-bold {$effectiveSpeed < $character.speed ? 'text-red-400' : 'text-white'}">{$effectiveSpeed}</span>
          {#if $effectiveSpeed < $character.speed}<span class="text-[10px] text-red-500 leading-none">Reduzido</span>{/if}
       </div>
    </div>

    <div class="flex justify-between items-center">
       <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Sword size={14}/> Bonus Dmg</span>
       <div class="flex items-center gap-2">
          <button onclick={decreaseBonusDamage} class="text-slate-500 hover:text-white" aria-label="Diminuir Dano Bônus"><Minus size={12}/></button>
          <span class="text-lg font-bold text-white font-mono">{$character.bonusDamage || 0}d6</span>
          <button onclick={increaseBonusDamage} class="text-slate-500 hover:text-white" aria-label="Aumentar Dano Bônus"><Plus size={12}/></button>
       </div>
    </div>
 </div>
