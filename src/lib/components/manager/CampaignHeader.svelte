<script lang="ts">
  import { ChevronLeft, LayoutDashboard, History, Sword, Library, Settings, Wifi, WifiOff, Users, Loader2, AlertCircle } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { isHistoryOpen, hasUnreadRolls, rollHistory } from '$lib/stores/characterStore';
  import { syncState, reconnectCampaign } from '$lib/logic/sync';
  import { t } from 'svelte-i18n';

  interface Props {
    campaignName?: string;
    gmName?: string;
    activeSubTab?: string;
    onTabChange?: (tab: string) => void;
    onOpenSettings?: () => void;
  }

  let {
    campaignName = "",
    gmName = "Mestre",
    activeSubTab = "session",
    onTabChange = () => {},
    onOpenSettings = () => {}
  }: Props = $props();
</script>

<header class="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 shadow-2xl">
    <div class="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-3">
       <div class="flex items-center justify-between gap-2 sm:gap-4">

          <!-- Lado Esquerdo: Voltar e Título -->
          <div class="flex items-center gap-1 sm:gap-3 shrink-0">
             <button
                onclick={() => goto(resolve('/'))}
                class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all flex items-center gap-1 group"
                aria-label={$t('character.header.back_dashboard')}
                title={$t('character.header.back_dashboard')}
             >
                <ChevronLeft size={20} class="group-hover:-translate-x-0.5 transition-transform"/>
                <LayoutDashboard size={18} class="hidden sm:block opacity-50"/>
             </button>

              <div class="flex flex-col">
                <h1 class="text-base sm:text-lg font-black text-white leading-tight truncate max-w-[140px] sm:max-w-none">
                    {campaignName}
                </h1>
                <span class="text-xs text-indigo-400 font-mono font-black uppercase tracking-wider">{gmName}</span>
             </div>
          </div>

          <!-- Centro: Navegação de Sub-tabs -->
          <div class="hidden md:flex bg-slate-950/50 p-1 rounded-xl border border-white/5">
             <button
                onclick={() => onTabChange('session')}
                class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all {activeSubTab === 'session' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}"
                aria-pressed={activeSubTab === 'session'}
             >
                <Sword size={14} class={activeSubTab === 'session' ? 'opacity-100' : 'opacity-50'}/>
                <span class="hidden min-[400px]:block">{$t('common.labels.session')}</span>
             </button>
             <button
                onclick={() => onTabChange('bestiary')}
                class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all {activeSubTab === 'bestiary' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}"
                aria-pressed={activeSubTab === 'bestiary'}
             >
                <Library size={14} class={activeSubTab === 'bestiary' ? 'opacity-100' : 'opacity-50'}/>
                <span class="hidden min-[400px]:block">{$t('common.labels.bestiary')}</span>
             </button>
          </div>

          <!-- Lado Direito: Ações -->
          <div class="flex items-center gap-1 sm:gap-2">
             <div class="flex items-center gap-2 mr-2 border-r border-white/10 pr-2">
                {#if $syncState.connectionStatus === 'connected'}
                    <button
                        class="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        title={$t('common.status.connected')}
                        onclick={reconnectCampaign}
                    >
                        <Wifi size={16} />
                        <span class="text-xs font-bold hidden sm:block">{$t('common.status.connected')}</span>
                    </button>
                    {#if $syncState.peers.length > 0}
                         <div class="flex items-center gap-1 text-slate-400 ml-1" title={$t('common.status.peers', { values: { count: $syncState.peers.length } })}>
                            <Users size={14} />
                            <span class="text-xs">{$syncState.peers.length}</span>
                        </div>
                    {/if}
                {:else if $syncState.connectionStatus === 'connecting' || $syncState.connectionStatus === 'reconnecting'}
                     <div class="flex items-center gap-1 text-yellow-400 animate-pulse" title={$t('common.status.' + $syncState.connectionStatus)}>
                        <Loader2 size={16} class="animate-spin" />
                        <span class="text-xs font-bold hidden sm:block">
                            {$t('common.status.' + $syncState.connectionStatus)}
                        </span>
                    </div>
                {:else if $syncState.connectionStatus === 'error'}
                     <button
                        onclick={reconnectCampaign}
                        class="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer animate-pulse"
                        title={$t('common.status.error')}
                    >
                        <AlertCircle size={16} />
                        <span class="text-xs font-bold hidden sm:block">{$t('common.status.error')}</span>
                    </button>
                {:else}
                    <button
                        onclick={reconnectCampaign}
                        class="flex items-center gap-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        title={$t('common.status.offline')}
                    >
                        <WifiOff size={16} />
                        <span class="text-xs hidden sm:block">{$t('common.status.offline')}</span>
                    </button>
                {/if}
             </div>

             <button
                onclick={onOpenSettings}
                class="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                aria-label={$t('common.buttons.settings')}
                title={$t('common.buttons.settings')}
             >
                 <Settings size={20}/>
             </button>

             <button
                onclick={() => isHistoryOpen.update(v => !v)}
                class="p-2 sm:p-2.5 bg-indigo-600/10 text-indigo-400 border border-indigo-400/20 rounded-lg hover:bg-indigo-600 hover:text-white transition-all relative"
                aria-label={$t('character.header.history')}
                title={$t('character.header.history')}
                aria-pressed={$isHistoryOpen}
             >
                 <History size={20}/>
                 {#if $hasUnreadRolls}
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
