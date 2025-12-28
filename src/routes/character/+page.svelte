<script>
    import { activeTab, modalState, rollHistory, character } from '$lib/stores/characterStore';
    
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
    import { ChevronRight, Clover } from 'lucide-svelte';

    let isHistoryOpen = false;
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 relative overflow-x-hidden">
  
  <HistorySidebar isOpen={isHistoryOpen} onClose={() => isHistoryOpen = false} />
  
  <ModalManager />

  <!-- HEADER -->
  <CharacterHeader bind:isHistoryOpen={isHistoryOpen} />
  <!-- History toggle was simulated in header, real toggle logic is via local state or store. 
       We can pass isHistoryOpen binding or equivalent. 
       Ideally Header should emit event or use store. 
       For now, let's leave it simple: Header buttons might not work without connecting events.
  -->

  <main class="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
     
     <!-- SIDEBAR ESQUERDA -->
     <aside class="lg:col-span-3 space-y-4">
        <AttributesSection />

        <button on:click={() => modalState.update(m => ({...m, type: 'pre_roll', data: {type:'luck', source: {name:'Sorte'}}}))} class="w-full bg-slate-900 hover:bg-slate-800 p-3 rounded-xl border border-slate-800 flex items-center justify-between group transition-colors">
            <div class="flex items-center gap-2 font-bold text-slate-400 group-hover:text-green-400 uppercase text-xs"><Clover size={14}/> Teste de Sorte</div><ChevronRight size={14} class="text-slate-600"/>
        </button>

        <VitalsSection />
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
</div>