<script lang="ts">
    import { activeTab } from '$lib/stores/characterStore';
    import { Sword, Book, Backpack, Zap, Activity, FileText, User } from 'lucide-svelte';

    // Desktop tabs (no stats - shown in sidebar)
    const desktopTabs = [
        { id: 'acoes', label: 'AÇÕES', icon: Sword },
        { id: 'magias', label: 'MAGIAS', icon: Book },
        { id: 'talentos', label: 'TALENTOS', icon: Zap },
        { id: 'equipamento', label: 'ITENS', icon: Backpack },
        { id: 'notas', label: 'NOTAS', icon: FileText },
        { id: 'efeitos', label: 'EFEITOS', icon: Activity }
    ];
    
    // Mobile tabs (includes stats tab)
    const mobileTabs = [
        { id: 'stats', label: 'STATS', icon: User },
        { id: 'acoes', label: 'AÇÕES', icon: Sword },
        { id: 'magias', label: 'MAGIAS', icon: Book },
        { id: 'talentos', label: 'TALENTOS', icon: Zap },
        { id: 'equipamento', label: 'ITENS', icon: Backpack },
        { id: 'notas', label: 'NOTAS', icon: FileText },
        { id: 'efeitos', label: 'EFEITOS', icon: Activity }
    ];
</script>

<!-- Mobile Bottom Nav -->
<div class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-area-pb" role="tablist">
    <div class="flex justify-around items-center py-2">
        {#each mobileTabs as tab}
           <button 
               onclick={() => activeTab.set(tab.id)} 
               class="flex flex-col items-center gap-0.5 px-3 py-2 transition-all {$activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'}"
               role="tab"
               aria-selected={$activeTab === tab.id}
           >
               <tab.icon size={20} class="{$activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'}" />
               <span class="text-[9px] font-bold uppercase tracking-wide">{tab.label}</span>
           </button>
        {/each}
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

