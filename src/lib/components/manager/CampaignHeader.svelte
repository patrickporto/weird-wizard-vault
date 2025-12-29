<script lang="ts">
  import { ChevronLeft, LayoutDashboard, History, Sword, Library } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { isHistoryOpen } from '$lib/stores/characterStore';
  import { rollHistory } from '$lib/stores/characterStore';

  interface Props {
    campaignName?: string;
    activeSubTab?: string;
    onTabChange?: (tab: string) => void;
  }

  let { 
    campaignName = "", 
    activeSubTab = "session", 
    onTabChange = () => {} 
  }: Props = $props();
</script>

<header class="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 shadow-2xl">
    <div class="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
       <div class="flex items-center justify-between gap-2 sm:gap-4">
          
          <!-- Lado Esquerdo: Voltar e Título -->
          <div class="flex items-center gap-1 sm:gap-3 shrink-0">
             <button 
                onclick={() => goto('/')} 
                class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all flex items-center gap-1 group"
                aria-label="Voltar para Dashboard"
                title="Voltar para Dashboard"
             >
                <ChevronLeft size={20} class="group-hover:-translate-x-0.5 transition-transform"/>
                <LayoutDashboard size={18} class="hidden sm:block opacity-50"/>
             </button>

             <div class="flex flex-col">
                <h1 class="text-sm sm:text-base font-bold text-white leading-tight truncate max-w-[120px] sm:max-w-none">
                    {campaignName}
                </h1>
                <span class="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">Mestre</span>
             </div>
          </div>

          <!-- Centro: Navegação de Sub-tabs -->
          <div class="flex bg-slate-950/50 p-1 rounded-xl border border-white/5">
             <button 
                onclick={() => onTabChange('session')} 
                class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all {activeSubTab === 'session' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}"
                aria-pressed={activeSubTab === 'session'}
             >
                <Sword size={14} class={activeSubTab === 'session' ? 'opacity-100' : 'opacity-50'}/>
                <span class="hidden min-[400px]:block">Sessão</span>
             </button>
             <button 
                onclick={() => onTabChange('bestiary')} 
                class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all {activeSubTab === 'bestiary' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}"
                aria-pressed={activeSubTab === 'bestiary'}
             >
                <Library size={14} class={activeSubTab === 'bestiary' ? 'opacity-100' : 'opacity-50'}/>
                <span class="hidden min-[400px]:block">Bestiário</span>
             </button>
          </div>

          <!-- Lado Direito: Ações -->
          <div class="flex items-center gap-1 sm:gap-2">
             <button 
                onclick={() => isHistoryOpen.update(v => !v)} 
                class="p-2 bg-indigo-600/10 text-indigo-400 border border-indigo-400/20 rounded-lg hover:bg-indigo-600 hover:text-white transition-all relative" 
                aria-label="Toggle Histórico"
                title="Histórico"
                aria-pressed={$isHistoryOpen}
             >
                 <History size={18}/>
                 {#if $rollHistory && $rollHistory.length > 0}
                    <span class="absolute -top-1 -right-1 flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-slate-900"></span>
                    </span>
                 {/if}
             </button>
          </div>
       </div>
    </div>
</header>
