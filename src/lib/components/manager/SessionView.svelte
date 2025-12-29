<script lang="ts">
    import { liveCharacters, liveEnemies, liveEncounters } from '$lib/stores/live';
    import { characterActions, isHistoryOpen } from '$lib/stores/characterStore';
    import { campaignsMap } from '$lib/db';
    import { Users, UserPlus, Ghost, GripVertical, Plus, Minus, Swords, RotateCcw, X, Clock, AlertTriangle, Dices, ChevronLeft, ChevronDown, ChevronUp, History, Layers, Play, Copy, QrCode, Check, Globe, Wifi } from 'lucide-svelte';
    import CombatCard from './CombatCard.svelte';
    import HistorySidebar from '$lib/components/character/HistorySidebar.svelte';
    import ConfirmationModal from './ConfirmationModal.svelte';
    import { flip } from 'svelte/animate';
    import { calculateDiceRoll } from '$lib/logic/dice';
import { onMount } from 'svelte';
import { joinCampaignRoom, syncCombat, syncCampaign } from '$lib/logic/sync';

    let { campaign } = $props<{ campaign: any }>();

    let isAddCharOpen = $state(false);
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

            // Heartbeat for players to know GM is online
            const interval = setInterval(() => {
                const current = campaignsMap.get(campaign.id) || campaign;
                syncCampaign(campaign.id, { 
                    name: current.name, 
                    gmName: current.gmName || 'Mestre' 
                });
            }, 30000); // 30 seconds
            
            return () => {
                clearInterval(interval);
            };
        }
    });

    const inviteUrl = $derived(typeof window !== 'undefined' ? `${window.location.origin}/campaign/${campaign?.id}/invite` : '');

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
    
    // Players present in the campaign - includes those in the session roster and anyone who joined via invite
    let players = $derived((() => {
        const allMemberIds = Array.from(new Set([...roster, ...campaignMembers.map(m => m.id)]));
        return allMemberIds.map(pid => {
            const local = $liveCharacters.find(c => c.id === pid);
            if (local) return local;
            return campaignMembers.find(m => m.id === pid);
        }).filter(Boolean);
    })());
    
    // Available characters to manually add (local characters not already in roster/members)
    let availableCharacters = $derived($liveCharacters.filter(c => !roster.includes(c.id) && !campaignMembers.some(m => m.id === c.id)));

    // Helpers to update Campaign in DB - Using Map directly to avoid stale prop issues
    function updateCampaign(updates: any) {
        if (!campaign?.id) return;
        const current = campaignsMap.get(campaign.id) || campaign;
        const updated = { ...current, ...updates };
        campaignsMap.set(campaign.id, updated);

        // Sync combat state if it changed
        if (updates.combat) {
            syncCombat(campaign.id, updates.combat);
        }

        // Sync campaign info if name or gmName changed
        if (updates.name || updates.gmName) {
            syncCampaign(campaign.id, { name: updated.name, gmName: updated.gmName });
        }
    }

    function toggleSessionPresence(charId: string) {
        if (roster.includes(charId)) {
            const char = $liveCharacters.find(c => c.id === charId);
            confirmState = {
                isOpen: true,
                title: 'Retirar Personagem',
                message: `Tem certeza que deseja retirar ${char?.name || 'este personagem'} da sessão atual?`,
                onConfirm: () => {
                    const newRoster = roster.filter(id => id !== charId);
                    updateCampaign({ sessionRoster: newRoster });
                    confirmState.isOpen = false;
                }
            };
        } else {
            const newRoster = [...roster, charId];
            updateCampaign({ sessionRoster: newRoster });
        }
    }

    function addToCombat(enemyTemplate: any) {
        const current = campaignsMap.get(campaign.id) || campaign;
        const currentEnemies = current.activeEnemies || [];
        
        const newEnemy = {
            ...enemyTemplate,
            instanceId: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
                        instanceId: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
        const enemy = activeEnemies.find(e => e.instanceId === instanceId);
        confirmState = {
            isOpen: true,
            title: 'Remover do Combate',
            message: `Tem certeza que deseja remover ${enemy?.name || 'este inimigo'} do combate?`,
            onConfirm: () => {
                const current = campaignsMap.get(campaign.id) || campaign;
                updateCampaign({ 
                    activeEnemies: (current.activeEnemies || []).filter(e => e.instanceId !== instanceId) 
                });
                confirmState.isOpen = false;
            }
        };
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

    // Quick Roll State
    let quickRollState = $state({ isOpen: false, sides: 20, count: 1, modifier: 0 });
    
    function startQuickRoll(sides: number, count = 1) {
        quickRollState = { isOpen: true, sides, count, modifier: 0 };
    }

    function confirmQuickRoll() {
        rollDice(quickRollState.sides, quickRollState.count, quickRollState.modifier);
        quickRollState.isOpen = false;
    }

    // Dice
    function rollDice(sides: number, count = 1, modifier = 0) {
        const res = calculateDiceRoll(sides, count, modifier);
        
        let desc = "";
        if (count > 1) desc += `Dados: [${res.results.join(', ')}] `;
        if (res.bonusRolls?.length > 0) desc += `Bonus Rolls: [${res.bonusRolls.join(', ')}] -> ${Math.abs(res.modifierTotal)}`;
        
        characterActions.addToHistory({
            source: 'GM',
            charName: 'Mestre',
            name: `${count}d${sides} ${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
            description: desc.trim() || null,
            total: res.total,
            formula: res.formula,
            crit: res.crit
        });
        isHistoryOpen.set(true); 
    }

    let currentTime = $state(Date.now());
    onMount(() => {
        const int = setInterval(() => { currentTime = Date.now() }, 10000);
        return () => clearInterval(int);
    });

    // Explicit derivation of sorted combatants
    let sortedCombatants = $derived<any[]>((() => {
        // Players to show: those in roster OR those online
        const activePlayers = players.filter(p => roster.includes(p.id) || isOnline(p));

        const playersWithInit = activePlayers.filter(c => c && c.initiative).map(c => ({...c, type: 'player'}));
        const enemies = activeEnemies.map(e => ({...e, type: 'enemy'}));
        const playersNoInit = activePlayers.filter(c => c && !c.initiative).map(c => ({...c, type: 'player'}));
        
        const all = [...playersWithInit, ...enemies, ...playersNoInit];
        
        const seen = new Set();
        return all.filter(entity => {
            if (!entity) return false;
            const key = entity.type === 'player' ? entity.id : entity.instanceId;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
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
</script>

<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full relative">
    <!-- Left Col -->
    <div class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
            <div class="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                 <h3 class="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Users size={14} class="text-indigo-500"/> Personagens</h3>
                 <button 
                    onclick={() => isAddCharOpen = !isAddCharOpen} 
                    class="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-md font-bold transition-all border border-slate-700 active:scale-95"
                >
                     {isAddCharOpen ? 'Fechar' : 'Gerenciar'}
                 </button>
            </div>
            
            <div class="space-y-2 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                {#if isAddCharOpen}
                    <div class="p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/20 mb-2 animate-in slide-in-from-top-2">
                         <h4 class="text-[9px] uppercase font-black text-indigo-400 mb-2 tracking-tighter text-center">Disponíveis para Adicionar</h4>
                         <div class="space-y-1">
                             {#each availableCharacters as char}
                                 <button onclick={() => toggleSessionPresence(char.id)} class="w-full text-left flex items-center justify-between p-2 hover:bg-indigo-500/10 rounded-lg group transition-colors">
                                     <span class="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{char.name}</span>
                                     <Plus size={14} class="text-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"/>
                                 </button>
                             {/each}
                             {#if availableCharacters.length === 0}
                                 <div class="text-[10px] text-slate-600 italic text-center py-2">Nenhum personagem disponível.</div>
                             {/if}
                         </div>
                    </div>
                {/if}

                <div class="space-y-2">
                    {#each players as char (char.id)}
                        {@const online = isOnline(char)}
                        <div class="p-2.5 rounded-xl border flex items-center gap-3 transition-all {online ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-slate-900/50 border-slate-800 opacity-60'} hover:border-indigo-500/40 group shadow-sm">
                            <div class="w-2 h-2 rounded-full {online ? 'bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-slate-700'}"></div>
                            <div class="flex-1">
                                 <div class="font-bold text-sm {online ? 'text-white' : 'text-slate-500'} group-hover:text-indigo-300 transition-colors">{char.name}</div>
                                 <div class="text-[10px] text-slate-500 font-medium">Lvl {char.level} • {char.ancestry}</div>
                            </div>
                            <button onclick={() => toggleSessionPresence(char.id)} class="text-slate-600 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-all" title="Remover da Sessão"><X size={14}/></button>
                        </div>
                    {/each}
                    {#if players.length === 0}
                        <div class="text-xs text-slate-600 italic p-6 border-2 border-dashed border-slate-800 rounded-xl text-center">Nenhum jogador na sessão.</div>
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
                        <Globe size={14}/> Publicar Sessão
                    </button>
                    <p class="text-[9px] text-slate-600 text-center font-bold uppercase tracking-tighter">Torne sua sessão visível e obtenha o link de convite</p>
                  {:else}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                             <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Wifi size={10} class="animate-pulse"/> Sessão Pública</span>
                        </div>
                        <button 
                             onclick={() => showQrCode = !showQrCode} 
                             class="text-slate-500 hover:text-white transition-colors p-1"
                             title="Ver QR Code"
                         >
                             <QrCode size={14} />
                         </button>
                    </div>
                  
                    {#if showQrCode}
                        <div class="flex justify-center p-3 bg-white rounded-xl mb-2 animate-in zoom-in-95 duration-200 shadow-xl mx-auto w-32 h-32">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(inviteUrl)}`} 
                                alt="QR Code de Convite"
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
                                aria-label="Copiar link"
                            >
                                {#if showCopyTooltip}
                                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded shadow-lg animate-in fade-in slide-in-from-bottom-1 whitespace-nowrap">
                                        <Check size={10} class="inline mr-1" /> Copiado!
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
                        Retirar de área pública
                    </button>
                  {/if}
             </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[400px]">
            <div class="flex items-center gap-2 mb-3 bg-slate-950 p-1 rounded-lg border border-slate-800">
                 <button onclick={() => activeQuickTab = 'enemies'} class="flex-1 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 transition-colors {activeQuickTab === 'enemies' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}"><Ghost size={14}/> Inimigos</button>
                 <button onclick={() => activeQuickTab = 'encounters'} class="flex-1 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 transition-colors {activeQuickTab === 'encounters' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}"><Layers size={14}/> Encontros</button>
            </div>

            <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                {#if activeQuickTab === 'enemies'}
                    {#each $liveEnemies as enemy (enemy.id)}
                        <div class="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 group hover:border-indigo-500/30 transition-all">
                            <div class="truncate flex-1 flex items-center gap-2">
                                 <!-- Draggable hint -->
                                 <GripVertical size={12} class="text-slate-600 cursor-grab"/>
                                 <div>
                                     <div class="text-sm font-bold text-white truncate">{enemy.name}</div>
                                     <div class="text-[10px] text-slate-500">Dif {enemy.difficulty}</div>
                                 </div>
                            </div>
                            <button onclick={() => addToCombat(enemy)} class="text-slate-500 hover:text-indigo-400 p-1 ml-2 bg-slate-900 rounded border border-slate-800"><Plus size={16}/></button>
                        </div>
                    {/each}
                    {#if $liveEnemies.length === 0}
                         <div class="text-center text-slate-600 italic text-xs mt-4">Nenhum inimigo.</div>
                    {/if}
                {:else}
                    {#each $liveEncounters as enc (enc.id)}
                        <div class="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 group hover:border-indigo-500/30 transition-all">
                            <div class="truncate flex-1">
                                 <div class="text-sm font-bold text-white truncate">{enc.name}</div>
                                 <div class="text-[10px] text-slate-500">{enc.enemies?.reduce((a,c) => a + c.count, 0) || 0} Inimigos</div>
                            </div>
                            <button onclick={() => addToCombatEncounter(enc)} class="text-slate-500 hover:text-indigo-400 p-1 ml-2 bg-slate-900 rounded border border-slate-800"><Play size={14}/></button>
                        </div>
                    {/each}
                     {#if $liveEncounters.length === 0}
                         <div class="text-center text-slate-600 italic text-xs mt-4">Nenhum encontro.</div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>

    <!-- Center -->
    <div class="lg:col-span-2 space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
             <div class="flex items-center gap-4">
                {#if !combat.active}
                    <button onclick={startCombat} class="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"><Swords size={20}/> INICIAR COMBATE</button>
                {:else}
                    <div class="flex items-center gap-4">
                        <button onclick={prevRound} class="p-2 hover:bg-slate-700 rounded text-slate-400" title="Voltar Rodada"><ChevronLeft size={20}/></button>
                        <div class="text-center"><div class="text-[10px] font-bold text-slate-500 uppercase">Rodada</div><div class="text-3xl font-mono font-bold text-white leading-none">{combat.round}</div></div>
                        <button onclick={nextRound} class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2" title="Próxima Rodada"><RotateCcw size={16}/> Próxima</button>
                        <div class="h-8 w-px bg-slate-700 mx-2"></div>
                        <button onclick={() => endCombat(false)} class="text-red-400 hover:text-red-300 text-xs font-bold px-3 py-2 border border-red-900/30 rounded bg-red-900/10">Encerrar</button>
                    </div>
                {/if}
             </div>
        </div>
        
        <div class="space-y-3 pb-20">
            {#each sortedCombatants as entity (entity.type === 'player' ? entity.id : entity.instanceId)}
                <div animate:flip={{duration: 300}}>
                   <CombatCard {entity} {updateEnemy} {removeFromCombat} updatePlayer={updatePlayerInCampaign} />
                </div>
            {/each}
            {#if sortedCombatants.length === 0}
                <div class="text-center text-slate-500 italic py-10">Combate vazio.</div>
            {/if}
        </div>
    </div>

    <!-- Right -->
    <div class="hidden lg:flex flex-col gap-4">
        <!-- Sidebar Empty or Other Widgets -->
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
                 <h3 class="font-bold text-white text-xl">Fim da Rodada</h3>
                 <p class="text-slate-400 text-sm">Resumo dos efeitos que ocorrem agora.</p>
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
             <button onclick={() => isEoRModalOpen = false} class="flex-1 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm">Cancelar</button>
             <button onclick={proceedRound} class="flex-1 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm">Avançar Rodada</button>
        </div>
    </div>
</div>
{/if}

<!-- Bottom Bar (Quick Rolls) -->
<div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-2 flex items-center gap-2 shadow-2xl z-40 animate-in slide-in-from-bottom-4">
    <div class="px-3 border-r border-slate-700 flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"><Dices size={16}/> Quick</div>
    <button onclick={() => startQuickRoll(20)} class="bg-slate-800 hover:bg-indigo-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 shadow-lg">d20</button>
    <button onclick={() => startQuickRoll(6)} class="bg-slate-800 hover:bg-indigo-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 shadow-lg">d6</button>
    <button onclick={() => startQuickRoll(6, 2)} class="bg-slate-800 hover:bg-indigo-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 shadow-lg text-xs">2d6</button>
    <button onclick={() => startQuickRoll(6, 3)} class="bg-slate-800 hover:bg-indigo-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 shadow-lg text-xs">3d6</button>
</div>

{#if quickRollState.isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onclick={(e) => { if (e.target === e.currentTarget) quickRollState.isOpen = false; }} role="button" aria-label="Fechar" tabindex="-1">
        <div class="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl p-6 w-full max-w-sm" role="dialog" aria-modal="true">
             <h3 class="font-bold text-white text-center text-lg mb-4">Rolagem Rápida ({quickRollState.count}d{quickRollState.sides})</h3>
             <div class="flex items-center justify-center gap-6 mb-6">
                 <button onclick={() => quickRollState.modifier--} class="w-12 h-12 rounded-full bg-slate-700 hover:bg-red-500 text-white flex items-center justify-center"><Minus size={24}/></button>
                 <div class="text-4xl font-bold {quickRollState.modifier > 0 ? 'text-green-400' : quickRollState.modifier < 0 ? 'text-red-400' : 'text-slate-500'}">
                     {quickRollState.modifier > 0 ? '+' : ''}{quickRollState.modifier}
                 </div>
                 <button onclick={() => quickRollState.modifier++} class="w-12 h-12 rounded-full bg-slate-700 hover:bg-green-500 text-white flex items-center justify-center"><Plus size={24}/></button>
             </div>
             <div class="text-xs text-center text-slate-500 mb-6 uppercase font-bold">{quickRollState.sides === 20 ? 'Boons / Banes' : 'Modificador Fixo'}</div>
             <button onclick={confirmQuickRoll} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg">ROLAR AGORA</button>
        </div>
    </div>
{/if}

<HistorySidebar isOpen={$isHistoryOpen} onClose={() => isHistoryOpen.set(false)} />

<ConfirmationModal 
    isOpen={confirmState.isOpen}
    title={confirmState.title}
    message={confirmState.message}
    onConfirm={confirmState.onConfirm}
    onCancel={() => confirmState.isOpen = false}
/>
