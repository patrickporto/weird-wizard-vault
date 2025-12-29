<script>
  import { character, modalState, damage, effectiveMaxHealth, tempHealth, isInjured, isIncapacitated, damagePercentage, rollHistory, isHistoryOpen } from '$lib/stores/characterStore';
  import { Settings, Moon, Dices, ChevronLeft, LayoutDashboard } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  function openModal(type) {
    modalState.update(m => ({ ...m, type: type, isOpen: true }));
  }
</script>

<header class="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 shadow-2xl">
    <div class="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
       <div class="flex items-center justify-between gap-2 sm:gap-4">
          
          <!-- Lado Esquerdo: Voltar e Perfil Rapido -->
          <div class="flex items-center gap-1 sm:gap-3">
             <button 
                on:click={() => goto('/')} 
                class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all flex items-center gap-1 group"
                aria-label="Voltar para Dashboard"
                title="Voltar para Dashboard"
             >
                <ChevronLeft size={20} class="group-hover:-translate-x-0.5 transition-transform"/>
                <LayoutDashboard size={18} class="hidden sm:block opacity-50"/>
             </button>

             <button 
                class="flex items-center gap-2 group text-left" 
                on:click={() => openModal('character_info')}
                aria-label="Informações do Personagem"
             >
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-full border border-white/10 flex items-center justify-center text-sm sm:text-lg font-black shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    {$character.name.charAt(0)}
                </div>
                <div class="hidden xs:block">
                   <div class="flex items-center gap-1">
                       <h1 class="text-xs sm:text-sm font-bold text-white leading-tight truncate max-w-[80px] sm:max-w-none group-hover:text-indigo-400 transition-colors">{$character.name}</h1>
                   </div>
                   <p class="text-[10px] text-slate-500 font-medium">Nv {$character.level}</p>
                </div>
             </button>
          </div>

          <!-- Centro: Vida (Mais compacto no mobile) -->
          <button 
            class="flex-1 max-w-md cursor-pointer group px-2 sm:px-0 text-left" 
            on:click={() => openModal('health')}
            aria-label="Estado de Saúde"
          >
             <div class="flex justify-between text-[10px] sm:text-xs mb-1 px-1">
                <span class="font-black uppercase tracking-wider {$isIncapacitated ? 'text-red-500 animate-pulse' : $isInjured ? 'text-yellow-500' : 'text-green-500'}">
                   {$isIncapacitated ? "Morto" : $isInjured ? "Ferido" : "Ok"}
                </span>
                <span class="text-slate-400 font-mono flex items-center gap-1 group-hover:text-white transition-colors">
                  <span class="text-red-400 font-bold group-hover:text-red-300">{$damage}</span><span class="opacity-30">/</span><span class="text-white font-bold">{$effectiveMaxHealth}</span>
                </span>
             </div>
             <div class="h-2 sm:h-3 w-full bg-slate-950 rounded-full border border-white/5 relative overflow-hidden group-hover:border-white/20 transition-colors">
                <div class="absolute top-0 left-0 h-full w-full bg-green-900/10"></div>
                <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-700 ease-out z-10" style="width: {$damagePercentage}%"></div>
                {#if $tempHealth > 0}<div class="absolute top-0 left-0 w-full h-full z-20 bg-cyan-400/20 pointer-events-none animate-pulse"></div>{/if}
             </div>
          </button>

          <!-- Lado Direito: Ações -->
          <div class="flex items-center gap-1 sm:gap-2">
             <button 
                on:click={() => openModal('rest_confirm')} 
                class="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-full transition-all" 
                title="Descanso"
             >
                <Moon size={18}/>
             </button>
             
             <button 
                on:click={() => isHistoryOpen.update(v => !v)} 
                class="p-2 bg-indigo-600/10 text-indigo-400 border border-indigo-400/20 rounded-lg hover:bg-indigo-600 hover:text-white transition-all relative" 
                title="Histórico"
             >
                 <Dices size={18}/>
                 {#if $rollHistory.length > 0}
                    <span class="absolute -top-1 -right-1 flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-slate-900"></span>
                    </span>
                 {/if}
             </button>

             <button 
                on:click={() => openModal('character_info')} 
                class="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
             >
                <Settings size={18}/>
             </button>
          </div>
       </div>
    </div>
  </header>

<style>
    /* Suporte para telas muito pequenas */
    @media (max-width: 350px) {
        .xs\:block {
            display: none !important;
        }
    }
</style>

