<script lang="ts">
  import { t } from 'svelte-i18n';
  import { rollHistory, characterActions, appSettings } from '$lib/stores/characterStore';
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

<aside
  class="h-full bg-slate-900/95 backdrop-blur-xl border-l border-white/10 transition-all duration-500 ease-out shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col fixed top-0 right-0 z-[100] w-full sm:w-96 {isOpen ? 'translate-x-0' : 'translate-x-full'}"
>
<div class="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
  <div class="flex items-center gap-3">
    <div class="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
        <History size={20} class="text-indigo-400"/>
    </div>
    <div>
        <h3 class="font-black text-white uppercase tracking-widest text-sm">{$t('character.history.title')}</h3>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{$rollHistory.length} {$t('character.history.rolls_count')}</p>
    </div>
  </div>
  <button onclick={onClose} class="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all active:scale-90">
    <X size={24}/>
  </button>
</div>
<div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
  {#if $rollHistory.length === 0}
    <div class="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
        <div class="w-16 h-16 border-2 border-dashed border-slate-800 rounded-full flex items-center justify-center mb-4">
            <History size={32}/>
        </div>
        <p class="text-sm font-bold uppercase tracking-widest italic">{$t('character.history.none')}</p>
    </div>
  {/if}
  {#each $rollHistory as roll (roll.id)}
    {@const sourceKey = roll.source?.toLowerCase()}
    <div class="relative bg-slate-800/40 hover:bg-slate-800/60 transition-colors rounded-2xl border border-white/5 p-4 shadow-xl overflow-hidden group animate-in slide-in-from-right-8 duration-300">
        <!-- Accent border based on source -->
        <div class="absolute left-0 top-0 bottom-0 w-1 {roll.source === 'GM' ? 'bg-indigo-500' : 'bg-emerald-500'}"></div>

        <div class="flex justify-between items-start mb-3">
           <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span class="text-[10px] px-1.5 py-0.5 rounded {roll.source === 'GM' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'} uppercase font-black tracking-widest leading-none border border-current opacity-70">
                    {$t(`character.history.source.${sourceKey}`, { default: roll.source })}
                </span>
                {#if roll.charName && roll.charName !== roll.source}
                  <span class="text-[10px] text-white/50 font-black uppercase tracking-tighter">{roll.charName}</span>
                {/if}
              </div>
           </div>
           <span class="text-[9px] text-slate-500 font-black tracking-widest uppercase">{new Date(roll.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
        </div>

        <div class="flex items-center gap-3 mb-2">
            <div class="flex-1">
                <div class="font-black text-white text-sm uppercase tracking-tight leading-snug">{roll.name}</div>
                {#if roll.description}
                    <div class="text-[10px] text-slate-400 font-medium italic mt-1 leading-relaxed opacity-80 whitespace-pre-wrap">{roll.description}</div>
                {/if}
            </div>
        </div>

        {#if roll.effectsApplied?.length > 0}
            <div class="flex flex-wrap gap-1 mb-3">
                {#each roll.effectsApplied as eff}
                    <span class="text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">{eff}</span>
                {/each}
            </div>
        {/if}

        {#if roll.formula || roll.total !== undefined}
            <div class="relative bg-black/40 rounded-xl p-3 flex justify-between items-center border border-white/5 group-hover:border-white/10 transition-colors overflow-hidden">
                <!-- Background visual hint -->
                {#if roll.crit}
                    <div class="absolute inset-0 bg-yellow-400/5 animate-pulse"></div>
                {/if}

                <div class="flex flex-col">
                    <span class="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">{$t('character.history.formula')}</span>
                    <div class="text-xs font-mono text-indigo-300 font-bold">{roll.formula || $t('character.history.fixed')}</div>
                </div>

                <div class="flex flex-col items-end">
                    <span class="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">{$t('character.history.total')}</span>
                    <div class="text-3xl font-black font-mono leading-none flex items-baseline gap-1 {roll.crit ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'text-white'}">
                        {roll.total}
                        {#if roll.crit}
                            <span class="text-[10px] animate-bounce">✨</span>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
  {/each}
</div>
<div class="p-6 border-t border-white/5 bg-slate-950/80">
   <button
    onclick={characterActions.clearHistory}
    class="w-full py-3 text-xs font-black uppercase tracking-[0.2em] text-red-400/70 hover:text-red-400 border border-red-900/30 rounded-xl hover:bg-red-900/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
   >
    <Trash2 size={16}/> {$t('character.history.clear')}
   </button>
</div>
</aside>
