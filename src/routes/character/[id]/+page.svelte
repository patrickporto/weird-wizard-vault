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
    import { ChevronRight, Clover, Users } from 'lucide-svelte';

    let loaded = $state(false);
    let currentId = $state<string | null>(null);
    
    // Auto-save and Auto-sync effect
    $effect(() => {
        if (!loaded || !currentId) return;

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
                health: maxH,
                defense: def,
                initiative: charData.initiative,
                acted: charData.acted,
                afflictions: charData.afflictions || []
            });
        }
    });

    // Heartbeat for online status
    $effect(() => {
        if (!loaded || !currentId) return;
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
                health: get(effectiveMaxHealth),
                defense: get(totalDefense),
                initiative: current.initiative,
                acted: current.acted,
                afflictions: current.afflictions || []
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
        currentId = id;
        
        await waitForSync();

        // Load or Initialize
        if (charactersMap.has(id)) {
            const data = charactersMap.get(id);
            character.set({ ...defaultCharacter, ...data });
            if (data.normalHealth !== undefined) normalHealth.set(data.normalHealth);
            if (data.currentHealth !== undefined) currentHealth.set(data.currentHealth);
            if (data.damage !== undefined) damage.set(data.damage);
        } else {
            const newChar = JSON.parse(JSON.stringify(defaultCharacter));
            newChar.normalHealth = 24;
            newChar.currentHealth = 24;
            newChar.damage = 0;
            
            character.set(newChar);
            normalHealth.set(24);
            currentHealth.set(24);
            damage.set(0);
            charactersMap.set(id, newChar);
        }
        
        // Auto-join campaign room
        const charData = get(character);
        if (charData.campaignId) {
            joinCampaignRoom(charData.campaignId, false);
        }
        
        loaded = true;
    }
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

  <main class="max-w-6xl mx-auto px-4 mt-6 lg:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
     
     <!-- SIDEBAR ESQUERDA -->
     <aside class="lg:col-span-3 space-y-4">
        <AttributesSection />

        <button onclick={() => modalState.set({type: 'pre_roll', isOpen: true, data: {type:'luck', source: {name:'Sorte'}}})} class="w-full bg-slate-900 hover:bg-slate-800 p-3 rounded-xl border border-slate-800 flex items-center justify-between group transition-colors">
            <div class="flex items-center gap-2 font-bold text-slate-400 group-hover:text-green-400 uppercase text-xs"><Clover size={14}/> Teste de Sorte</div><ChevronRight size={14} class="text-slate-600"/>
        </button>

        <VitalsSection />
        <CurrencySection />
        <LanguagesSection />
        <AfflictionsSection />

        <div class="hidden lg:block pt-2">
            <CampaignStatus />
        </div>
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

   <div class="lg:hidden px-4 mt-6">
      <CampaignStatus banner />
   </div>
  {:else}
    <div class="flex items-center justify-center min-h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  {/if}
</div>
```