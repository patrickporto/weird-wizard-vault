<script lang="ts">
    import { 
        activeTab, modalState, rollHistory, character, defaultCharacter, 
        isHistoryOpen, normalHealth, currentHealth, damage, totalDefense,
        effectiveMaxHealth, characterActions
    } from '$lib/stores/characterStore';
    
    // Yjs / DB
    import { page } from '$app/stores';
    import { charactersMap, waitForSync } from '$lib/db';
    import { get } from 'svelte/store';
    import { onDestroy } from 'svelte';
    import { syncCharacter, joinCampaignRoom } from '$lib/logic/sync';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';

    // Components
    import CharacterHeader from '$lib/components/character/CharacterHeader.svelte';
    import HistorySidebar from '$lib/components/character/HistorySidebar.svelte';
    import ModalManager from '$lib/components/character/modals/ModalManager.svelte';
    
    import AttributesSection from '$lib/components/character/AttributesSection.svelte';
    import VitalsSection from '$lib/components/character/VitalsSection.svelte';
    import CurrencySection from '$lib/components/character/CurrencySection.svelte';
    import LanguagesSection from '$lib/components/character/LanguagesSection.svelte';
    import AfflictionsSection from '$lib/components/character/AfflictionsSection.svelte';
    import CampaignStatus from '$lib/components/character/CampaignStatus.svelte';
    import TabNavigation from '$lib/components/character/TabNavigation.svelte';
    
    import ActionsTab from '$lib/components/character/ActionsTab.svelte';
    import SpellsTab from '$lib/components/character/SpellsTab.svelte';
    import EffectsTab from '$lib/components/character/EffectsTab.svelte';
    import TalentsTab from '$lib/components/character/TalentsTab.svelte';
    import InventoryTab from '$lib/components/character/InventoryTab.svelte';
    import NotesTab from '$lib/components/character/NotesTab.svelte';
    import StatsTab from '$lib/components/character/StatsTab.svelte';
    import { ChevronRight, Clover, Users, Ghost, ArrowLeft } from 'lucide-svelte';

    let loaded = $state(false);
    let notFound = $state(false);
    let currentId = $state<string | null>(null);
    
    // Auto-save and Auto-sync effect
    $effect(() => {
        if (!loaded || notFound || !currentId) return;

        const charData = $character;
        const nh = $normalHealth;
        const ch = $currentHealth;
        const dmg = $damage;
        const def = $totalDefense;
        const maxH = $effectiveMaxHealth;

        // Save to local Yjs
        const toSave = { ...charData, normalHealth: nh, currentHealth: ch, damage: dmg };
        charactersMap.set(currentId, toSave);

        // Sync to GM if in campaign
        if (charData.campaignId) {
            syncCharacter({
                id: currentId,
                type: 'player',
                name: charData.name,
                level: charData.level,
                ancestry: charData.ancestry,
                damage: dmg,
                currentHealth: ch,
                normalHealth: nh,
                health: maxH,
                defense: def,
                initiative: charData.initiative,
                acted: charData.acted,
                afflictions: charData.afflictions || [],
                campaignApproval: charData.campaignApproval
            });
        }
    });

    // Heartbeat for online status
    $effect(() => {
        if (!loaded || notFound || !currentId) return;
        const charData = get(character);
        if (!charData.campaignId) return;

        const interval = setInterval(() => {
            const current = get(character);
            syncCharacter({
                id: currentId,
                type: 'player',
                name: current.name,
                level: current.level,
                ancestry: current.ancestry,
                damage: get(damage),
                currentHealth: get(currentHealth),
                normalHealth: get(normalHealth),
                health: get(effectiveMaxHealth),
                defense: get(totalDefense),
                initiative: current.initiative,
                acted: current.acted,
                afflictions: current.afflictions || [],
                campaignApproval: current.campaignApproval
            });
        }, 30000); // 30 seconds heartbeat

        return () => clearInterval(interval);
    });

    // Handle ID changes
    $effect(() => {
        const id = $page.params.id;
        if (id && id !== currentId) {
            handleIdChange(id);
        }
    });

    async function handleIdChange(id: string) {
        loaded = false;
        notFound = false;
        currentId = id;
        
        await waitForSync();

        // Load or 404
        if (charactersMap.has(id)) {
            const data = charactersMap.get(id);
            // Include id in character store for sync identification
            character.set({ ...defaultCharacter, ...data, id });
            if (data.normalHealth !== undefined) normalHealth.set(data.normalHealth);
            if (data.currentHealth !== undefined) currentHealth.set(data.currentHealth);
            if (data.damage !== undefined) damage.set(data.damage);
            
            // Auto-join campaign room with character ID for bidirectional sync
            const charData = get(character);
            if (charData.campaignId) {
                joinCampaignRoom(charData.campaignId, false, currentId);
            }
        } else {
            notFound = true;
        }
        
        loaded = true;
    }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-28 md:pb-20 relative overflow-x-hidden">
  
  {#if loaded}
      {#if notFound}
        <div class="min-h-screen flex flex-col items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
                <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                    <Ghost size={40} />
                </div>
                <h1 class="text-2xl font-black text-white mb-2 uppercase tracking-tight">Personagem Não Encontrado</h1>
                <p class="text-slate-400 mb-8">Este personagem não existe na sua base local. Crie um novo personagem através da página inicial.</p>
                <button 
                    onclick={() => goto(resolve('/'))}
                    class="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                    <ArrowLeft size={18} /> Voltar ao Início
                </button>
            </div>
        </div>
      {:else}
          <HistorySidebar isOpen={$isHistoryOpen} onClose={() => isHistoryOpen.set(false)} />
          
          <ModalManager />

          <CharacterHeader />
          
          <main class="max-w-6xl mx-auto md:px-4 mt-6 lg:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
             
             <!-- SIDEBAR ESQUERDA (desktop only) -->
             <aside class="hidden lg:block lg:col-span-3 space-y-4">
                <AttributesSection />

                <button onclick={() => modalState.set({type: 'pre_roll', isOpen: true, data: {type:'luck', source: {name:'Sorte'}}})} class="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-center gap-3 group transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/20 active:scale-[0.98] cursor-pointer">
                    <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clover size={24} class="text-white"/>
                    </div>
                    <span class="font-black text-white uppercase tracking-wider text-sm">Teste de Sorte</span>
                </button>

                <VitalsSection />
                <CurrencySection />
                <LanguagesSection />
                <AfflictionsSection />

                <div class="pt-2">
                    <CampaignStatus />
                </div>
             </aside>

             <!-- MAIN CONTENT -->
             <section class="lg:col-span-9">
                <div class="bg-slate-900 md:rounded-xl md:border md:border-slate-800 min-h-[calc(100vh-200px)] md:min-h-[60vh] flex flex-col">
                   <TabNavigation />

                   <div class="p-4 md:p-6 flex-1 flex flex-col">
                      {#if $activeTab === 'stats'}
                         <StatsTab />
                      {/if}

                      {#if $activeTab === 'acoes'}
                         <ActionsTab />
                      {/if}

                      {#if $activeTab === 'efeitos'}
                         <EffectsTab />
                      {/if}

                      {#if $activeTab === 'magias'}
                         <SpellsTab />
                      {/if}

                      {#if $activeTab === 'talentos'}
                         <TalentsTab />
                      {/if}
                      
                      {#if $activeTab === 'equipamento'}
                         <InventoryTab />
                      {/if}

                      {#if $activeTab === 'notas'}
                         <NotesTab />
                      {/if}
                   </div>
                </div>
             </section>
          </main>
      
           <div class="hidden">
             <CampaignStatus banner />
          </div>
       {/if}
    {:else}
        <div class="flex items-center justify-center min-h-screen">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    {/if}
</div>
```