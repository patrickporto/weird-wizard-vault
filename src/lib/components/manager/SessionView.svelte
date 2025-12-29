<script>
    import { liveCharacters, liveEnemies, liveEncounters } from '$lib/stores/live';
    import { characterActions, isHistoryOpen } from '$lib/stores/characterStore';
    import { campaignsMap, charactersMap } from '$lib/db';
    import { Users, Ghost, GripVertical, Plus, Minus, Swords, RotateCcw, X, Clock, AlertTriangle, Dices, ChevronLeft, ChevronDown, ChevronUp, History, Layers, Play } from 'lucide-svelte';
    import CombatCard from './CombatCard.svelte';
    import { flip } from 'svelte/animate';
    
    export let campaign;

    let isAddCharOpen = false;
    const defaultCombat = { active: false, round: 1 };
    
    // Quick Add Tab
    let activeQuickTab = 'enemies'; // 'enemies' | 'encounters'

    // End of Round Modal
    let isEoRModalOpen = false;
    let endOfRoundEffects = [];
    
    // Reactively extract data from prop
    $: roster = campaign?.sessionRoster || [];
    $: combat = campaign?.combat || defaultCombat;
    $: activeEnemies = campaign?.activeEnemies || [];
    
    // Players present in the roster
    $: players = roster.map(pid => $liveCharacters.find(c => c.id === pid)).filter(Boolean);
    
    // Available characters (not in roster)
    $: availableCharacters = $liveCharacters.filter(c => !roster.includes(c.id));

    // Helpers to update Campaign in DB - Using Map directly to avoid stale prop issues
    function updateCampaign(updates) {
        if (!campaign?.id) return;
        const current = campaignsMap.get(campaign.id) || campaign;
        const updated = { ...current, ...updates };
        campaignsMap.set(campaign.id, updated);
    }

    function toggleSessionPresence(charId) {
        const newRoster = roster.includes(charId) ? roster.filter(id => id !== charId) : [...roster, charId];
        updateCampaign({ sessionRoster: newRoster });
    }

    function addToCombat(enemyTemplate) {
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

    function addToCombatEncounter(enc) {
        const current = campaignsMap.get(campaign.id) || campaign;
        const currentEnemies = current.activeEnemies || [];
        
        let newEnemies = [];
        enc.enemies.forEach(item => {
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
        isEoRModalOpen = false;
    }

    function endCombat(clearEnemies) {
        if (clearEnemies) {
            updateCampaign({ combat: { active: false, round: 1 }, activeEnemies: [] });
        } else {
            updateCampaign({ combat: { active: false, round: 1 } });
        }
    }

    function removeFromCombat(instanceId) {
        const current = campaignsMap.get(campaign.id) || campaign;
        updateCampaign({ 
            activeEnemies: (current.activeEnemies || []).filter(e => e.instanceId !== instanceId) 
        });
    }

    function updateEnemy(instanceId, updates) {
        const current = campaignsMap.get(campaign.id) || campaign;
        updateCampaign({ 
            activeEnemies: (current.activeEnemies || []).map(e => e.instanceId === instanceId ? { ...e, ...updates } : e) 
        });
    }

    import { calculateDiceRoll } from '$lib/logic/dice';

    function prevRound() {
        const current = campaignsMap.get(campaign.id) || campaign;
        const currentRound = current.combat?.round || 1;
        if (currentRound > 1) {
            updateCampaign({ combat: { ...current.combat, round: currentRound - 1 } });
        }
    }

    // Quick Roll State
    let quickRollState = { isOpen: false, sides: 20, count: 1, modifier: 0 };
    
    function startQuickRoll(sides, count = 1) {
        quickRollState = { isOpen: true, sides, count, modifier: 0 };
    }

    function confirmQuickRoll() {
        rollDice(quickRollState.sides, quickRollState.count, quickRollState.modifier);
        quickRollState.isOpen = false;
    }

    // Dice
    function rollDice(sides, count = 1, modifier = 0) {
        const res = calculateDiceRoll(sides, count, modifier);
        
        let desc = "";
        if (count > 1) desc += `Dados: [${res.results.join(', ')}] `;
        if (res.bonusRolls?.length > 0) desc += `Bonus Rolls: [${res.bonusRolls.join(', ')}] -> ${Math.abs(res.modifierTotal)}`;
        
        characterActions.addToHistory({
            source: 'GM',
            name: `${count}d${sides} ${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
            description: desc.trim() || null,
            total: res.total,
            formula: res.formula,
            crit: res.crit
        });
        isHistoryOpen.set(true); 
    }

    // Explicit derivation of sorted combatants
    $: sortedCombatants = (() => {
        const playersWithInit = roster.map(pid => $liveCharacters.find(c => c.id === pid)).filter(c => c && c.initiative).map(c => ({...c, id: c.id, type: 'player'}));
        const enemies = activeEnemies.map(e => ({...e, type: 'enemy'}));
        const playersNoInit = roster.map(pid => $liveCharacters.find(c => c.id === pid)).filter(c => c && !c.initiative).map(c => ({...c, id: c.id, type: 'player'}));
        
        const all = [...playersWithInit, ...enemies, ...playersNoInit];
        
        const seen = new Set();
        return all.filter(entity => {
            const key = entity.type === 'player' ? entity.id : entity.instanceId;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    })();
</script>

<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full relative">
    <!-- Left Col -->
    <div class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div class="flex justify-between items-center mb-3">
                 <h3 class="text-sm font-bold text-slate-400 uppercase flex items-center gap-2"><Users size={14}/> Personagens</h3>
                 <button on:click={() => isAddCharOpen = !isAddCharOpen} class="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded flex items-center gap-1 border border-slate-700">
                     {isAddCharOpen ? 'Fechar' : 'Gerenciar'}
                 </button>
            </div>
            
            {#if isAddCharOpen}
                <div class="mb-3 p-2 bg-slate-950 rounded border border-slate-800 max-h-40 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                     <h4 class="text-[10px] uppercase font-bold text-slate-500 mb-2">Adicionar à Sessão</h4>
                     {#each availableCharacters as char}
                         <button on:click={() => toggleSessionPresence(char.id)} class="w-full text-left flex items-center justify-between p-1.5 hover:bg-indigo-900/20 rounded group">
                             <span class="text-sm font-bold text-slate-300 group-hover:text-white">{char.name}</span>
                             <Plus size={14} class="text-indigo-500"/>
                         </button>
                     {/each}
                     {#if availableCharacters.length === 0}
                         <div class="text-[10px] text-slate-600 italic">Todos os personagens já estão na sessão.</div>
                     {/if}
                </div>
            {/if}

            <div class="space-y-2">
                {#each players as char (char.id)}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div class="p-2 rounded border flex items-center gap-3 transition-colors bg-indigo-900/30 border-indigo-500/50">
                        <div class="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                        <div class="flex-1">
                             <div class="font-bold text-sm text-white">{char.name}</div>
                             <div class="text-[10px] text-slate-400">Lvl {char.level} • {char.ancestry}</div>
                        </div>
                        <button on:click={() => toggleSessionPresence(char.id)} class="text-slate-500 hover:text-red-400 p-1" title="Remover da Sessão"><X size={14}/></button>
                    </div>
                {/each}
                {#if players.length === 0}
                    <div class="text-xs text-slate-500 italic p-2 border border-dashed border-slate-800 rounded">Nenhum jogador na sessão.</div>
                {/if}
            </div>
            

        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[400px]">
            <div class="flex items-center gap-2 mb-3 bg-slate-950 p-1 rounded-lg border border-slate-800">
                 <button on:click={() => activeQuickTab = 'enemies'} class="flex-1 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 transition-colors {activeQuickTab === 'enemies' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}"><Ghost size={14}/> Inimigos</button>
                 <button on:click={() => activeQuickTab = 'encounters'} class="flex-1 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 transition-colors {activeQuickTab === 'encounters' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}"><Layers size={14}/> Encontros</button>
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
                            <button on:click={() => addToCombat(enemy)} class="text-slate-500 hover:text-indigo-400 p-1 ml-2 bg-slate-900 rounded border border-slate-800"><Plus size={16}/></button>
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
                            <button on:click={() => addToCombatEncounter(enc)} class="text-slate-500 hover:text-indigo-400 p-1 ml-2 bg-slate-900 rounded border border-slate-800"><Play size={14}/></button>
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
                    <button on:click={startCombat} class="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"><Swords size={20}/> INICIAR COMBATE</button>
                {:else}
                    <div class="flex items-center gap-4">
                        <button on:click={prevRound} class="p-2 hover:bg-slate-700 rounded text-slate-400" title="Voltar Rodada"><ChevronLeft size={20}/></button>
                        <div class="text-center"><div class="text-[10px] font-bold text-slate-500 uppercase">Rodada</div><div class="text-3xl font-mono font-bold text-white leading-none">{combat.round}</div></div>
                        <button on:click={nextRound} class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2" title="Próxima Rodada"><RotateCcw size={16}/> Próxima</button>
                        <div class="h-8 w-px bg-slate-700 mx-2"></div>
                        <button on:click={() => endCombat(false)} class="text-red-400 hover:text-red-300 text-xs font-bold px-3 py-2 border border-red-900/30 rounded bg-red-900/10">Encerrar</button>
                    </div>
                {/if}
             </div>
        </div>
        
        <div class="space-y-3 pb-20">
            {#each sortedCombatants as entity (entity.type === 'player' ? entity.id : entity.instanceId)}
                <div animate:flip={{duration: 300}}>
                   <CombatCard {entity} {updateEnemy} {removeFromCombat} />
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
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" on:click|self={() => {}}>
    <div class="bg-slate-800 rounded-xl w-full max-w-lg border border-slate-700 shadow-2xl p-6 relative">
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
             <button on:click={() => isEoRModalOpen = false} class="flex-1 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold">Cancelar</button>
             <button on:click={proceedRound} class="flex-1 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Avançar Rodada</button>
        </div>
    </div>
</div>
{/if}

<!-- Bottom Bar (Quick Rolls) -->
<div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-2 flex items-center gap-2 shadow-2xl z-40 animate-in slide-in-from-bottom-4">
    <div class="px-3 border-r border-slate-700 flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"><Dices size={16}/> Quick</div>
    <button on:click={() => startQuickRoll(20)} class="bg-slate-800 hover:bg-indigo-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 shadow-lg">d20</button>
    <button on:click={() => startQuickRoll(6)} class="bg-slate-800 hover:bg-indigo-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 shadow-lg">d6</button>
    <button on:click={() => startQuickRoll(6, 2)} class="bg-slate-800 hover:bg-indigo-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 shadow-lg text-xs">2d6</button>
    <button on:click={() => startQuickRoll(6, 3)} class="bg-slate-800 hover:bg-indigo-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 shadow-lg text-xs">3d6</button>
</div>

<!-- Quick Roll Modal -->
{#if quickRollState.isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" on:click|self={() => quickRollState.isOpen = false}>
        <div class="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl p-6 w-full max-w-sm">
             <h3 class="font-bold text-white text-center text-lg mb-4">Rolagem Rápida ({quickRollState.count}d{quickRollState.sides})</h3>
             <div class="flex items-center justify-center gap-6 mb-6">
                 <button on:click={() => quickRollState.modifier--} class="w-12 h-12 rounded-full bg-slate-700 hover:bg-red-500 text-white flex items-center justify-center"><Minus size={24}/></button>
                 <div class="text-4xl font-bold {quickRollState.modifier > 0 ? 'text-green-400' : quickRollState.modifier < 0 ? 'text-red-400' : 'text-slate-500'}">
                     {quickRollState.modifier > 0 ? '+' : ''}{quickRollState.modifier}
                 </div>
                 <button on:click={() => quickRollState.modifier++} class="w-12 h-12 rounded-full bg-slate-700 hover:bg-green-500 text-white flex items-center justify-center"><Plus size={24}/></button>
             </div>
             <div class="text-xs text-center text-slate-500 mb-6 uppercase font-bold">{quickRollState.sides === 20 ? 'Boons / Banes' : 'Modificador Fixo'}</div>
             <button on:click={confirmQuickRoll} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg">ROLAR AGORA</button>
        </div>
    </div>
{/if}
