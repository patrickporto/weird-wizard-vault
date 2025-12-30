<script lang="ts">
  import { t } from 'svelte-i18n';
  import { rollHistory, characterActions } from '$lib/stores/characterStore';
  import { History, X, Trash2 } from 'lucide-svelte';
  
  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen = false, onClose }: Props = $props();
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 bg-black/50 z-[90] lg:hidden backdrop-blur-sm" onclick={onClose} role="button" aria-label={$t('character.history.close')} tabindex="-1"></div>
{/if}

<aside class="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 z-[100] transition-transform duration-300 shadow-2xl flex flex-col {isOpen ? 'translate-x-0' : 'translate-x-full'}">
<div class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
  <h3 class="font-bold text-white flex items-center gap-2"><History size={18}/> {$t('character.history.title')}</h3>
  <button onclick={onClose} class="text-slate-400 hover:text-white"><X size={20}/></button>
</div>
<div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
  {#if $rollHistory.length === 0}
    <div class="text-center text-slate-500 text-sm mt-10 italic">{$t('character.history.none')}</div>
  {/if}
  {#each $rollHistory as roll (roll.id)}
    <div class="bg-slate-800 rounded-lg border border-slate-700 p-3 shadow-sm animate-in slide-in-from-right-4">
        <div class="flex justify-between items-start mb-1">
           <div class="flex flex-col">
              <span class="text-[10px] text-slate-400 uppercase font-black tracking-tight">{roll.source}</span>
              {#if roll.charName && roll.charName !== roll.source}
                  <span class="text-[10px] text-indigo-400 font-bold -mt-0.5">{roll.charName}</span>
              {/if}
           </div>
           <span class="text-[10px] text-slate-500 font-mono">{new Date(roll.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
        </div>
       <div class="font-bold text-white mb-1">{roll.name}</div>
       {#if roll.description}<div class="text-xs text-slate-400 italic mb-2 whitespace-pre-wrap">{roll.description}</div>{/if}
       {#if roll.effectsApplied?.length > 0}
           <div class="flex flex-wrap gap-1 mb-2">
               {#each roll.effectsApplied as eff}
                   <span class="text-[9px] bg-indigo-900/50 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-800/50">{eff}</span>
               {/each}
           </div>
       {/if}
       {#if roll.formula || roll.total !== undefined}
           <div class="bg-slate-900 rounded p-2 flex justify-between items-center">
              <div class="text-xs font-mono text-slate-400">{roll.formula}</div>
              <div class="text-xl font-bold font-mono {roll.crit ? 'text-yellow-400' : 'text-white'}">{roll.total}</div>
           </div>
       {/if}
    </div>
  {/each}
</div>
<div class="p-4 border-t border-slate-700 bg-slate-950">
   <button onclick={characterActions.clearHistory} class="w-full py-2 text-xs font-bold text-red-400 hover:text-red-300 border border-red-900/50 rounded hover:bg-red-900/20 flex items-center justify-center gap-2"><Trash2 size={14}/> {$t('character.history.clear')}</button>
</div>
</aside>
