<script lang="ts">
    import { t, locale } from 'svelte-i18n';
    import { get } from 'svelte/store';
    import { liveCharacters, liveCampaigns } from '$lib/stores/live';
    import { uuidv7 } from 'uuidv7';
    import { charactersMap, campaignsMap, deletedIdsMap } from '$lib/db';
    import { goto } from '$app/navigation';
    import { resolve, base } from '$app/paths';
    import { Skull, Users, Scroll, Plus, Edit, Play, Trash2, Globe, Wifi, Settings, Gamepad2, Loader2 } from 'lucide-svelte';
    import { publicCampaigns } from '$lib/logic/sync';
    import ConfirmationModal from './ConfirmationModal.svelte';
    import CampaignModal from './CampaignModal.svelte';
    import CreateCampaignModal from './CreateCampaignModal.svelte';
    import CharacterModal from './CharacterModal.svelte';
    import CreateCharacterModal from './CreateCharacterModal.svelte';
    import CharacterSettingsModal from './CharacterSettingsModal.svelte';
    import { hashPassword } from '$lib/logic/crypto';
    import { initializeGoogleAuth, googleSession, syncFromCloud, syncToCloud } from '$lib/logic/googleDrive';
    import GoogleSignIn from '$lib/components/common/GoogleSignIn.svelte';
    import { onMount } from 'svelte';
    import { slide, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import SyncStatus from '$lib/components/common/SyncStatus.svelte';
    import { DEFAULT_SYSTEM, getSystem } from '$lib/systems';
    import AppSettingsModal from './AppSettingsModal.svelte';

    // Pull to Refresh State
    let pullStartY = $state(0);
    let pullDistance = $state(0);
    let isPulling = $state(false);
    let isRefreshing = $state(false);
    const PULL_THRESHOLD = 80;

    function handleTouchStart(e: TouchEvent) {
        if (window.scrollY === 0) {
            pullStartY = e.touches[0].clientY;
            isPulling = true;
        }
    }

    // Use passive: false to allow preventDefault
    function handleTouchMove(e: TouchEvent) {
        if (!isPulling) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - pullStartY;

        if (diff > 0 && window.scrollY <= 0) {
            pullDistance = Math.min(diff * 0.4, 120); // Resistance
            if (diff > 10) {
                 // Try to prevent native scroll if we are strictly pulling down from top
            }
        } else {
            isPulling = false;
            pullDistance = 0;
        }
    }

    async function handleTouchEnd() {
        if (!isPulling) return;
        isPulling = false;

        if (pullDistance > PULL_THRESHOLD) {
            isRefreshing = true;
            pullDistance = 60; // Snap
            try {
                if (navigator && navigator.vibrate) navigator.vibrate(50);
                await syncFromCloud();
            } finally {
                setTimeout(() => {
                    isRefreshing = false;
                    pullDistance = 0;
                }, 1000);
            }
        } else {
            pullDistance = 0;
        }
    }

    onMount(() => {
        initializeGoogleAuth();
        const storedLocale = localStorage.getItem('user_locale');
        if (storedLocale) {
            locale.set(storedLocale);
        }

        document.addEventListener('touchmove', handleTouchMove as any, { passive: false });
        return () => {
             document.removeEventListener('touchmove', handleTouchMove as any);
        };
    });

    let activeTab = $state('characters');
    let previousTab = $state('characters');
    let isAppSettingsOpen = $state(false);

    // Track tab changes for directional transitions
    $effect(() => {
        if (activeTab !== previousTab) {
            previousTab = activeTab;
        }
    });

    // Auto-Sync Effects
    $effect(() => {
        if ($googleSession.signedIn) {
            syncFromCloud();
        }
    });

    $effect(() => {
        if ($googleSession.signedIn) {
            // track dependencies
            $liveCharacters;
            $liveCampaigns;
            syncToCloud();
        }
    });

    // Character Settings Modal (for existing characters)
    let isCharSettingsOpen = $state(false);
    let settingsCharData = $state<any>(null);

    function openCharSettings(char: any) {
        settingsCharData = char;
        isCharSettingsOpen = true;
    }

    function saveCharSettings(updates: any) {
        if (!settingsCharData) return;
        const id = settingsCharData.id;
        const current = charactersMap.get(id) as any;
        const updated = {
            ...current,
            ...updates
        };



        charactersMap.set(id, updated);
        isCharSettingsOpen = false;
    }

    // Character Creation Modal
    let isCharModalOpen = $state(false);
    let isCreateCharModalOpen = $state(false);
    let charFormStr = $state("{}");

    const defaultCharForm = { name: '', playerName: '', ancestry: 'Human', novicePath: '', level: 0, defense: 8, health: 5, system: DEFAULT_SYSTEM };

    function openCharModal() {
        isCreateCharModalOpen = true;
    }

    async function saveCharacter(formData: any) {
        const id = formData.id || uuidv7();
        const existing = charactersMap.get(id) || {};
        let newChar: any;

        if (formData.system === 'sofdl') {
            newChar = {
                ...existing,
                id,
                system: 'sofdl',
                name: formData.name,
                playerName: formData.playerName || '',
                ancestry: formData.ancestry,
                level: formData.level,
                attributes: formData.attributes || existing.attributes || {
                    strength: 10,
                    agility: 10,
                    intellect: 10,
                    will: 10
                },
                perception: formData.perception || existing.perception || 10,
                defense: formData.defense || 10,
                health: formData.health || 10,
                healingRate: formData.healingRate || existing.healingRate || Math.floor((formData.health || 10) / 4),
                // Preserve other fields if editing
                size: existing.size || 1,
                speed: existing.speed || 10,
                power: existing.power || 0,
                damage: existing.damage || 0,
                insanity: existing.insanity || 0,
                corruption: existing.corruption || 0,
                description: existing.description || '',
                notes: existing.notes || '',
                paths: formData.paths || existing.paths || {
                    novice: formData.novicePath || '',
                    expert: '',
                    master: ''
                },
                professions: formData.professions || existing.professions || (formData.profession ? [formData.profession] : []),
                languages: existing.languages || ['Common'],
                talents: existing.talents || [],
                spells: existing.spells || [],
                equipment: existing.equipment || [],
                effects: existing.effects || []
            };
        } else {
             // Weird Wizard
            newChar = {
                ...existing,
                id,
                name: formData.name,
                playerName: formData.playerName || '',
                ancestry: formData.ancestry,
                level: formData.level,
                defense: formData.defense,
                system: formData.system || DEFAULT_SYSTEM,
                paths: formData.paths || existing.paths || {
                    novice: formData.novicePath || '-',
                    expert: '-',
                    master: '-'
                },
                attributes: existing.attributes || [
                    { name: $t('modals.mod_targets.str'), value: 10, key: "str" },
                    { name: $t('modals.mod_targets.agi'), value: 10, key: "agi" },
                    { name: $t('modals.mod_targets.int'), value: 10, key: "int" },
                    { name: $t('modals.mod_targets.wil'), value: 10, key: "wil" }
                ],
                speed: existing.speed || 5,
                health: formData.health,
                currentHealth: existing.currentHealth || formData.health,
                spells: existing.spells || [],
                talents: existing.talents || [],
                equipment: existing.equipment || [],
                afflictions: existing.afflictions || [],
                effects: existing.effects || [],
                currency: existing.currency || { gp: 0, sp: 0, cp: 0 },
                languages: existing.languages || ['Common']
            };

            // Add profession if new
            if (formData.profession && !newChar.professions?.includes(formData.profession)) {
                 newChar.professions = [...(newChar.professions || []), formData.profession];
            }
        }

        charactersMap.set(id, newChar);
        isCharModalOpen = false;
        isCreateCharModalOpen = false;
        goto(resolve('/characters/[id]', { id }));
    }

    // Campaign Modal
    let isCampModalOpen = $state(false);
    let isCreateCampModalOpen = $state(false);
    let editingCampId = $state<string | null>(null);
    let campFormStr = $state("{}");
    const defaultCampForm = { name: '', description: '', gmName: '', system: DEFAULT_SYSTEM };

    function openCampModal(camp: any = null) {
        if (camp) {
            editingCampId = camp.id;
            campFormStr = JSON.stringify(camp);
            isCampModalOpen = true;
        } else {
            isCreateCampModalOpen = true;
        }
    }

    async function saveCampaign(formData: any) {
        const id = editingCampId || uuidv7();
        const current = editingCampId ? (campaignsMap.get(id) as any) : {};

        const newCamp: any = {
            ...current,
            id,
            name: formData.name,
            description: formData.description,
            gmName: formData.gmName,
            players: current.players || [],
            backupEnabled: formData.backupEnabled || false,
            backupHash: formData.backupHash || '',
            system: formData.system || DEFAULT_SYSTEM
        };

        // Handle password updates
        if (formData.removePassword) {
            delete newCamp.passwordHash;
        } else if (formData.password) {
            newCamp.passwordHash = await hashPassword(formData.password);
        }



        campaignsMap.set(id, newCamp);
        isCampModalOpen = false;
        isCreateCampModalOpen = false;
    }

    // Confirm Dialog State
    let isConfirmOpen = $state(false);
    let confirmConfig = $state({ title: '', message: '', onConfirm: () => {} });

    function deleteCampaign(id: string) {
        confirmConfig = {
            title: $t('dashboard.campaigns.delete_title'),
            message: $t('dashboard.campaigns.delete_message'),
            onConfirm: () => {
                // Unpublish implicit by deletion (stops heartbeat), but we can also handle any other cleanup if needed
                console.log('[DEBUG] Deleting campaign with ID:', id);
                let findCount = 0;
                // Aggressive delete: check all keys to prevent key-mismatch leaks
                for (const key of campaignsMap.keys()) {
                    const camp = campaignsMap.get(key);
                    if (key === id || (camp && camp.id === id)) {
                        console.log('[DEBUG] Found match for deletion - Key:', key, 'Camp ID:', camp?.id);
                        campaignsMap.delete(key);
                        findCount++;
                    }
                }
                console.log('[DEBUG] Total entries deleted from map:', findCount);

                // Track deletion for sync
                deletedIdsMap.set(id, { type: 'campaign', deletedAt: Date.now() });
                console.log('[DEBUG] Deletion tracked in deletedIdsMap');
                syncToCloud();
                isConfirmOpen = false;
            }
        };
        isConfirmOpen = true;
    }

    function deleteCharacter(id: string) {
        confirmConfig = {
            title: $t('dashboard.characters.delete_title'),
            message: $t('dashboard.characters.delete_message'),
            onConfirm: () => {
                // REMOVE FROM LOCAL CAMPAIGNS
                // Check if this character is a member of any local campaign and remove them
                const campaigns = get(liveCampaigns);
                campaigns.forEach(camp => {
                    let changed = false;

                    // Remove from members
                    if (camp.members && camp.members.some((m: any) => m.id === id)) {
                        camp.members = camp.members.filter((m: any) => m.id !== id);
                        changed = true;
                    }

                    // Remove from session roster if present
                    if (camp.sessionRoster && camp.sessionRoster.includes(id)) {
                        camp.sessionRoster = camp.sessionRoster.filter((cid: string) => cid !== id);
                        changed = true;
                    }

                    // Remove from activeEnemies if it's there (rare for player chars but possible)
                    if (camp.activeEnemies && camp.activeEnemies.some((e: any) => e.id === id)) {
                        camp.activeEnemies = camp.activeEnemies.filter((e: any) => e.id !== id);
                        changed = true;
                    }

                    if (changed) {
                        campaignsMap.set(camp.id, camp);
                    }
                });

                console.log('[DEBUG] Deleting character with ID:', id);
                let findCount = 0;
                // Aggressive delete: check all keys to prevent key-mismatch leaks
                for (const key of charactersMap.keys()) {
                    const char = charactersMap.get(key);
                    if (key === id || (char && char.id === id)) {
                        console.log('[DEBUG] Found match for deletion - Key:', key, 'Char ID:', char?.id);
                        charactersMap.delete(key);
                        findCount++;
                    }
                }
                console.log('[DEBUG] Total entries deleted from map:', findCount);

                // Track deletion for sync
                deletedIdsMap.set(id, { type: 'character', deletedAt: Date.now() });
                console.log('[DEBUG] Deletion tracked in deletedIdsMap');
                syncToCloud();
                isConfirmOpen = false;
            }
        };
        isConfirmOpen = true;
    }





</script>

<svelte:window on:touchstart={handleTouchStart} on:touchmove={handleTouchMove} on:touchend={handleTouchEnd} />

<!-- Pull to Refresh Indicator -->
<div
    class="fixed top-0 left-0 w-full flex justify-center items-center pointer-events-none z-[100] transition-all duration-300"
    style="transform: translateY({isRefreshing ? 60 : pullDistance}px); opacity: {pullDistance > 0 ? 1 : 0}"
>
    <div class="bg-indigo-600 rounded-full p-2.5 shadow-xl border border-indigo-500/50 text-white">
        <Loader2 class={isRefreshing ? 'animate-spin' : ''} size={20} style="transform: rotate({pullDistance * 2}deg)" />
    </div>
</div>

<div class="animate-in fade-in px-4 md:px-8 max-w-7xl mx-auto pb-32 md:pb-20">
    <!-- Header -->
    <header class="mb-8 flex justify-between items-center border-b border-slate-800/50 pt-4 md:pt-8 pb-4 sticky top-0 bg-slate-950/80 backdrop-blur-md z-40 -mx-4 px-4 md:-mx-8 md:px-8 transition-all">
       <!-- Logo Area -->
        <div class="flex items-center gap-3">
          <img src="{base}/logo-black.webp" alt="Schwalb Vault Logo" class="h-10 md:h-14 w-auto rounded-xl" />
          <h1 class="text-xl md:text-3xl font-bold text-white flex items-center gap-2 text-gradient m-0 leading-none">
            <span class="hidden md:inline">Schwalb Vault</span>
            <span class="md:hidden">Schwalb Vault</span>
          </h1>
        </div>

       <!-- Desktop Navigation (Centered) -->
       <div class="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 glass shadow-xl backdrop-blur-md">
           <div class="relative flex">
               <!-- Sliding indicator background -->
               <div
                   class="absolute inset-y-0 w-1/2 bg-indigo-600 rounded-xl transition-transform duration-300 ease-out shadow-lg shadow-indigo-500/20"
                   style="transform: translateX({activeTab === 'campaigns' ? '100%' : '0%'})"
               ></div>

               <button
                   onclick={() => activeTab = 'characters'}
                   class="relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 {activeTab === 'characters' ? 'text-white' : 'text-slate-400 hover:text-white'}"
               >
                   <Users size={18}/> {$t('dashboard.tabs.characters')}
               </button>
               <button
                   onclick={() => activeTab = 'campaigns'}
                   class="relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 {activeTab === 'campaigns' ? 'text-white' : 'text-slate-400 hover:text-white'}"
               >
                   <Scroll size={18}/> {$t('dashboard.tabs.campaigns')}
               </button>
           </div>
       </div>

        <!-- User Area -->
        <div class="flex items-center justify-end min-w-[40px] gap-3">
          <SyncStatus />

          <button
              class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              onclick={() => isAppSettingsOpen = true}
              title={$t('settings.title')}
          >
              <Settings size={20} />
          </button>

          <GoogleSignIn />
        </div>
    </header>

    <!-- Mobile Bottom Navigation -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 shadow-2xl rounded-t-2xl z-50 p-2 pb-safe">
        <div class="relative flex justify-between">
            <!-- Sliding indicator background -->
            <div
                class="absolute inset-y-0 w-1/2 bg-indigo-600/20 rounded-xl transition-transform duration-300 ease-out"
                style="transform: translateX({activeTab === 'campaigns' ? '100%' : '0%'})"
            ></div>

            <button
                onclick={() => activeTab = 'characters'}
                class="relative flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 z-10 {activeTab === 'characters' ? 'text-indigo-400' : 'text-slate-500'}"
            >
                <Users size={20} strokeWidth={activeTab === 'characters' ? 2.5 : 2} class="transition-all duration-300"/>
                <span class="transition-all duration-300">{$t('dashboard.tabs.characters')}</span>
            </button>

            <button
                onclick={() => activeTab = 'campaigns'}
                class="relative flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 z-10 {activeTab === 'campaigns' ? 'text-indigo-400' : 'text-slate-500'}"
            >
                <Scroll size={20} strokeWidth={activeTab === 'campaigns' ? 2.5 : 2} class="transition-all duration-300"/>
                <span class="transition-all duration-300">{$t('dashboard.tabs.campaigns')}</span>
            </button>
        </div>
    </div>

   <div class="min-h-[500px] grid items-start relative">
       {#if activeTab === 'characters'}
         <div
            in:fly={{ x: -100, duration: 300, easing: quintOut }}
            out:fly={{ x: -100, duration: 300, easing: quintOut }}
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 col-start-1 row-start-1 w-full"
         >
            {#each $liveCharacters as char (char.id)}
               <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/40 transition-all relative group flex flex-col shadow-lg hover:shadow-indigo-500/10 border-t-white/5">
                  <div class="flex justify-between items-start mb-4">
                     <div class="flex-1">
                        <h3 class="font-black text-xl text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate pr-16">{char.name}</h3>
                        <div class="flex items-center gap-2 mt-1 flex-wrap">
                            <span class="text-[10px] bg-indigo-500/10 text-indigo-400 font-black px-2 py-0.5 rounded uppercase tracking-wider">{$t(`ancestries.${char.system === 'sofdl' ? 'sofdl' : 'sofww'}.${(char.ancestry || 'Human').toLowerCase()}`)}</span>
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{$t('common.labels.level')} {char.level}</span>
                            {#if char.playerName}
                                <span class="text-[10px] text-slate-400 font-medium">• {char.playerName}</span>
                            {/if}
                        </div>
                         <div class="mt-2 flex items-center gap-2">
                             <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400 border border-slate-700 font-bold uppercase tracking-wider">
                                 <Gamepad2 size={10} /> {$t(getSystem(char.system).nameKey)}
                             </div>
                         </div>
                     </div>
                     <div class="flex items-center gap-1">
                        <button
                            onclick={() => openCharSettings(char)}
                            class="text-slate-700 hover:text-indigo-400 p-2 rounded-xl hover:bg-indigo-400/5 transition-all opacity-40 group-hover:opacity-100"
                            title={$t('common.buttons.settings')}
                        >
                            <Settings size={16}/>
                        </button>
                        <button
                            onclick={() => deleteCharacter(char.id)}
                            class="text-slate-700 hover:text-red-400 p-2 rounded-xl hover:bg-red-400/5 transition-all opacity-40 group-hover:opacity-100"
                            title={$t('common.buttons.delete')}
                        >
                            <Trash2 size={16}/>
                        </button>
                     </div>
                  </div>

                  <div class="space-y-3 mb-6">
                      <div class="flex items-center justify-between text-xs text-slate-400">
                          <span class="flex items-center gap-1.5 opacity-60"><Scroll size={12}/> {$t('dashboard.characters.paths')}</span>
                          <span class="font-bold text-slate-300 truncate max-w-[150px]">{char.paths?.novice || "-"}</span>
                      </div>
                  </div>

                  <button
                    onclick={() => goto(resolve('/characters/[id]', { id: char.id }))}
                    class="w-full bg-slate-800 hover:bg-indigo-600 text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] border border-slate-700 hover:border-indigo-400/30 flex items-center justify-center gap-2"
                  >
                    {$t('dashboard.characters.open_sheet')} <Play size={14} fill="currentColor" />
                  </button>
               </div>
            {/each}

            <button
                onclick={() => openCharModal()}
                class="h-full min-h-[160px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all hover:bg-indigo-500/5 gap-2 group shadow-sm bg-slate-900/20"
            >
                <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:scale-110 transition-all">
                    <Plus size={32} />
                </div>
                <span class="font-bold">{$t('dashboard.characters.new_character')}</span>
            </button>
         </div>

       {:else}
         <div
            in:fly={{ x: 100, duration: 300, easing: quintOut }}
            out:fly={{ x: 100, duration: 300, easing: quintOut }}
            class="space-y-8 col-start-1 row-start-1 w-full"
         >
             <!-- Minhas Campanhas -->
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {#each $liveCampaigns as camp (camp.id)}
                    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/40 transition-all group relative flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10 border-t-white/5">
                       <div class="mb-4">
                          <div class="flex justify-between items-start mb-1">
                              <h3 class="font-black text-2xl text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{camp.name}</h3>
                              <div class="flex items-center gap-1">
                                  {#if camp.isPublished}
                                      <span class="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest flex items-center gap-1">
                                          <Globe size={10}/> {$t('dashboard.campaigns.published')}
                                      </span>
                                  {/if}
                                  <button
                                      onclick={() => openCampModal(camp)}
                                      class="text-slate-700 hover:text-indigo-400 p-2 rounded-xl hover:bg-indigo-400/5 transition-all opacity-40 group-hover:opacity-100"
                                      title={$t('common.buttons.edit')}
                                  >
                                      <Edit size={16}/>
                                  </button>
                                  <button
                                      onclick={() => deleteCampaign(camp.id)}
                                      class="text-slate-700 hover:text-red-400 p-2 rounded-xl hover:bg-red-400/5 transition-all opacity-40 group-hover:opacity-100"
                                      title={$t('common.buttons.delete')}
                                  >
                                      <Trash2 size={16}/>
                                  </button>
                              </div>
                          </div>
                           <p class="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{camp.gmName || $t('common.labels.master')}</p>
                           <div class="mb-3">
                                <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400 border border-slate-700 font-bold uppercase tracking-wider">
                                    <Gamepad2 size={10} /> {$t(getSystem(camp.system || DEFAULT_SYSTEM).nameKey)}
                                </div>
                           </div>
                           <p class="text-sm text-slate-400 line-clamp-2 leading-relaxed h-10">{camp.description || $t('dashboard.campaigns.no_description')}</p>
                       </div>

                       <button
                           onclick={() => goto(resolve('/campaigns/[id]', { id: camp.id }))}
                           class="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border border-indigo-400/20 shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98]"
                       >
                           <Play size={18} fill="currentColor"/> {$t('dashboard.campaigns.start_session')}
                       </button>
                    </div>
                 {/each}

                 <button
                    onclick={() => openCampModal()}
                    class="h-full min-h-[160px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all hover:bg-indigo-500/5 gap-2 group shadow-sm bg-slate-900/20"
                >
                    <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:scale-110 transition-all">
                        <Plus size={32} />
                    </div>
                    <span class="font-bold">{$t('dashboard.campaigns.new_campaign')}</span>
                </button>
             </div>

             <!-- Campanhas Públicas -->
             <div>
                 <div class="flex items-center gap-3 mb-4">
                     <div class="h-px flex-1 bg-slate-800"></div>
                     <h3 class="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                         <Globe size={14}/> {$t('dashboard.campaigns.public_campaigns')}
                     </h3>
                     <div class="h-px flex-1 bg-slate-800"></div>
                 </div>

                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {#each $publicCampaigns as camp (camp.id)}
                        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 transition-all group relative flex flex-col justify-between shadow-xl border-t-white/5">
                           <div>
                              <h3 class="font-black text-2xl text-white group-hover:text-emerald-400 mb-2 uppercase tracking-tight">{camp.name}</h3>
                              <div class="flex items-center gap-2 mb-4">
                                   <div class="px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 font-black uppercase tracking-widest">{camp.gmName || $t('common.labels.master')}</div>
                                   <div class="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded text-[9px] text-emerald-400 font-black uppercase tracking-wider">
                                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        {$t('dashboard.campaigns.online')}
                                   </div>
                              </div>
                              <div class="mb-4">
                                   <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/50 text-[9px] text-slate-400 border border-slate-700/50 font-bold uppercase tracking-wider">
                                       <Gamepad2 size={10} /> {$t(getSystem(camp.system || DEFAULT_SYSTEM).nameKey)}
                                   </div>
                              </div>
                              <p class="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-6 h-15">{camp.description || $t('dashboard.campaigns.public_description')}</p>
                           </div>
                           <button
                                onclick={() => goto(resolve('/campaigns/[id]/invite', { id: camp.id }))}
                                class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-black uppercase text-xs tracking-[0.1em] flex items-center justify-center gap-2 border border-emerald-400/20 transition-all active:scale-[0.98] group"
                            >
                                {$t('dashboard.campaigns.join_adventure')} <Plus size={18} class="group-hover:rotate-90 transition-transform"/>
                            </button>
                        </div>
                     {/each}

                     {#if $publicCampaigns.length === 0}
                        <div class="col-span-full py-12 flex flex-col items-center text-center opacity-40">
                             <div class="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600 mb-3 border border-slate-700 border-dashed">
                                  <Wifi size={32} />
                             </div>
                             <h3 class="text-lg font-black uppercase tracking-widest text-slate-500">{$t('dashboard.campaigns.no_online_campaigns')}</h3>
                             <p class="text-slate-600 max-w-sm mt-2 text-sm">{$t('dashboard.campaigns.no_online_description')}</p>
                        </div>
                     {/if}
                 </div>
             </div>
         </div>

       {/if}
   </div>

    <CreateCharacterModal isOpen={isCreateCharModalOpen} onClose={() => isCreateCharModalOpen = false} onSave={saveCharacter} />
    <CreateCampaignModal isOpen={isCreateCampModalOpen} onClose={() => isCreateCampModalOpen = false} onSave={saveCampaign} />

   <CharacterModal isOpen={isCharModalOpen} initialData={charFormStr} onClose={() => isCharModalOpen = false} onSave={saveCharacter} />
   <CampaignModal isOpen={isCampModalOpen} initialData={campFormStr} onClose={() => isCampModalOpen = false} onSave={saveCampaign} />
   <ConfirmationModal isOpen={isConfirmOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onCancel={() => isConfirmOpen = false} />

   <CharacterSettingsModal isOpen={isCharSettingsOpen} characterData={settingsCharData} onClose={() => isCharSettingsOpen = false} onSave={saveCharSettings} />
   <AppSettingsModal isOpen={isAppSettingsOpen} onClose={() => isAppSettingsOpen = false} />

</div>
