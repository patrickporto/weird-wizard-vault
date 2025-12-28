<script>
    import { activeTab } from '$lib/stores/characterStore';
    import { Sword, Book, Backpack, Zap, Activity, FileText } from 'lucide-svelte';

    const tabs = [
        { id: 'acoes', label: 'AÇÕES', icon: Sword },
        { id: 'magias', label: 'MAGIAS', icon: Book },
        { id: 'efeitos', label: 'EFEITOS', icon: Activity },
        { id: 'talentos', label: 'TALENTOS', icon: Zap },
        { id: 'equipamento', label: 'ITENS', icon: Backpack },
        { id: 'notas', label: 'NOTAS', icon: FileText }
    ];
</script>

<nav class="flex bg-slate-950/50 border-b border-slate-800 overflow-x-auto no-scrollbar">
    {#each tabs as tab}
       <button on:click={() => activeTab.set(tab.id)} class="px-4 lg:px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 {$activeTab === tab.id ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}">
           <svelte:component this={tab.icon} size={16} /> {tab.label}
       </button>
    {/each}
</nav>
