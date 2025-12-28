<script>
  import { character, modalState, damage, effectiveMaxHealth, tempHealth, isInjured, isIncapacitated, damagePercentage, rollHistory, characterActions } from '$lib/stores/characterStore';
  import { Settings, Moon, Dices, X } from 'lucide-svelte';

  function openModal(type) {
    modalState.update(m => ({ ...m, type: type, isOpen: true }));
  }

  export let isHistoryOpen = false;
</script>

<header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
    <div class="max-w-6xl mx-auto px-4 py-3">
       <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3 group relative">
             <div class="w-12 h-12 bg-indigo-600 rounded-full border border-slate-500 flex items-center justify-center text-xl font-bold">{$character.name.charAt(0)}</div>
             <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-lg font-bold text-white leading-none">{$character.name}</h1>
                    <button on:click={() => openModal('character_info')} class="text-slate-500 hover:text-white transition-colors"><Settings size={14}/></button>
                </div>
                <p class="text-slate-400 text-xs">Lvl {$character.level} • {$character.paths.novice} {$character.paths.expert ? `• ${$character.paths.expert}` : ''}</p>
             </div>
          </div>

          <!-- Health Bar -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div class="flex-1 w-full md:max-w-md cursor-pointer group" on:click={() => openModal('health')} role="button" tabindex="0">
             <div class="flex justify-between text-xs mb-1 px-1">
                <span class="font-bold uppercase {$isIncapacitated ? 'text-red-500 animate-pulse' : $isInjured ? 'text-yellow-500' : 'text-green-500'}">
                   {$isIncapacitated ? "Incapacitado" : $isInjured ? "Ferido" : $tempHealth > 0 ? "Vigoroso" : "Saudável"}
                </span>
                <span class="text-slate-400 font-mono flex items-center gap-1">
                  <span class="text-red-400">{$damage} Dano</span> / <span class="text-white">{$effectiveMaxHealth} Vida</span>
                  {#if $tempHealth > 0}<span class="text-[10px] text-cyan-400">(+{$tempHealth} Temp)</span>{/if}
                </span>
             </div>
             <div class="h-4 w-full bg-slate-950 rounded border border-slate-700 relative overflow-hidden {$tempHealth > 0 ? 'shadow-[0_0_8px_rgba(34,211,238,0.3)] border-cyan-500/30' : ''}">
                <div class="absolute top-0 left-0 h-full w-full bg-green-900/30"></div>
                <div class="absolute top-0 left-0 h-full bg-red-600 transition-all duration-500 z-10" style="width: {$damagePercentage}%"></div>
                {#if $tempHealth > 0}<div class="absolute top-0 left-0 w-full h-full z-20 bg-cyan-400/10 pointer-events-none animate-pulse"></div>{/if}
             </div>
          </div>

          <div class="flex gap-2">
             <button on:click={() => openModal('rest_confirm')} class="p-2 bg-slate-800 rounded hover:bg-indigo-900/50 text-indigo-300 transition-colors" title="Descanso"><Moon size={18}/></button>
             <button on:click={() => isHistoryOpen = !isHistoryOpen} class="p-2 bg-slate-800 rounded hover:bg-indigo-900/50 text-indigo-300 transition-colors relative" title="Histórico">
                 <Dices size={18}/>
                 {#if $rollHistory.length > 0}<span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>{/if}
             </button>
          </div>
       </div>
    </div>
  </header>
