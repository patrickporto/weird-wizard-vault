<script lang="ts">
    import { uuidv7 } from 'uuidv7';
    import { t, locale } from 'svelte-i18n';
    import { get } from 'svelte/store';
    import { liveCharacters, liveEnemies, liveEncounters } from '$lib/stores/live';
    import { character, characterActions, isHistoryOpen } from '$lib/stores/characterStore';
    import { campaignsMap } from '$lib/db';
    import { resolve } from '$app/paths';
    import { Users, UserPlus, Ghost, GripVertical, Plus, Minus, Swords, RotateCcw, X, Clock, AlertTriangle, Dices, ChevronLeft, ChevronDown, ChevronUp, History, Layers, Play, Copy, QrCode, Check, Globe, Wifi, Trash2, Search, Library, PlusCircle, LayoutDashboard, Brain, Skull, Eye } from 'lucide-svelte';
    import DiceRollModal from '$lib/components/common/DiceRollModal.svelte';
    import CombatCard from './CombatCard.svelte';
    import HistorySidebar from '$lib/components/character/HistorySidebar.svelte';
    import ConfirmationModal from './ConfirmationModal.svelte';
    import { flip } from 'svelte/animate';
    import { calculateDiceRoll } from '$lib/logic/dice';
    import { onMount } from 'svelte';
    import { joinCampaignRoom, leaveCampaignRoom, syncCombat, syncCampaign, syncCharacter } from '$lib/logic/sync';
    import { broadcastCampaignUpdate } from '$lib/logic/tabSync';
    import type { InitiativeStyle, TierLevel } from '$lib/systems';
    import { DEFAULT_SYSTEM, getDefaultTier } from '$lib/systems';
    import { sortCombatants } from '$lib/logic/initiative';
    import CombatDifficultySotDL from './CombatDifficultySotDL.svelte';
    import CombatDifficultySofWW from './CombatDifficultySofWW.svelte';

    let { campaign } = $props<{ campaign: any }>();

    let isAddCharOpen = $state(false);
    let isQuickAddDrawerOpen = $state(false); // Mobile drawer for quick add
    let showCopyTooltip = $state(false);
    let showQrCode = $state(false);

    const defaultCombat = { active: false, round: 1 };

    // Quick Add Tab
    let activeQuickTab = $state<'enemies' | 'encounters'>('enemies');

    // End of Round Modal
    let isEoRModalOpen = $state(false);
    let endOfRoundEffects = $state<any[]>([]);

    // Confirm Modal
    let confirmState = $state({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    onMount(() => {
        if (campaign?.id) {
            joinCampaignRoom(campaign.id, true);
            // Set campaignId and GM name so rolls in this view are synced correctly
            const masterLabel = get(t)('common.labels.master');
            character.update(c => ({
                ...c,
                campaignId: campaign.id,
                name: campaign.gmName || masterLabel
            }));

            // Heartbeat for players to know GM is online
            const interval = setInterval(() => {
                const current = campaignsMap.get(campaign.id) || campaign;
                const masterLabelHeartbeat = get(t)('common.labels.master');
                syncCampaign(campaign.id, {
                    name: current.name,
                    gmName: current.gmName || masterLabelHeartbeat
                });
            }, 30000); // 30 seconds

            return () => {
                clearInterval(interval);
                leaveCampaignRoom();
                // Clear campaignId when leaving session view
                character.update(c => ({ ...c, campaignId: null }));
            };
        }
    });

    const inviteUrl = $derived(typeof window !== 'undefined' ? `${window.location.origin}${resolve('/campaigns/[id]/invite', { id: campaign?.id })}` : '');

    function copyInviteLink() {
        if (!inviteUrl) return;
        navigator.clipboard.writeText(inviteUrl);
        showCopyTooltip = true;
        setTimeout(() => { showCopyTooltip = false; }, 2000);
    }

    // Reactively extract data from prop
    let roster = $derived(campaign?.sessionRoster || []);
    let combat = $derived(campaign?.combat || defaultCombat);
    let activeEnemies = $derived(campaign?.activeEnemies || []);
    let campaignMembers = $derived(campaign?.members || []);
    let currentStyle = $derived<InitiativeStyle>(campaign?.initiativeStyle || 'dle');
    let tier = $derived<TierLevel>(campaign?.tier || getDefaultTier(campaign?.system));

    // Calculate total difficulty from active enemies
    let totalDifficulty = $derived(activeEnemies.reduce((sum, e) => sum + (e.difficulty || 0), 0));
    let playerCount = $derived(roster.length || 1);

    // Players present in the campaign - includes those in the session roster and anyone who joined via invite
    // IMPORTANT: Member data (synced via WebRTC) takes priority for real-time fields like health/damage
    // Players present in the campaign - includes those in the session roster and anyone who joined via invite
    // IMPORTANT: Member data (synced via WebRTC) takes priority for real-time fields like health/damage
    let allPlayers = $derived((() => {
        const allMemberIds = Array.from(new Set([...roster, ...campaignMembers.map(m => m.id)]));
        return allMemberIds.map(pid => {
            const local = $liveCharacters.find(c => c.id === pid);
            const member = campaignMembers.find(m => m.id === pid);

            // Merge: local provides base info, member data overrides with synced real-time values
            if (local && member) {
                return {
                    ...local,
                    ...member,
                    lastUpdate: member.lastUpdate
                };
            }
            if (local) return local;
            return member;
        }).filter(Boolean);
    })());

    let players = $derived(allPlayers.filter(p => !p.campaignApproval || p.campaignApproval === 'approved'));
    let pendingPlayers = $derived(allPlayers.filter(p => p.campaignApproval === 'pending'));

    // Available characters to manually add (local characters not already in roster/members AND same system)
    let availableCharacters = $derived($liveCharacters.filter(c =>
        !roster.includes(c.id) &&
        !campaignMembers.some(m => m.id === c.id) &&
        (c.system || DEFAULT_SYSTEM) === (campaign?.system || DEFAULT_SYSTEM)
    ));

    // Filtered Enemies & Encounters for Quick Add
    let filteredEnemies = $derived($liveEnemies.filter(e => {
        const sysMatch = (e.system || DEFAULT_SYSTEM) === (campaign?.system || DEFAULT_SYSTEM);
        // Enemies are available if they match system AND (belong to this campaign OR are global)
        const scopeMatch = e.campaignId === campaign?.id || e.global;
        return sysMatch && scopeMatch;
    }));

    let filteredEncounters = $derived($liveEncounters.filter(e => {
        const sysMatch = (e.system || DEFAULT_SYSTEM) === (campaign?.system || DEFAULT_SYSTEM);
        // Encounters available if system matches. For now, assuming encounters created within campaign context or generally available.
        // If we add global flag to encounters, use e.global
         const scopeMatch = true; // e.campaignId === campaign.id || e.global; // TODO: Add campaignId/global to encounters if not present
        return sysMatch && scopeMatch;
    }));

    // Helpers to update Campaign in DB - Using Map directly to avoid stale prop issues
    function updateCampaign(updates: any) {
        if (!campaign?.id) return;
        const current = campaignsMap.get(campaign.id) || campaign;
        const updated = { ...current, ...updates, lastUpdate: Date.now() };
        campaignsMap.set(campaign.id, updated);

        // Sync combat state if it changed
        if (updates.combat) {
            syncCombat(campaign.id, updates.combat);
        }

        // Sync campaign info if name or gmName changed
        if (updates.name || updates.gmName) {
            syncCampaign(campaign.id, { name: updated.name, gmName: updated.gmName });
        }

        // Broadcast to other tabs in same browser (for combat viewer window)
        broadcastCampaignUpdate(campaign.id, updated);
    }

    function toggleSessionPresence(charId: string) {
        if (roster.includes(charId)) {
            const newRoster = roster.filter(id => id !== charId);
            updateCampaign({ sessionRoster: newRoster });
        } else {
            const newRoster = [...roster, charId];
            updateCampaign({ sessionRoster: newRoster });
        }
    }

    function approvePlayer(charId: string) {
        updatePlayerInCampaign(charId, { campaignApproval: 'approved' });
        // Sync specifically to this player
        syncCharacter({ id: charId, campaignApproval: 'approved' });
    }

    function rejectPendingPlayer(charId: string) {
        // Send a clear command to the player so they don't stay "pending" forever
        syncCharacter({ id: charId, campaignApproval: 'rejected', campaignId: null });

        // Remove from our GM member list
        const current = campaignsMap.get(campaign.id) || campaign;
        const newMembers = (current.members || []).filter((m: any) => m.id !== charId);
        updateCampaign({ members: newMembers });
    }

    function removePlayerFromCampaign(charId: string) {
        const char = allPlayers.find(p => p.id === charId);
        confirmState = {
            isOpen: true,
            title: $t('session.players.remove_title'),
            message: $t('session.players.remove_message', { values: { name: char?.name || 'este personagem' } }),
            onConfirm: () => {
                const current = campaignsMap.get(campaign.id) || campaign;

                // Signal removal to the player so it clears from their sheet
                syncCharacter({ id: charId, campaignId: null });

                // Remove from session roster
                const newRoster = (current.sessionRoster || []).filter((id: string) => id !== charId);

                // Remove from members
                const newMembers = (current.members || []).filter((m: any) => m.id !== charId);

                // Remove from active combat
                const newEnemies = (current.activeEnemies || []).filter((e: any) => e.type !== 'player' || e.id !== charId);

                // Update campaign
                updateCampaign({
                    sessionRoster: newRoster,
                    members: newMembers,
                    activeEnemies: newEnemies
                });

                // Also update the character locally to remove campaignId if it's one of ours
                // NOTE: We can't easily force-update remote characters to plain "no campaign" without them syncing,
                // but removing them from the member list effectively kicks them out of sync updates.

                confirmState.isOpen = false;
            }
        };
    }

    function addToCombat(enemyTemplate: any) {
        const current = campaignsMap.get(campaign.id) || campaign;
        const currentEnemies = current.activeEnemies || [];

        const newEnemy = {
            ...enemyTemplate,
            instanceId: uuidv7(),
            damage: 0,
            currentHealth: enemyTemplate.health,
            afflictions: [],
            acted: false,
            initiative: false
        };

        updateCampaign({ activeEnemies: [...currentEnemies, newEnemy] });
    }

    function addToCombatEncounter(enc: any) {
        const current = campaignsMap.get(campaign.id) || campaign;
        const currentEnemies = current.activeEnemies || [];

        let newEnemies: any[] = [];
        enc.enemies.forEach((item: any) => {
             const template = $liveEnemies.find(e => e.id === item.enemyId);
             if (template) {
                for(let i=0; i<item.count; i++) {
                    newEnemies.push({
                        ...template,
                        instanceId: uuidv7(),
                        damage: 0,
                        currentHealth: template.health,
                        afflictions: [],
                        acted: false,
                        initiative: false
                    });
                }
             }
        });

        updateCampaign({ activeEnemies: [...currentEnemies, ...newEnemies] });
    }

    function startCombat() {
        updateCampaign({ combat: { active: true, round: 1 } });
        syncCombat(campaign.id, { active: true, round: 1 });
    }

    function nextRound() {
        // Check for End of Round effects
        const activeEffects = activeEnemies
            .filter(e => e.damage < (e.currentHealth ?? e.health) && e.endOfRound && e.endOfRound.length > 0)
            .map(e => ({ name: e.name, effects: e.endOfRound }));

        if (activeEffects.length > 0) {
            endOfRoundEffects = activeEffects;
            isEoRModalOpen = true;
            return; // Wait for confirmation
        }

        proceedRound();
    }

    function proceedRound() {
        const current = campaignsMap.get(campaign.id) || campaign;
        const nextRoundNum = (current.combat?.round || 1) + 1;
        const newEnemies = (current.activeEnemies || []).map(e => ({ ...e, acted: false }));

        updateCampaign({
            combat: { ...current.combat, round: nextRoundNum },
            activeEnemies: newEnemies
        });
        syncCombat(campaign.id, { active: true, round: nextRoundNum });
        isEoRModalOpen = false;
    }

    function endCombat(clearEnemies: boolean) {
        if (clearEnemies) {
            updateCampaign({ combat: { active: false, round: 1 }, activeEnemies: [] });
        } else {
            updateCampaign({ combat: { active: false, round: 1 } });
        }
        syncCombat(campaign.id, { active: false, round: 1 });
    }

    function removeFromCombat(instanceId: string) {
        const current = campaignsMap.get(campaign.id) || campaign;
        updateCampaign({
            activeEnemies: (current.activeEnemies || []).filter((e: any) => e.instanceId !== instanceId)
        });
    }

    function updateEnemy(instanceId: string, updates: any) {
        const current = campaignsMap.get(campaign.id) || campaign;
        updateCampaign({
            activeEnemies: (current.activeEnemies || []).map(e => e.instanceId === instanceId ? { ...e, ...updates } : e)
        });
    }

    function prevRound() {
        const current = campaignsMap.get(campaign.id) || campaign;
        const currentRound = current.combat?.round || 1;
        if (currentRound > 1) {
            updateCampaign({ combat: { ...current.combat, round: currentRound - 1 } });
        }
    }

    // Removed redundant quick roll and dice roll logic handled at campaign page level.

    let currentTime = $state(Date.now());
    onMount(() => {
        const int = setInterval(() => { currentTime = Date.now() }, 10000);
        return () => clearInterval(int);
    });

    // Explicit derivation of sorted combatants based on Initiative Style
    let sortedCombatants = $derived<any[]>((() => {
        // Players to show: ONLY those in roster
        const activePlayers = players.filter(p => roster.includes(p.id));

        return sortCombatants(currentStyle, activePlayers, activeEnemies);
    })());

    function isOnline(char: any) {
        if (!char.lastUpdate) return false;
        // If updated in the last 60 seconds. Use currentTime to force reactivity.
        return (currentTime - char.lastUpdate) < 60000;
    }
    function updatePlayerInCampaign(charId: string, updates: any) {
        const current = campaignsMap.get(campaign.id) || campaign;
        const members = current.members || [];
        const mIdx = members.findIndex(m => m.id === charId);

        let newMembers = members;
        if (mIdx !== -1) {
            newMembers = [...members];
            newMembers[mIdx] = { ...newMembers[mIdx], ...updates };
        }

        // Also update in activeEnemies if they are in combat
        const enemies = current.activeEnemies || [];
        const eIdx = enemies.findIndex(e => e.id === charId && e.type === 'player');
        let newEnemies = enemies;
        if (eIdx !== -1) {
            newEnemies = [...enemies];
            newEnemies[eIdx] = { ...newEnemies[eIdx], ...updates };
        }

        updateCampaign({ members: newMembers, activeEnemies: newEnemies });
    }

    // Drag & Drop
    function handleDragStart(e: DragEvent, item: any, type: 'enemy' | 'encounter') {
        if (!e.dataTransfer) return;
        e.dataTransfer.setData('application/json', JSON.stringify({ item, type }));
        e.dataTransfer.effectAllowed = 'copy';
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        return false;
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        const data = e.dataTransfer?.getData('application/json');
        if (data) {
            try {
                const { item, type } = JSON.parse(data);
                if (type === 'enemy') {
                    addToCombat(item);
                } else if (type === 'encounter') {
                    addToCombatEncounter(item);
                }
            } catch (err) {
                console.error("Drop error", err);
            }
        }
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full relative">
    <!-- Left Col -->
    <div class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
            <div class="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                 <h3 class="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} class="text-indigo-500"/>
                    {$t('session.players.title')}
                    {#if players.length > 0}
                        <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">{players.length}</span>
                    {/if}
                 </h3>
                 <button
                    onclick={() => isAddCharOpen = !isAddCharOpen}
                    class="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-md font-bold transition-all border border-slate-700 active:scale-95"
                >
                     {isAddCharOpen ? $t('session.players.close') : $t('session.players.add')}
                 </button>
            </div>

            {#if pendingPlayers.length > 0}
                <div class="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div class="flex items-center gap-2 px-1">
                        <div class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                        <span class="text-[10px] font-black text-amber-500 uppercase tracking-wider">{$t('session.players.waiting_approval')} ({pendingPlayers.length})</span>
                    </div>
                    {#each pendingPlayers as char (char.id)}
                        <div class="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-3 transition-all hover:bg-amber-500/10 shadow-sm">
                            <div class="flex-1">
                                <div class="font-bold text-sm text-amber-200 leading-none">{char.name}</div>
                                <div class="text-[9px] text-amber-500/60 font-medium mt-1 uppercase tracking-tighter">{$t('session.players.new_request')}</div>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button
                                    onclick={() => approvePlayer(char.id)}
                                    class="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white transition-all shadow-lg active:scale-90"
                                    title="Aprovar"
                                >
                                    <Check size={14}/>
                                </button>
                                <button
                                    onclick={() => rejectPendingPlayer(char.id)}
                                    class="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-90"
                                    title="Recusar"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    {/each}
                    <div class="h-px bg-slate-800/50 mx-2 my-2"></div>
                </div>
            {/if}

            <div class="space-y-2 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
            <!-- Removed inline list -->

                <div class="space-y-2">
                    {#each players as char (char.id)}
                        {@const online = isOnline(char)}
                        {@const inRoster = roster.includes(char.id)}
                        <div class="p-2.5 rounded-xl border flex items-center gap-3 transition-all {online ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-slate-900/50 border-slate-800'} {online || inRoster ? 'opacity-100' : 'opacity-40'} hover:border-indigo-500/40 group shadow-sm">
                            <div class="w-2 h-2 rounded-full {online ? 'bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-slate-700'}"></div>
                            <div class="flex-1">
                                 <div class="font-bold text-sm {online ? 'text-white' : 'text-slate-500'} group-hover:text-indigo-300 transition-colors">{char.name}</div>
                                 <div class="text-[10px] text-slate-500 font-medium">
                                    {#if inRoster}
                                        <span class="text-indigo-400 font-bold uppercase tracking-tighter mr-1">{$t('common.labels.session')}</span>
                                    {/if}
                                    {$t('common.labels.level')} {char.level} • {char.ancestry}
                                 </div>
                            </div>
                            <div class="flex items-center gap-1">
                                <button
                                    onclick={() => toggleSessionPresence(char.id)}
                                    class="p-1.5 rounded-lg transition-all {inRoster ? 'text-amber-400 hover:bg-amber-400/10' : 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10'}"
                                    title={inRoster ? $t('session.players.remove_from_session') : $t('session.players.add_to_session')}
                                >
                                    {#if inRoster}
                                        <Minus size={14}/>
                                    {:else}
                                        <Plus size={14}/>
                                    {/if}
                                </button>
                                <button onclick={() => removePlayerFromCampaign(char.id)} class="text-slate-600 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-all" title={$t('session.players.kick_from_campaign')}><Trash2 size={14}/></button>
                            </div>
                        </div>
                    {/each}
                    {#if players.length === 0}
                        <div class="text-xs text-slate-600 italic p-6 border-2 border-dashed border-slate-800 rounded-xl text-center">{$t('session.players.none')}</div>
                    {/if}
                </div>
            </div>

             <!-- Invitation Footer -->
             <div class="pt-4 border-t border-slate-800 space-y-3">
                  {#if !campaign?.isPublished}
                    <button
                        onclick={() => updateCampaign({ isPublished: true })}
                        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Globe size={14}/> {$t('session.publish.publish_session')}
                    </button>
                    <p class="text-[9px] text-slate-600 text-center font-bold uppercase tracking-tighter">{$t('session.publish.make_visible')}</p>
                  {:else}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                             <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Wifi size={10} class="animate-pulse"/> {$t('session.publish.public_session')}</span>
                        </div>
                        <button
                             onclick={() => showQrCode = !showQrCode}
                             class="text-slate-500 hover:text-white transition-colors p-1"
                             title={$t('session.publish.qr_code')}
                         >
                             <QrCode size={14} />
                         </button>
                    </div>

                    {#if showQrCode}
                        <div class="flex justify-center p-3 bg-white rounded-xl mb-2 animate-in zoom-in-95 duration-200 shadow-xl mx-auto w-32 h-32">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(inviteUrl)}`}
                                alt={$t('session.publish.qr_alt')}
                                class="w-24 h-24"
                            />
                        </div>
                    {/if}

                    <div class="relative group">
                        <div class="flex gap-1">
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                onclick={copyInviteLink}
                                class="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-400 font-mono truncate cursor-pointer hover:border-slate-700 transition-colors flex items-center"
                            >
                                {inviteUrl}
                            </div>
                            <button
                                onclick={copyInviteLink}
                                class="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-900/20 relative"
                                aria-label={$t('session.publish.copy_link')}
                            >
                                {#if showCopyTooltip}
                                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded shadow-lg animate-in fade-in slide-in-from-bottom-1 whitespace-nowrap">
                                        <Check size={10} class="inline mr-1" /> {$t('common.buttons.copied')}
                                    </div>
                                {/if}
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                    <button
                        onclick={() => updateCampaign({ isPublished: false })}
                        class="w-full text-[9px] text-slate-600 hover:text-red-400 font-bold uppercase tracking-widest transition-colors mt-1"
                    >
                        {$t('session.publish.remove_public')}
                    </button>
                  {/if}
             </div>
        </div>

        <!-- Quick Add Section (Desktop Only) -->
        <div class="hidden lg:flex flex-col h-[400px] bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-3 bg-slate-950 p-1 rounded-lg border border-slate-800">
                 <button onclick={() => activeQuickTab = 'enemies'} class="flex-1 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 transition-colors {activeQuickTab === 'enemies' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}"><Ghost size={14}/> {$t('session.enemies.title')}</button>
                 <button onclick={() => activeQuickTab = 'encounters'} class="flex-1 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 transition-colors {activeQuickTab === 'encounters' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}"><Layers size={14}/> {$t('session.enemies.encounters')}</button>
            </div>

            <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                {#if activeQuickTab === 'enemies'}
                    {#each filteredEnemies as enemy (enemy.id)}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 group hover:border-indigo-500/30 transition-all cursor-move hover:bg-slate-800/50"
                            draggable="true"
                            ondragstart={(e) => handleDragStart(e, enemy, 'enemy')}
                        >
                            <div class="truncate flex-1 flex items-center gap-2">
                                 <GripVertical size={12} class="text-slate-600 cursor-grab"/>
                                 <div class="min-w-0 flex-1">
                                     <div class="text-sm font-bold text-white truncate flex items-center gap-1">
                                        {enemy.name}
                                        {#if enemy.global}
                                            <Globe size={10} class="text-indigo-400" />
                                        {/if}
                                     </div>
                                     <div class="text-[10px] text-slate-500">{$t('session.enemies.difficulty')} {enemy.difficulty}</div>
                                 </div>
                            </div>
                            <button onclick={() => addToCombat(enemy)} class="text-slate-500 hover:text-indigo-400 p-1 ml-2 bg-slate-900 rounded border border-slate-800 hover:bg-slate-800"><Plus size={16}/></button>
                        </div>
                    {/each}
                    {#if filteredEnemies.length === 0}
                         <div class="text-center text-slate-600 italic text-xs mt-4">{$t('session.enemies.none')}</div>
                    {/if}
                {:else}
                    {#each filteredEncounters as enc (enc.id)}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 group hover:border-indigo-500/30 transition-all cursor-move hover:bg-slate-800/50"
                            draggable="true"
                            ondragstart={(e) => handleDragStart(e, enc, 'encounter')}
                        >
                            <div class="truncate flex-1">
                                 <div class="text-sm font-bold text-white truncate flex items-center gap-1">
                                    {enc.name}
                                    {#if enc.global}
                                        <Globe size={10} class="text-indigo-400" />
                                    {/if}
                                 </div>
                                 <div class="text-[10px] text-slate-500">{enc.enemies?.reduce((a,c) => a + c.count, 0) || 0} {$t('session.enemies.title')}</div>
                            </div>
                            <button onclick={() => addToCombatEncounter(enc)} class="text-slate-500 hover:text-indigo-400 p-1 ml-2 bg-slate-900 rounded border border-slate-800 hover:bg-slate-800"><Play size={14}/></button>
                        </div>
                    {/each}
                     {#if filteredEncounters.length === 0}
                         <div class="text-center text-slate-600 italic text-xs mt-4">{$t('session.enemies.no_encounters')}</div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>

     <!-- Center -->
     <div
        class="lg:col-span-2 space-y-4"
        ondragover={handleDragOver}
        ondrop={handleDrop}
        role="region"
        aria-label="Combat Zone"
     >
         <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
             <div class="flex items-center gap-4">
                {#if !combat.active}
                    <button onclick={startCombat} class="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"><Swords size={20}/> {$t('session.combat.start')}</button>
                {:else}
                    <div class="flex items-center gap-4">
                        <button onclick={prevRound} class="p-2 hover:bg-slate-700 rounded text-slate-400" title={$t('session.combat.previous')}><ChevronLeft size={20}/></button>
                        <div class="text-center"><div class="text-[10px] font-bold text-slate-500 uppercase">{$t('session.combat.round')}</div><div class="text-3xl font-mono font-bold text-white leading-none">{combat.round}</div></div>
                        <button onclick={nextRound} class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2" title={$t('session.combat.next')}><RotateCcw size={16}/> {$t('session.combat.next')}</button>
                        <div class="h-8 w-px bg-slate-700 mx-2"></div>
                        <button onclick={() => endCombat(false)} class="text-red-400 hover:text-red-300 text-xs font-bold px-3 py-2 border border-red-900/30 rounded bg-red-900/10">{$t('session.combat.end')}</button>
                    </div>
                {/if}
             </div>
        </div>

        <!-- Combat Difficulty (Mobile) -->
        {#if activeEnemies.length > 0}
            <div class="lg:hidden">
                {#if campaign?.system === 'sofdl'}
                    <CombatDifficultySotDL {tier} {totalDifficulty} />
                {:else}
                    <CombatDifficultySofWW {tier} {totalDifficulty} {playerCount} />
                {/if}
            </div>
        {/if}

        <div class="space-y-3 pb-20">
            {#each sortedCombatants as entity (entity.type === 'player' ? entity.id : entity.instanceId)}
                <div animate:flip={{duration: 300}}>
                   <CombatCard {entity} campaignId={campaign.id} {updateEnemy} {removeFromCombat} updatePlayer={updatePlayerInCampaign} />
                </div>
            {/each}
            {#if sortedCombatants.length === 0}
                <div class="text-center text-slate-500 italic py-10">{$t('session.combat.empty')}</div>
            {/if}
        </div>
    </div>

    <!-- Right -->
    <div class="hidden lg:flex flex-col gap-4">
        <!-- Combat Difficulty -->
        {#if activeEnemies.length > 0}
            {#if campaign?.system === 'sofdl'}
                <CombatDifficultySotDL {tier} {totalDifficulty} />
            {:else}
                <CombatDifficultySofWW {tier} {totalDifficulty} {playerCount} />
            {/if}
        {/if}
    </div>
</div>

{#if isEoRModalOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onclick={(e) => { if (e.target === e.currentTarget) isEoRModalOpen = false; }} role="button" aria-label="Fechar" tabindex="-1">
    <div class="bg-slate-800 rounded-xl w-full max-w-lg border border-slate-700 shadow-2xl p-6 relative" role="dialog" aria-modal="true">
        <div class="flex items-center gap-3 mb-6">
            <div class="p-3 bg-yellow-900/20 rounded-full border border-yellow-500/30 text-yellow-500">
                <Clock size={24} />
            </div>
            <div>
                 <h3 class="font-bold text-white text-xl">{$t('session.end_of_round.title')}</h3>
                 <p class="text-slate-400 text-sm">{$t('session.end_of_round.summary')}</p>
            </div>
        </div>

        <div class="space-y-4 mb-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
             {#each endOfRoundEffects as item}
                 <div class="bg-slate-900 border border-slate-700 rounded-lg p-4">
                      <h4 class="font-bold text-white mb-2 pb-2 border-b border-slate-800 flex items-center gap-2"><Ghost size={14} class="text-slate-500"/> {item.name}</h4>
                      <div class="space-y-2">
                           {#each item.effects as effect}
                                <div class="text-sm">
                                    <span class="font-bold text-yellow-500">{effect.name}:</span> <span class="text-slate-300">{effect.desc}</span>
                                </div>
                           {/each}
                      </div>
                 </div>
             {/each}
        </div>

        <div class="flex gap-3">
             <button onclick={() => isEoRModalOpen = false} class="flex-1 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm">{$t('common.buttons.cancel')}</button>
             <button onclick={proceedRound} class="flex-1 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm">{$t('session.end_of_round.advance')}</button>
        </div>
    </div>
</div>
{/if}

<!-- Removed redundant bottom menu and dice roll modal -->

{#if isAddCharOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onclick={(e) => { if (e.target === e.currentTarget) isAddCharOpen = false; }} role="button" aria-label="Fechar" tabindex="-1">
        <div class="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl p-6" role="dialog" aria-modal="true">
             <div class="flex justify-between items-center mb-6">
                 <div>
                     <h3 class="font-bold text-white text-lg">{$t('session.manage_session.title')}</h3>
                     <p class="text-xs text-slate-400">{$t('session.manage_session.description')}</p>
                 </div>
                 <button onclick={() => isAddCharOpen = false} class="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-white transition-colors"><X size={16}/></button>
             </div>

             <div class="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                 {#each availableCharacters as char}
                     <button onclick={() => toggleSessionPresence(char.id)} class="w-full text-left flex items-center gap-3 p-3 bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 rounded-xl group transition-all">
                         <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500 group-hover:text-indigo-400 border border-slate-700 group-hover:border-indigo-500/30">
                             {char.name.charAt(0)}
                         </div>
                         <div class="flex-1">
                             <div class="font-bold text-white group-hover:text-indigo-300">{char.name}</div>
                             <div class="text-[10px] text-slate-500">{$t('common.labels.level')} {char.level} • {char.ancestry}</div>
                         </div>
                         <div class="bg-slate-800 p-2 rounded-lg text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <Plus size={16} />
                         </div>
                     </button>
                 {/each}
                 {#if availableCharacters.length === 0}
                     <div class="text-center py-8">
                         <div class="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500">
                             <Ghost size={24} />
                         </div>
                         <p class="text-slate-500 text-sm font-bold">{$t('session.manage_session.no_available')}</p>
                         <p class="text-[10px] text-slate-600 mt-1">{$t('session.manage_session.all_in_session')}</p>
                     </div>
                 {/if}
             </div>
        </div>
    </div>
{/if}

 {#if isQuickAddDrawerOpen}
     <!-- svelte-ignore a11y_click_events_have_key_events -->
     <!-- svelte-ignore a11y_no_static_element_interactions -->
     <div class="fixed inset-0 z-50 flex justify-end bg-black/60" onclick={(e) => { if (e.target === e.currentTarget) isQuickAddDrawerOpen = false; }}>
         <div class="w-full max-w-[300px] h-full bg-slate-900 border-l border-slate-800 p-4 shadow-2xl animate-in slide-in-from-right duration-300">
              <div class="flex justify-between items-center mb-4">
                  <h3 class="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2"><Ghost size={16}/> {$t('session.enemies.title')}</h3>
                  <button onclick={() => isQuickAddDrawerOpen = false} class="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white"><X size={18}/></button>
              </div>

               <div class="flex items-center gap-2 mb-3 bg-slate-950 p-1 rounded-lg border border-slate-800">
                 <button onclick={() => activeQuickTab = 'enemies'} class="flex-1 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors {activeQuickTab === 'enemies' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}"><Ghost size={14}/> {$t('session.enemies.title')}</button>
                 <button onclick={() => activeQuickTab = 'encounters'} class="flex-1 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors {activeQuickTab === 'encounters' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}"><Layers size={14}/> {$t('session.enemies.encounters')}</button>
               </div>

                <div class="h-[calc(100%-100px)] overflow-y-auto custom-scrollbar space-y-2">
                {#if activeQuickTab === 'enemies'}
                    {#each filteredEnemies as enemy (enemy.id)}
                         <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 group active:border-indigo-500/50 transition-all">
                            <div class="truncate flex-1 flex flex-col">
                                 <div class="text-sm font-bold text-white truncate flex items-center gap-1">
                                    {enemy.name}
                                    {#if enemy.global}
                                        <Globe size={10} class="text-indigo-400" />
                                    {/if}
                                 </div>
                                 <div class="text-[10px] text-slate-500">{$t('session.enemies.difficulty')} {enemy.difficulty}</div>
                            </div>
                            <button onclick={() => { addToCombat(enemy); isQuickAddDrawerOpen = false; }} class="text-white hover:bg-indigo-600 p-2 bg-slate-800 rounded-lg border border-slate-700"><Plus size={16}/></button>
                        </div>
                    {/each}
                    {#if filteredEnemies.length === 0}
                         <div class="text-center text-slate-600 italic text-xs mt-4">{$t('session.enemies.none')}</div>
                    {/if}
                {:else}
                    {#each filteredEncounters as enc (enc.id)}
                        <div class="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 group active:border-indigo-500/50 transition-all">
                            <div class="truncate flex-1">
                                 <div class="text-sm font-bold text-white truncate flex items-center gap-1">
                                    {enc.name}
                                    {#if enc.global}
                                        <Globe size={10} class="text-indigo-400" />
                                    {/if}
                                 </div>
                                 <div class="text-[10px] text-slate-500">{enc.enemies?.reduce((a,c) => a + c.count, 0) || 0} {$t('session.enemies.title')}</div>
                            </div>
                            <button onclick={() => { addToCombatEncounter(enc); isQuickAddDrawerOpen = false; }} class="text-white hover:bg-indigo-600 p-2 bg-slate-800 rounded-lg border border-slate-700"><Play size={16}/></button>
                        </div>
                    {/each}
                     {#if filteredEncounters.length === 0}
                         <div class="text-center text-slate-600 italic text-xs mt-4">{$t('session.enemies.no_encounters')}</div>
                    {/if}
                {/if}
            </div>
         </div>
     </div>
 {/if}

 <!-- Mobile Quick Add Button -->
 <button
    onclick={() => isQuickAddDrawerOpen = true}
    class="lg:hidden fixed bottom-24 right-4 bg-slate-800 text-white p-3 rounded-full shadow-lg border border-slate-700 z-40 active:scale-90 transition-transform"
    aria-label="Add Enemy"
 >
    <Ghost size={24} />
 </button>

<HistorySidebar isOpen={$isHistoryOpen} onClose={() => isHistoryOpen.set(false)} />

<ConfirmationModal
    isOpen={confirmState.isOpen}
    title={confirmState.title}
    message={confirmState.message}
    onConfirm={confirmState.onConfirm}
    onCancel={() => confirmState.isOpen = false}
/>
