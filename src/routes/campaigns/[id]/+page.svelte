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
    import { Sword, Library, Dices, ChevronUp, ChevronDown, X } from 'lucide-svelte';
    import { calculateDiceRoll } from '$lib/logic/dice';
    import { characterActions } from '$lib/stores/characterStore';
    import { get } from 'svelte/store';
    import DiceRollModal from '$lib/components/common/DiceRollModal.svelte';

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

    // Quick Roll UI State
    let isQuickRollMenuOpen = $state(false);
    let quickRollState = $state({ isOpen: false, sides: 20, count: 1, modifier: 0 });

    function startQuickRoll(sides: number, count = 1) {
        quickRollState = { isOpen: true, sides, count, modifier: 0 };
    }

    function confirmQuickRoll(mod: number) {
        if (!campaign) return;

        const res = calculateDiceRoll(quickRollState.sides, quickRollState.count, mod);
        let desc = "";
        if (quickRollState.count > 1) desc += `Dados: [${res.results.join(', ')}] `;
        if (res.bonusRolls?.length > 0) desc += `Bonus Rolls: [${res.bonusRolls.join(', ')}] -> ${Math.abs(res.modifierTotal)}`;

        const gmName = campaign.gmName || get(t)('common.labels.master');

        characterActions.addToHistory({
            source: 'GM',
            charName: gmName,
            name: `${quickRollState.count}d${quickRollState.sides} ${mod ? (mod > 0 ? `+${mod}` : mod) : ''}`,
            description: desc.trim() || null,
            total: res.total,
            formula: res.formula,
            crit: res.crit
        });

        isHistoryOpen.set(true);
        quickRollState.isOpen = false;
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
                <BestiaryView campId={id} />
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

    <!-- Dice Roll Popover Menu -->
    {#if isQuickRollMenuOpen}
        <div class="fixed bottom-24 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 z-[60] flex flex-col items-center gap-2">
            <div class="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
                <button onclick={() => { startQuickRoll(20); isQuickRollMenuOpen = false; }} class="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg border border-indigo-500/20">
                    <span class="text-[10px] opacity-70">d20</span>
                    <Dices size={16} />
                </button>
                <button onclick={() => { startQuickRoll(6); isQuickRollMenuOpen = false; }} class="bg-slate-800 hover:bg-slate-700 text-white font-bold w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg border border-white/5">
                    <span class="text-[10px] opacity-70">1d6</span>
                    <Dices size={16} />
                </button>
                <button onclick={() => { startQuickRoll(6, 2); isQuickRollMenuOpen = false; }} class="bg-slate-800 hover:bg-slate-700 text-white font-bold w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg border border-white/5">
                    <span class="text-[10px] opacity-70">2d6</span>
                    <Dices size={16} />
                </button>
                <button onclick={() => { startQuickRoll(6, 3); isQuickRollMenuOpen = false; }} class="bg-slate-800 hover:bg-slate-700 text-white font-bold w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg border border-white/5">
                    <span class="text-[10px] opacity-70">3d6</span>
                    <Dices size={16} />
                </button>
                <div class="w-px h-8 bg-white/10 mx-1"></div>
                <button onclick={() => isQuickRollMenuOpen = false} class="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>
        <!-- Backdrop for menu -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="fixed inset-0 bg-black/40 z-[55]" onclick={() => isQuickRollMenuOpen = false}></div>
    {/if}

    <!-- Desktop Floating Action Button -->
    <div class="hidden md:block fixed bottom-8 left-8 z-[60]">
        <button
            onclick={() => isQuickRollMenuOpen = !isQuickRollMenuOpen}
            class="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center transition-all active:scale-90 border-2 border-white/10 group"
            title={$t('session.quick.fab_title')}
        >
            <Dices size={32} class="group-hover:rotate-12 transition-transform" />
        </button>
    </div>

    <!-- Bottom Nav Mobile -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
        <div class="max-w-md mx-auto relative h-16 pointer-events-auto">
            <!-- Background Shape Container -->
            <div class="absolute inset-0 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <!-- Inner Glow/Shadow -->
                <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
            </div>

            <div class="relative h-full flex items-center justify-around px-2">
                <!-- Tab: Session -->
                <button
                    onclick={() => { activeSubTab = 'session'; isQuickRollMenuOpen = false; }}
                    class="flex flex-col items-center justify-center gap-1 flex-1 transition-all {activeSubTab === 'session' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}"
                >
                    <Sword size={20} class={activeSubTab === 'session' ? 'animate-in zoom-in-75 duration-300' : ''} />
                    <span class="text-[9px] font-black uppercase tracking-widest leading-none">{$t('session.tabs.session')}</span>
                </button>

                <!-- Central Action: Quick Roll -->
                <div class="relative w-16 h-16 -mt-10 flex items-center justify-center">
                    <!-- Outer ring/halo -->
                    <div class="absolute inset-0 bg-indigo-600/20 rounded-full blur-xl animate-pulse"></div>

                    <button
                        onclick={() => isQuickRollMenuOpen = !isQuickRollMenuOpen}
                        class="relative w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)] border-4 border-slate-900 transition-all active:scale-90 hover:bg-indigo-500 z-10"
                        aria-label={$t('session.quick.roll_dice')}
                    >
                        <Dices size={28} class="text-white {isQuickRollMenuOpen ? 'rotate-90' : 'rotate-0'} transition-transform duration-300" />
                    </button>
                </div>

                <!-- Tab: Bestiary -->
                <button
                    onclick={() => { activeSubTab = 'bestiary'; isQuickRollMenuOpen = false; }}
                    class="flex flex-col items-center justify-center gap-1 flex-1 transition-all {activeSubTab === 'bestiary' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}"
                >
                    <Library size={20} class={activeSubTab === 'bestiary' ? 'animate-in zoom-in-75 duration-300' : ''} />
                    <span class="text-[9px] font-black uppercase tracking-widest leading-none">{$t('session.tabs.bestiary')}</span>
                </button>
            </div>
        </div>
    </nav>

    <DiceRollModal
        isOpen={quickRollState.isOpen}
        title={`${$t('session.quick.roll_title')} (${quickRollState.count}d${quickRollState.sides})`}
        label={quickRollState.sides === 20 ? $t('session.quick.boons_banes') : $t('session.quick.fixed_modifier')}
        onClose={() => quickRollState.isOpen = false}
        onRoll={confirmQuickRoll}
        initialModifier={0}
    />
</div>
