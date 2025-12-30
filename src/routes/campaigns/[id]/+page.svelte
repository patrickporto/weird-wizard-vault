<script lang="ts">
    import { t } from 'svelte-i18n';
    import { page } from '$app/stores';
    import { campaignsMap } from '$lib/db';
    import { liveCampaigns } from '$lib/stores/live';
    import SessionView from '$lib/components/manager/SessionView.svelte';
    import BestiaryView from '$lib/components/manager/BestiaryView.svelte';
    import CampaignHeader from '$lib/components/manager/CampaignHeader.svelte';
    import HistorySidebar from '$lib/components/character/HistorySidebar.svelte';
    import { isHistoryOpen } from '$lib/stores/characterStore';
    import CampaignModal from '$lib/components/manager/CampaignModal.svelte';
    import { syncCampaign } from '$lib/logic/sync';

    let activeSubTab = $state('session'); 
    let isModalOpen = $state(false);

    let id = $derived($page.params.id);
    let campaign = $derived($liveCampaigns.find(c => c.id === id));
    let loaded = $derived(!!campaign);

    function handleSave(formData: any) {
        if (!id || !campaign) return;
        const updated = { ...campaign, ...formData };
        campaignsMap.set(id, updated);
        
        // Sync to players
        syncCampaign(id, { name: updated.name, gmName: updated.gmName });
        
        isModalOpen = false;
    }
</script>


<div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
    {#if loaded && campaign}
        <CampaignHeader 
            campaignName={campaign.name} 
            gmName={campaign.gmName}
            {activeSubTab} 
            onTabChange={(tab) => activeSubTab = tab} 
            onOpenSettings={() => isModalOpen = true}
        />

        <CampaignModal 
            isOpen={isModalOpen} 
            initialData={JSON.stringify(campaign)} 
            onClose={() => isModalOpen = false} 
            onSave={handleSave} 
        />

        <main class="max-w-7xl mx-auto p-4 md:p-8 animate-in slide-in-from-bottom-4 duration-500">
            {#if activeSubTab === 'session'}
                <SessionView {campaign} />
            {:else if activeSubTab === 'bestiary'}
                <BestiaryView />
            {/if}
        </main>
    {:else if loaded && !campaign}
        <div class="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                <!-- Using Ghost icon for consistency if available, or just keeping consistent style -->
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ghost"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>
            </div>
            <h1 class="text-2xl font-black text-white mb-2 uppercase tracking-tight">{$t('campaign.not_found.title')}</h1>
            <p class="text-slate-400 mb-8 max-w-md">{$t('campaign.not_found.message')}</p>
            <button onclick={() => window.history.back()} class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="19 12H5"/></svg>
                {$t('common.buttons.back')}
            </button>
        </div>
    {:else}
        <div class="flex items-center justify-center min-h-screen">
             <div class="relative w-16 h-16">
                 <div class="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                 <div class="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
        </div>
    {/if}
    
    <HistorySidebar isOpen={$isHistoryOpen} onClose={() => isHistoryOpen.set(false)} />
</div>

