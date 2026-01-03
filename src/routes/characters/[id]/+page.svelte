<script lang="ts">
    import { t } from 'svelte-i18n';
    import {
        activeTab, modalState, rollHistory, character, defaultCharacter,
        isHistoryOpen, normalHealth, currentHealth, damage, totalDefense,
        effectiveMaxHealth, characterActions, activeEffects
    } from '$lib/stores/characterStore';

    // Yjs / DB
    import { page } from '$app/stores';
    import { charactersMap, waitForSync } from '$lib/db';
    import { get } from 'svelte/store';
    import { onDestroy } from 'svelte';
    import { syncCharacter, joinCampaignRoom, leaveCampaignRoom } from '$lib/logic/sync';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { browser } from '$app/environment';

    // Components
    import CharacterHeader from '$lib/components/character/CharacterHeader.svelte';
    import HistorySidebar from '$lib/components/character/HistorySidebar.svelte';
    // Modals
    import ItemEditor from '$lib/components/character/modals/parts/ItemEditor.svelte';
    import SpellEditor from '$lib/components/character/modals/parts/SpellEditor.svelte';
    import TalentEditor from '$lib/components/character/modals/parts/TalentEditor.svelte';
    import EffectEditor from '$lib/components/character/modals/parts/EffectEditor.svelte';
    import AttributeEditor from '$lib/components/character/modals/parts/AttributeEditor.svelte';
    import StatEditor from '$lib/components/character/modals/parts/StatEditor.svelte';
    import HealthDamageEditor from '$lib/components/character/modals/parts/HealthDamageEditor.svelte';
    import CharacterInfoEditor from '$lib/components/character/modals/parts/CharacterInfoEditor.svelte';
    import ConfirmationModalContent from '$lib/components/character/modals/parts/ConfirmationModalContent.svelte';
    import GrimoireSelection from '$lib/components/character/modals/parts/GrimoireSelection.svelte';
    import TalentSelection from '$lib/components/character/modals/parts/TalentSelection.svelte';
    import AttackOptionsContent from '$lib/components/character/modals/parts/AttackOptionsContent.svelte';
    import AfflictionManager from '$lib/components/character/modals/parts/AfflictionManager.svelte';
    import RestConfirmationContent from '$lib/components/character/modals/parts/RestConfirmationContent.svelte';
    import DiceRollModal from '$lib/components/common/DiceRollModal.svelte';

    import AttributesSection from '$lib/components/character/AttributesSection.svelte';
    import VitalsSection from '$lib/components/character/VitalsSection.svelte';
    import CurrencySection from '$lib/components/character/CurrencySection.svelte';
    import LanguagesSection from '$lib/components/character/LanguagesSection.svelte';
    import SensesSection from '$lib/components/character/SensesSection.svelte';
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

    // SOTDL Imports
    import {
        sotdlCharacter,
        defaultSotDLCharacter,
        sotdlModifiers,
        sotdlTotalHealingRate,
        sotdlActiveEffects,
        sotdlCharacterActions
    } from '$lib/stores/characterStoreSotDL';
    import CharacterHeaderSotDL from '$lib/components/character/sotdl/CharacterHeaderSotDL.svelte';
    import AttributesSectionSotDL from '$lib/components/character/sotdl/AttributesSectionSotDL.svelte';
    import VitalsSectionSotDL from '$lib/components/character/sotdl/VitalsSectionSotDL.svelte';
    import SensesSectionSotDL from '$lib/components/character/sotdl/SensesSectionSotDL.svelte';
    import AfflictionsSectionSotDL from '$lib/components/character/sotdl/AfflictionsSectionSotDL.svelte';
    import LanguagesSectionSotDL from '$lib/components/character/sotdl/LanguagesSectionSotDL.svelte';
    import ProfessionsSectionSotDL from '$lib/components/character/sotdl/ProfessionsSectionSotDL.svelte';
    import CampaignStatusSotDL from '$lib/components/character/sotdl/CampaignStatusSotDL.svelte';
    import StatsTabSotDL from '$lib/components/character/sotdl/StatsTabSotDL.svelte';
    import ActionsTabSotDL from '$lib/components/character/sotdl/ActionsTabSotDL.svelte';
    import EffectsTabSotDL from '$lib/components/character/sotdl/EffectsTabSotDL.svelte';
    import NotesTabSotDL from '$lib/components/character/sotdl/NotesTabSotDL.svelte';
    import SpellsTabSotDL from '$lib/components/character/sotdl/SpellsTabSotDL.svelte';
    import SpellEditorSotDL from '$lib/components/character/sotdl/SpellEditorSotDL.svelte';
    import GrimoireSelectionSotDL from '$lib/components/character/sotdl/GrimoireSelectionSotDL.svelte';
    import TalentsTabSotDL from '$lib/components/character/sotdl/TalentsTabSotDL.svelte';
    import TalentEditorSotDL from '$lib/components/character/sotdl/TalentEditorSotDL.svelte';
    import TalentSelectionSotDL from '$lib/components/character/sotdl/TalentSelectionSotDL.svelte';
    import CharacterInfoEditorSotDL from '$lib/components/character/sotdl/CharacterInfoEditorSotDL.svelte';
    import ItemEditorSotDL from '$lib/components/character/sotdl/ItemEditorSotDL.svelte';
    import InventoryTabSotDL from '$lib/components/character/sotdl/InventoryTabSotDL.svelte';
    import AttackOptionsContentSotDL from '$lib/components/character/sotdl/AttackOptionsContentSotDL.svelte';
    import EffectEditorSotDL from '$lib/components/character/sotdl/EffectEditorSotDL.svelte';


    let loaded = $state(false);
    let notFound = $state(false);

    // System check
    let currentId = $state<string | null>(null);
    let currentSystem = $state<string>('sofww');
    let isSotDL = $derived(currentSystem === 'sofdl');

    // Auto-save and Auto-sync effect
    $effect(() => {
        if (!loaded || notFound || !currentId) return;

        if (currentSystem === 'sofdl') {
             // SOTDL Sync Logic
             const charData = $sotdlCharacter;

             // Sync to local Yjs
             charactersMap.set(currentId, { ...charData, lastUpdate: Date.now() });

             // Sync to GM/Peers if in campaign
             if (charData.campaignId) {
                syncCharacter({
                    id: currentId,
                    type: 'player',
                    name: charData.name,
                    level: charData.level,
                    ancestry: charData.ancestry,
                    damage: charData.damage,
                    health: charData.health,
                    healingRate: charData.healingRate,
                    insanity: charData.insanity,
                    corruption: charData.corruption,
                    defense: charData.defense,
                    speed: charData.speed,
                    power: charData.power,
                    attributes: charData.attributes, // Object!
                    initiative: charData.initiative,
                    acted: charData.acted,
                    afflictions: charData.afflictions || [],
                    senses: charData.senses || [],
                    campaignApproval: charData.campaignApproval,
                    imageUrl: charData.imageUrl,
                    notes: charData.notes
                });
             }
             return;
        }

        const charData = $character;
        const nh = $normalHealth;
        const ch = $currentHealth;
        const dmg = $damage;
        const def = $totalDefense;
        const maxH = $effectiveMaxHealth;

        // Save to local Yjs
        const toSave = { ...charData, normalHealth: nh, currentHealth: ch, damage: dmg, lastUpdate: Date.now() };
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
                senses: charData.senses || [],
                campaignApproval: charData.campaignApproval,
                imageUrl: charData.imageUrl,
                notes: charData.notes
            });
        }
    });

    // Heartbeat for online status
    $effect(() => {
        if (!loaded || notFound || !currentId || currentSystem === 'sofdl') return; // Skip heartbeat for sotdl for now or implement similar
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
                senses: current.senses || [],
                campaignApproval: current.campaignApproval,
                imageUrl: current.imageUrl,
                notes: current.notes
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
            const data: any = charactersMap.get(id);
            const system = data.system || 'sofww';
            currentSystem = system;

            if (system === 'sofdl') {
                sotdlCharacter.set({ ...defaultSotDLCharacter, ...data, id });
                // Clear WW store to prevent data bleed
                character.set({ ...defaultCharacter, id: '' });
            } else {
                // Include id in character store for sync identification
                character.set({ ...defaultCharacter, ...data, id });
                // Clear SotDL store to prevent data bleed
                sotdlCharacter.set({ ...defaultSotDLCharacter, id: '' });

                if (data.normalHealth !== undefined) normalHealth.set(data.normalHealth);
                if (data.currentHealth !== undefined) currentHealth.set(data.currentHealth);
                if (data.damage !== undefined) damage.set(data.damage);

                 // Auto-join campaign room with character ID for bidirectional sync
                const charData = get(character);
                if (charData.campaignId) {
                    joinCampaignRoom(charData.campaignId, false, currentId);
                }
            }
        } else {
            notFound = true;
        }


        if (browser) {
            modalState.set({ type: null, isOpen: false, data: null });
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                activeTab.set('stats');
            } else if (get(activeTab) === 'stats') {
                activeTab.set('acoes');
            }
        }

        loaded = true;
    }

    // Cleanup on unmount
    onDestroy(() => {
        leaveCampaignRoom();
    });
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-28 md:pb-20 relative overflow-x-hidden">

  {#if loaded}
      {#if notFound}
        <div class="min-h-screen flex flex-col items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
                <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                    <Ghost size={40} />
                </div>
                <h1 class="text-2xl font-black text-white mb-2 uppercase tracking-tight">{$t('character.not_found.title')}</h1>
                <p class="text-slate-400 mb-8">{$t('character.not_found.message')}</p>
                <button
                    onclick={() => goto(resolve('/'))}
                    class="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                    <ArrowLeft size={18} /> {$t('character.back_to_home')}
                </button>
            </div>
        </div>
      {:else if currentSystem === 'sofdl'}
          <!-- SOTDL VIEW -->


          <CharacterHeaderSotDL />
          <main class="w-full max-w-6xl mx-auto md:px-4 mt-0 md:mt-6 grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 pb-12">
               <!-- SIDEBAR ESQUERDA (desktop only) -->
               <aside class="hidden md:block md:col-span-4 lg:col-span-3 space-y-4">
                  <AttributesSectionSotDL />

                  <VitalsSectionSotDL />
                  <SensesSectionSotDL />
                  <LanguagesSectionSotDL />
                  <ProfessionsSectionSotDL />
                  <AfflictionsSectionSotDL />

                  <div class="pt-2">
                      <CampaignStatusSotDL />
                  </div>
               </aside>

               <section class="md:col-span-8 lg:col-span-9">
                  <div class="bg-slate-900 md:rounded-xl md:border md:border-slate-800 min-h-[calc(100vh-200px)] md:min-h-[60vh] flex flex-col">
                     <TabNavigation />
                     <div class="p-4 xs:p-5 md:p-6 flex-1 flex flex-col">
                        {#if $activeTab === 'stats'}
                           <StatsTabSotDL />
                        {:else if $activeTab === 'acoes'}
                           <ActionsTabSotDL />
                        {:else if $activeTab === 'efeitos'}
                           <EffectsTabSotDL />
                        {:else if $activeTab === 'notas'}
                           <NotesTabSotDL />
                        {:else if $activeTab === 'magias'}
                           <SpellsTabSotDL />
                        {:else if $activeTab === 'talentos'}
                           <TalentsTabSotDL />
                        {:else if $activeTab === 'equipamento'}
                           <InventoryTabSotDL />
                        {:else}
                           <div class="p-8 text-center text-slate-500 italic">
                               {$t('common.labels.coming_soon')}
                           </div>
                        {/if}
                     </div>
                  </div>
               </section>
          </main>

          <div class="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 p-2 pb-safe z-50">
             <TabNavigation />
          </div>

      {:else}
          <!-- WEIRD WIZARD VIEW -->

          <CharacterHeader />

          <main class="w-full max-w-6xl mx-auto md:px-4 mt-0 md:mt-6 grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 pb-12">

             <!-- SIDEBAR ESQUERDA (desktop only) -->
             <aside class="hidden md:block md:col-span-4 lg:col-span-3 space-y-4">
                <AttributesSection />

                <button onclick={() => modalState.set({type: 'pre_roll', isOpen: true, data: {type:'luck', source: {name:'Sorte'}}})} class="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-center gap-3 group transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/20 active:scale-[0.98] cursor-pointer">
                    <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clover size={24} class="text-white"/>
                    </div>
                    <span class="font-black text-white uppercase tracking-wider text-sm">{$t('character.luck_test')}</span>
                </button>

                <VitalsSection />
                <SensesSection />
                <CurrencySection />
                <LanguagesSection />
                <AfflictionsSection />

                <div class="pt-2">
                    <CampaignStatus />
                </div>
             </aside>

             <!-- MAIN CONTENT -->
             <section class="md:col-span-8 lg:col-span-9">
                <div class="bg-slate-900 md:rounded-xl md:border md:border-slate-800 min-h-[calc(100vh-200px)] md:min-h-[60vh] flex flex-col">
                   <TabNavigation />

                   <div class="p-4 xs:p-5 md:p-6 flex-1 flex flex-col">
                      {#if $activeTab === 'stats'}
                         <StatsTab />
                      {:else if $activeTab === 'acoes'}
                         <ActionsTab />
                      {:else if $activeTab === 'efeitos'}
                         <EffectsTab />
                      {:else if $activeTab === 'notas'}
                         <NotesTab />
                      {:else if $activeTab === 'magias'}
                         <SpellsTab />
                      {:else if $activeTab === 'talentos'}
                         <TalentsTab />
                      {:else if $activeTab === 'equipamento'}
                         <InventoryTab />
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
    <!-- Shared Modals & Utilities -->
    <DiceRollModal
        isOpen={$modalState.isOpen && $modalState.type === 'pre_roll'}
        title={$t('character.dice_roll.confirm_roll')}
        label={$modalState.data?.type === 'weapon_damage' ? $t('character.dice_roll.extra_dice') : $t('character.dice_roll.boons_banes')}
        rollLabel={$t('character.dice_roll.roll')}
        effects={isSotDL ? $sotdlActiveEffects : $activeEffects}
        onClose={() => modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }))}
        onRoll={(mod, selectedEffects, options) => {
            if (isSotDL) {
                // @ts-ignore - finalizeRoll exists on sotdlCharacterActions
                return sotdlCharacterActions.finalizeRoll(
                    $modalState.data,
                    mod,
                    selectedEffects.map(e => e.name),
                    options
                );
            } else {
                return characterActions.finalizeRoll(
                    $modalState.data,
                    mod,
                    selectedEffects,
                    options
                );
            }
        }}
    />

    <ItemEditor />
    <SpellEditor />
    <SpellEditorSotDL />
    <TalentEditor />
    <EffectEditor />
    <EffectEditorSotDL />
    <AttributeEditor />
    <StatEditor />
    <HealthDamageEditor />
    <CharacterInfoEditor />
    <CharacterInfoEditorSotDL />
    <ConfirmationModalContent />
    <GrimoireSelection />
    <GrimoireSelectionSotDL />
    <TalentSelection />
    <TalentSelectionSotDL />
    <TalentEditorSotDL />
    <ItemEditorSotDL />
    <AttackOptionsContent />
    <AttackOptionsContentSotDL />
    <AfflictionManager />
    <RestConfirmationContent />

    <HistorySidebar isOpen={$isHistoryOpen} onClose={() => isHistoryOpen.set(false)} />
</div>
```
