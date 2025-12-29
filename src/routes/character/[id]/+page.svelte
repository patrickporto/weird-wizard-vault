<script>
    import { activeTab, modalState, rollHistory, character, defaultCharacter, isHistoryOpen, normalHealth, currentHealth, damage } from '$lib/stores/characterStore';
    
    // Yjs / DB
    import { page } from '$app/stores';
    import { charactersMap, waitForSync } from '$lib/db';
    import { get } from 'svelte/store';
    import { onDestroy } from 'svelte';

    // Components
    import CharacterHeader from '$lib/components/character/CharacterHeader.svelte';
    import HistorySidebar from '$lib/components/character/HistorySidebar.svelte';
    import ModalManager from '$lib/components/character/modals/ModalManager.svelte';
    
    import AttributesSection from '$lib/components/character/AttributesSection.svelte';
    import VitalsSection from '$lib/components/character/VitalsSection.svelte';
    import CurrencySection from '$lib/components/character/CurrencySection.svelte';
    import LanguagesSection from '$lib/components/character/LanguagesSection.svelte';
    import AfflictionsSection from '$lib/components/character/AfflictionsSection.svelte';
    import TabNavigation from '$lib/components/character/TabNavigation.svelte';
    
    import ActionsTab from '$lib/components/character/ActionsTab.svelte';
    import SpellsTab from '$lib/components/character/SpellsTab.svelte';
    import EffectsTab from '$lib/components/character/EffectsTab.svelte';
    import TalentsTab from '$lib/components/character/TalentsTab.svelte';
    import InventoryTab from '$lib/components/character/InventoryTab.svelte';
    import NotesTab from '$lib/components/character/NotesTab.svelte';
    import { ChevronRight, Clover, Users } from 'lucide-svelte';
    // goto removed as it moved to CharacterHeader.svelte

    let loaded = false;
    let currentId = null;
    
    // Reactive saving for all stores
    $: if (loaded && currentId) {
        saveCharacterData(currentId, $character, $normalHealth, $currentHealth, $damage);
    }

    function saveCharacterData(id, charData, nh, ch, dmg) {
        // Debounce or just set. Yjs is fast enough for local?
        // To avoid loops, we rely on Yjs or valid changes.
        // We accumulate data into one object.
        const toSave = { ...charData, normalHealth: nh, currentHealth: ch, damage: dmg };
        charactersMap.set(id, toSave);
    }

    // Reactive statement to handle ID changes
    $: if ($page.params.id) {
        handleIdChange($page.params.id);
    }

    async function handleIdChange(id) {
        if (currentId !== id) loaded = false;
        
        if (currentId === id) return;
        currentId = id;
        
        await waitForSync();

        // Load or Initialize
        if (charactersMap.has(id)) {
            const data = charactersMap.get(id);
            character.set({ ...defaultCharacter, ...data });
            // Sync specific stores
            if (data.normalHealth !== undefined) normalHealth.set(data.normalHealth);
            if (data.currentHealth !== undefined) currentHealth.set(data.currentHealth);
            if (data.damage !== undefined) damage.set(data.damage);
        } else {
            // Initialize with default
            const newChar = JSON.parse(JSON.stringify(defaultCharacter));
            // Set defaults for separate stores
            newChar.normalHealth = 24;
            newChar.currentHealth = 24;
            newChar.damage = 0;
            
            character.set(newChar);
            normalHealth.set(24);
            currentHealth.set(24);
            damage.set(0);
            
            charactersMap.set(id, newChar);
        }
        
        // Auto-join campaign room if in a campaign
        const charData = get(character);
        if (charData.campaignId) {
            import('$lib/logic/sync').then(({ joinCampaignRoom }) => {
                joinCampaignRoom(charData.campaignId, false);
            });
        }
        
        loaded = true;
    }

    // No explicit subscription to clean up
    onDestroy(() => {
        // cleanup if needed
    });
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 relative overflow-x-hidden">
  
  {#if loaded}
  <HistorySidebar isOpen={$isHistoryOpen} onClose={() => isHistoryOpen.set(false)} />
  
  <ModalManager />

  <CharacterHeader />
  <!-- History toggle was simulated in header, real toggle logic is via local state or store. 
       We can pass isHistoryOpen binding or equivalent. 
       Ideally Header should emit event or use store. 
       For now, let's leave it simple: Header buttons might not work without connecting events.
  -->

  <main class="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
     
     <!-- SIDEBAR ESQUERDA -->
     <aside class="lg:col-span-3 space-y-4">
        <AttributesSection />

        <button onclick={() => modalState.set({type: 'pre_roll', isOpen: true, data: {type:'luck', source: {name:'Sorte'}}})} class="w-full bg-slate-900 hover:bg-slate-800 p-3 rounded-xl border border-slate-800 flex items-center justify-between group transition-colors">
            <div class="flex items-center gap-2 font-bold text-slate-400 group-hover:text-green-400 uppercase text-xs"><Clover size={14}/> Teste de Sorte</div><ChevronRight size={14} class="text-slate-600"/>
        </button>

        <VitalsSection />

        {#if $character.campaignId}
            <div class="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-3">
                 <div class="flex items-center justify-between">
                     <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Campanha</h3>
                     <button onclick={characterActions.leaveCampaign} class="text-[10px] text-slate-500 hover:text-red-400 uppercase font-bold transition-colors">Sair</button>
                 </div>
                 <div>
                      <div class="font-bold text-white text-sm">{$character.campaignName}</div>
                      <div class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">Mestre: <span class="text-indigo-300">{$character.gmName}</span></div>
                 </div>
                 <div class="flex items-center gap-2 pt-2 border-t border-indigo-500/10">
                      <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span class="text-[10px] text-slate-500 font-bold uppercase">Sincronizado</span>
                 </div>
            </div>
        {/if}

        <CurrencySection />
        <LanguagesSection />
        <AfflictionsSection />
     </aside>

     <!-- MAIN CONTENT -->
     <section class="lg:col-span-9">
        <div class="bg-slate-900 rounded-xl border border-slate-800 min-h-[60vh]">
           <TabNavigation />

           <div class="p-4 md:p-6">
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
  {:else}
    <div class="flex items-center justify-center min-h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  {/if}
</div>