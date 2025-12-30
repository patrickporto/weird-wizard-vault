<script lang="ts">
    import { t } from 'svelte-i18n';
    import { activeTab } from '$lib/stores/characterStore';
    import { Sword, Book, Backpack, Zap, Activity, FileText, User, MoreHorizontal, X } from 'lucide-svelte';
    import { slide, fade } from 'svelte/transition';

    // Desktop tabs (no stats - shown in sidebar)
    const desktopTabs = $derived([
        { id: 'acoes', label: $t('character.tabs.actions'), icon: Sword },
        { id: 'magias', label: $t('character.tabs.spells'), icon: Book },
        { id: 'talentos', label: $t('character.tabs.talents'), icon: Zap },
        { id: 'equipamento', label: $t('character.tabs.items'), icon: Backpack },
        { id: 'notas', label: $t('character.tabs.notes'), icon: FileText },
        { id: 'efeitos', label: $t('character.tabs.effects'), icon: Activity }
    ]);
    
    // Mobile main tabs (visible in bottom bar)
    const mobileTabs = $derived([
        { id: 'stats', label: $t('character.tabs.stats'), icon: User },
        { id: 'acoes', label: $t('character.tabs.actions'), icon: Sword },
        { id: 'notas', label: $t('character.tabs.notes'), icon: FileText },
        { id: 'equipamento', label: $t('character.tabs.items'), icon: Backpack }
    ]);

    // Mobile secondary tabs (hidden in "MAIS" menu)
    const moreMenuTabs = $derived([
        { id: 'magias', label: $t('character.tabs.spells'), icon: Book },
        { id: 'talentos', label: $t('character.tabs.talents'), icon: Zap },
        { id: 'efeitos', label: $t('character.tabs.effects'), icon: Activity }
    ]);

    let isMoreMenuOpen = $state(false);

    function selectTab(tabId: string) {
        activeTab.set(tabId);
        isMoreMenuOpen = false;
    }

    // Check if current tab is in the "more" menu
    let isMoreTabActive = $derived(moreMenuTabs.some(t => t.id === $activeTab));
</script>

<!-- More Menu Overlay -->
{#if isMoreMenuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        transition:fade={{ duration: 150 }}
        class="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        onclick={() => isMoreMenuOpen = false}
    ></div>
    
    <!-- Slide-up Drawer -->
    <div 
        transition:slide={{ duration: 200 }}
        class="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-slate-900 border-t border-slate-700 rounded-t-3xl shadow-2xl safe-area-pb"
    >
        <div class="flex justify-between items-center px-6 py-4 border-b border-slate-800">
            <h3 class="text-sm font-black text-white uppercase tracking-wider">{$t('character.tabs.more_options')}</h3>
            <button 
                onclick={() => isMoreMenuOpen = false}
                class="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
                <X size={18} />
            </button>
        </div>
        <div class="grid grid-cols-3 gap-2 p-4">
            {#each moreMenuTabs as tab}
                <button 
                    onclick={() => selectTab(tab.id)}
                    class="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95 {$activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}"
                >
                    <tab.icon size={24} />
                    <span class="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
                </button>
            {/each}
        </div>
    </div>
{/if}

<!-- Mobile Bottom Nav -->
<div class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-area-pb" role="tablist">
    <div class="flex justify-around items-center py-2">
        {#each mobileTabs as tab}
           <button 
               onclick={() => selectTab(tab.id)} 
               class="flex flex-col items-center gap-0.5 px-3 py-2 transition-all {$activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'}"
               role="tab"
               aria-selected={$activeTab === tab.id}
           >
               <tab.icon size={20} class="{$activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'}" />
               <span class="text-[9px] font-bold uppercase tracking-wide">{tab.label}</span>
           </button>
        {/each}
        
        <!-- More Button -->
        <button 
            onclick={() => isMoreMenuOpen = !isMoreMenuOpen}
            class="flex flex-col items-center gap-0.5 px-3 py-2 transition-all {isMoreTabActive || isMoreMenuOpen ? 'text-indigo-400' : 'text-slate-500'}"
            role="tab"
            aria-expanded={isMoreMenuOpen}
        >
            <MoreHorizontal size={20} class="{isMoreTabActive || isMoreMenuOpen ? 'text-indigo-400' : 'text-slate-500'}" />
            <span class="text-[9px] font-bold uppercase tracking-wide">{$t('character.tabs.more')}</span>
        </button>
    </div>
</div>

<!-- Desktop Top Tabs -->
<div class="hidden md:flex bg-slate-900/80 backdrop-blur-md border-b border-slate-800 overflow-x-auto no-scrollbar sticky top-[60px] z-30" role="tablist">
    {#each desktopTabs as tab}
       <button 
           onclick={() => activeTab.set(tab.id)} 
           class="px-5 lg:px-6 py-4 flex items-center gap-2 font-black text-xs transition-all whitespace-nowrap border-b-2 relative group {$activeTab === tab.id ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 border-transparent hover:text-slate-300'}"
           role="tab"
           aria-selected={$activeTab === tab.id}
       >
           <tab.icon size={14} class="{$activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'} group-hover:scale-110 transition-transform" /> 
           <span class="tracking-widest uppercase">{tab.label}</span>
           
           {#if $activeTab === tab.id}
               <div class="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></div>
           {/if}
       </button>
    {/each}
</div>
<div class="h-4 bg-slate-950 hidden md:block"></div>


