<script lang="ts">
    import { t } from 'svelte-i18n';
    import { charactersMap } from '$lib/db';
    import { Swords, CheckCircle, Skull, X, Plus, Flame, ChevronUp, ChevronDown, Eye } from 'lucide-svelte';
    import { slide } from 'svelte/transition';
    import Avatar from '../common/Avatar.svelte';
    import AfflictionModal from '../common/AfflictionModal.svelte';

    interface Props {
        entity: any;
        updateEnemy?: (instanceId: string, updates: any) => void;
        updatePlayer?: (charId: string, updates: any) => void;
        removeFromCombat?: (instanceId: string) => void;
    }

    let {
        entity,
        updateEnemy = (id: string, u: any) => {},
        updatePlayer = (id: string, u: any) => {},
        removeFromCombat = (id: string) => {}
    }: Props = $props();

    // Derived values
    let isPlayer = $derived(entity.type === 'player');
    let damage = $derived(entity.damage || 0);
    // normalHealth is the base max health; health is effectiveMaxHealth with modifiers
    let maxHealth = $derived(entity.normalHealth || entity.health || 10);
    // Current health is the actual current cap (can be reduced from normal)
    let currentHealth = $derived(entity.currentHealth ?? maxHealth);

    // In Weird Wizard, you are incapacitated if Damage >= Health
    let isIncapacitated = $derived(damage >= currentHealth);
    let isInjured = $derived((damage >= currentHealth / 2) && !isIncapacitated);

    // Bar should fill based on Damage relative to Current Health (the "container")
    let damagePercent = $derived(currentHealth > 0 ? Math.min(100, Math.max(0, (damage / currentHealth) * 100)) : 100);

    let expanded = $state(false);

    let showAfflictionModal = $state(false);

    // Auto-apply/remove Incapacitated affliction
    $effect(() => {
        const currentAfflictions = entity.afflictions || [];
        const hasIncap = currentAfflictions.includes("Incapacitated");

        if (isIncapacitated && !hasIncap) {
            const newList = [...currentAfflictions, "Incapacitated"];
            const updates = { afflictions: newList };
            if(entity.type === 'player') handleUpdatePlayer(updates);
            else updateEnemy(entity.instanceId, updates);
        } else if (!isIncapacitated && hasIncap) {
            const newList = currentAfflictions.filter(a => a !== "Incapacitated");
            const updates = { afflictions: newList };
            if(entity.type === 'player') handleUpdatePlayer(updates);
            else updateEnemy(entity.instanceId, updates);
        }
    });

    import { syncCharacter } from '$lib/logic/sync';

    // Helper for player updates
    function handleUpdatePlayer(updates: any) {
        if (entity.type !== 'player') return;

        // 1. Update GM's view/local storage
        const currentLocal = charactersMap.get(entity.id);
        if (currentLocal) {
            charactersMap.set(entity.id, { ...currentLocal, ...updates });
        }

        // 2. Notify parent (SessionView) to update campaign member state
        updatePlayer(entity.id, updates);

        // 3. Sync to the room so the player character sheet receives it
        syncCharacter({
            id: entity.id,
            ...updates
        });
    }

    function handleDamageInput(e: any) {
        const val = parseInt(e.target.value);
        if (isNaN(val)) return;
        const d = Math.max(0, val);
        const updates = { damage: d };
        if(entity.type === 'player') handleUpdatePlayer(updates);
        else updateEnemy(entity.instanceId, updates);
    }

    function handleHealthInput(e: any) {
        const val = parseInt(e.target.value);
        if (isNaN(val)) return;
        const h = Math.max(0, val);

        let d = damage;
        if (h < damage) {
            d = h;
        }

        const updates = { currentHealth: h, damage: d };
        if(entity.type === 'player') handleUpdatePlayer(updates);
        else updateEnemy(entity.instanceId, updates);
    }

    function toggleActed() {
        const newVal = !entity.acted;
        if(entity.type === 'player') handleUpdatePlayer({ acted: newVal });
        else updateEnemy(entity.instanceId, { acted: newVal });
    }

    function toggleInitiative() {
        if(entity.type === 'player') handleUpdatePlayer({ initiative: !entity.initiative });
    }

    function toggleAffliction(aff: string) {
         const list = entity.afflictions || [];
         const newList = list.includes(aff) ? list.filter((a: string) => a !== aff) : [...list, aff];
         const updates = { afflictions: newList };
         if(entity.type === 'player') handleUpdatePlayer(updates);
         else updateEnemy(entity.instanceId, updates);
    }


</script>

<div class="group relative overflow-hidden transition-all duration-300 rounded-2xl border {isPlayer ? 'bg-slate-900/80 border-indigo-500/30 hover:border-indigo-500/50 hover:shadow-indigo-900/20' : 'bg-slate-950/80 border-red-900/30 hover:border-red-800/50 hover:shadow-red-900/10'} shadow-lg backdrop-blur-sm">
    {#if isPlayer && entity.initiative}
        <div class="absolute top-0 right-0 bg-gradient-to-l from-yellow-600/20 to-transparent border-l border-b border-yellow-500/30 text-yellow-500 text-[9px] font-black tracking-widest px-3 py-1 rounded-bl-xl z-20 uppercase shadow-[0_0_10px_rgba(234,179,8,0.2)]">
            {$t('session.combat_card.initiative')}
        </div>
    {/if}

    <!-- Background Pulse for Incapacitated -->
    {#if isIncapacitated}
        <div class="absolute inset-0 bg-red-950/40 animate-pulse z-0 pointer-events-none"></div>
    {/if}

    <div class="relative z-10 p-4">
        <!-- Top Row: Identity & Status -->
        <div class="flex items-start gap-4 mb-3">
             <div class="relative flex-shrink-0">
                 <!-- Avatar Container -->
                 <div class="w-14 h-14 rounded-2xl overflow-hidden border-2 shadow-xl transition-transform group-hover:scale-105 {isIncapacitated ? 'border-red-600 grayscale brightness-50' : isPlayer ? 'border-indigo-500/50' : 'border-red-900/50'}">
                    {#key entity.imageUrl}
                        <Avatar hash={entity.imageUrl} alt={entity.name} size="custom" fallbackText={entity.name.charAt(0)} />
                    {/key}
                 </div>

                 <!-- Action Status Badge -->
                 <button
                    onclick={toggleActed}
                    class="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center border shadow-lg transition-all hover:scale-110 z-20 {entity.acted ? 'bg-slate-800 border-slate-600 text-slate-500' : isPlayer ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-red-600 border-red-400 text-white'}"
                    title={entity.acted ? $t('session.combat_card.acted') : $t('session.combat_card.act')}
                 >
                    {#if isIncapacitated}
                        <Skull size={14} class=""/>
                    {:else if entity.acted}
                        <CheckCircle size={14}/>
                    {:else}
                        <Swords size={14}/>
                    {/if}
                 </button>
             </div>

             <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1">
                    <div class="flex flex-col min-w-0 mr-2">
                        <div class="flex items-center gap-2">
                            <h3 class="text-base font-bold truncate leading-snug {isPlayer ? 'text-white' : 'text-red-100 font-serif tracking-wide'}">
                                {entity.name}
                            </h3>
                            {#if !isPlayer}
                                <span class="text-[9px] font-black bg-red-950/40 text-red-500 px-1.5 py-0.5 rounded border border-red-900/30 uppercase tracking-wider flex-shrink-0">Dif {entity.difficulty}</span>
                            {/if}
                        </div>
                    </div>

                    <!-- Top Controls (Mobile friendly) -->
                    <div class="flex gap-1 flex-shrink-0">
                        <button onclick={() => expanded = !expanded} class="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-slate-500 hover:text-white hover:bg-slate-700 border border-slate-700/50 transition-colors">
                            {#if expanded}<ChevronUp size={14}/>{:else}<ChevronDown size={14}/>{/if}
                        </button>

                        {#if isPlayer}
                            <button onclick={toggleInitiative} class="w-7 h-7 flex items-center justify-center rounded transition-all {entity.initiative ? 'bg-yellow-500 text-yellow-950 shadow-lg shadow-yellow-500/20' : 'bg-slate-800 text-slate-500 hover:text-white hover:bg-slate-700'}" title={$t('session.combat_card.initiative')}>
                                <Flame size={14}/>
                            </button>
                        {:else}
                            <button onclick={() => removeFromCombat(entity.instanceId)} class="w-7 h-7 flex items-center justify-center rounded bg-slate-800/50 text-slate-600 hover:text-red-400 hover:bg-red-950/30 border border-slate-700/50 transition-colors">
                                <X size={14}/>
                            </button>
                        {/if}
                    </div>
                </div>

                <!-- Health Bar -->
                <!-- Health Bar (Matched to CharacterHeader) -->
                <div class="relative w-full h-3.5 sm:h-4 bg-slate-950 rounded-full border border-white/5 overflow-hidden shadow-inner group-hover:border-white/20 transition-all mb-2">
                    <!-- Background health indicator -->
                    <div class="absolute inset-0 w-full {damage === 0 ? 'bg-emerald-900/20' : 'bg-slate-900/50'}"></div>

                    <!-- Damage fill bar with gradient -->
                    {#if damagePercent > 0}
                        <div
                            class="absolute top-0 left-0 h-full transition-all duration-500 ease-out z-10
                            {isIncapacitated ? 'bg-gradient-to-r from-red-600 via-red-500 to-rose-500 animate-pulse' :
                             damagePercent >= 80 ? 'bg-gradient-to-r from-red-600 to-rose-500' :
                             isInjured ? 'bg-gradient-to-r from-amber-600 to-orange-500' :
                             'bg-gradient-to-r from-orange-500 to-amber-400'}"
                            style="width: {damagePercent}%"
                        >
                            <!-- Shine effect -->
                            <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                        </div>
                    {/if}

                    <!-- Healthy glow when no damage -->
                    {#if damage === 0}
                        <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-400/30 to-emerald-500/20 z-10">
                            <div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                        </div>
                    {/if}

                    <!-- Status Label Overlay -->
                    {#if isIncapacitated}
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <span class="text-[9px] font-black uppercase text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] tracking-widest leading-none mt-0.5">{$t('session.combat_card.incapacitated')}</span>
                        </div>
                    {:else if isInjured}
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <span class="text-[9px] font-black uppercase text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] tracking-widest leading-none mt-0.5">{$t('session.combat_card.injured')}</span>
                        </div>
                    {/if}
                </div>

                <!-- Stats & Afflictions Row -->
                <div class="flex flex-col sm:flex-row gap-3">

                    <!-- Stats Compact -->
                    <!-- Stats Compact -->
                    <div class="flex items-start gap-1.5">
                        <!-- Defense -->
                        <div class="flex flex-col items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-1.5 w-[4.5rem] h-[3.75rem] shadow-sm">
                             <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{$t('session.combat_card.defense')}</span>
                             <span class="text-xl font-bold text-white font-mono leading-none">{entity.defense || 10}</span>
                        </div>

                        <!-- Damage -->
                        <div class="flex flex-col items-center justify-between bg-red-950/30 border border-red-900/50 rounded-lg p-1.5 w-[4.5rem] h-[3.75rem] shadow-sm relative group/dmg">
                             <span class="text-[9px] font-black text-red-400 uppercase tracking-wider mb-0.5">{$t('session.combat_card.damage')}</span>
                             <input type="number" class="w-full bg-transparent text-center text-white font-mono font-bold text-xl focus:outline-none p-0 leading-none placeholder-red-800" value={damage} oninput={handleDamageInput} />
                             <!-- Hover indicator -->
                             <span class="absolute -top-1 -right-1 flex h-2 w-2 opacity-0 group-hover/dmg:opacity-100 transition-opacity">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                             </span>
                        </div>

                        <!-- Health -->
                        <div class="flex flex-col items-center justify-between border rounded-lg p-1.5 w-[5.5rem] h-[3.75rem] shadow-sm relative transition-colors {isIncapacitated ? 'bg-red-950/50 border-red-500' : isInjured ? 'bg-orange-950/30 border-orange-500' : 'bg-emerald-950/30 border-emerald-900/50'}">
                             <span class="text-[9px] font-black uppercase tracking-wider mb-0.5 {isIncapacitated ? 'text-red-400' : isInjured ? 'text-orange-400' : 'text-emerald-400'}">
                                 {$t('session.combat_card.health')}
                             </span>
                             <div class="flex items-baseline gap-0.5 justify-center w-full">
                                <input type="number" class="w-full bg-transparent text-right text-white font-mono font-bold text-xl focus:outline-none p-0 leading-none" value={currentHealth} oninput={handleHealthInput} />
                                <span class="text-[10px] text-slate-500 font-mono self-end mb-0.5 opacity-70">/{maxHealth}</span>
                             </div>
                        </div>
                    </div>

                    <!-- Afflictions Wrap -->
                    <div class="flex flex-wrap gap-1.5 items-center flex-1">
                        {#each (entity.afflictions || []) as aff}
                           <button onclick={() => toggleAffliction(aff)} class="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-1 group/btn">
                               {aff} <X size={8} class="opacity-50 group-hover/btn:opacity-100"/>
                           </button>
                        {/each}

                        <button onclick={() => showAfflictionModal = true} class="text-[10px] sm:text-[9px] font-bold text-slate-500 hover:text-indigo-400 px-1.5 py-0.5 rounded border border-transparent hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all flex items-center gap-1 whitespace-nowrap">
                               <Plus size={10}/> {$t('session.combat_card.add_affliction')}
                        </button>
                   </div>

                </div>
             </div>
        </div>
    </div>

    <!-- Right Controls -->
    <!-- This section was part of the grid in previous logic, but now it's inside the main container or needs to be positioned.
         Wait, looking at my previous edit, the controls were NOT in the p-4 block I just replaced?
         Ah, I replaced the whole internal grid previously. I need to make sure I am targeting the correct area.
         Let's stick to the visible structure. The previous replace replaced "SECTION 1", "SECTION 2" and "SECTION 3".

         The attributes/stats need to go into the expanded section.
         The expand button needs to be added for players.
    -->

    {#if expanded}
        <div class="border-t border-slate-800/50 bg-slate-950/30 p-4">

            <!-- Attributes Section (New) -->
            <div class="mb-4">
                <div class="text-slate-500 font-bold uppercase text-[10px] mb-2 flex items-center gap-2">
                    <span>{$t('session.combat_card.attributes')}</span>
                    <div class="h-px flex-1 bg-slate-800"></div>
                </div>
                <div class="grid grid-cols-4 gap-2">
                    {#each ['str', 'agi', 'int', 'wil'] as stat}
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-800/50 text-center">
                            <span class="text-[9px] text-slate-500 uppercase font-black block mb-0.5">{stat}</span>
                            <div class="text-white font-bold font-mono text-lg leading-none">
                                {(entity.stats?.[stat] ?? entity.attributes?.[stat] ?? 10)}
                            </div>
                            <div class="text-[9px] font-bold {(entity.stats?.[stat] ?? entity.attributes?.[stat] ?? 10) - 10 >= 0 ? 'text-emerald-500' : 'text-red-500'}">
                                {(entity.stats?.[stat] ?? entity.attributes?.[stat] ?? 10) - 10 >= 0 ? '+' : ''}{(entity.stats?.[stat] ?? entity.attributes?.[stat] ?? 10) - 10}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Details view -->
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="p-2 rounded bg-slate-900/50 border border-slate-800/50 flex flex-col items-center">
                    <span class="text-[9px] text-slate-500 uppercase font-black">{$t('session.combat_card.size')}</span>
                    <span class="text-white font-bold">{entity.size || 1}</span>
                </div>
                <div class="p-2 rounded bg-slate-900/50 border border-slate-800/50 flex flex-col items-center">
                   <span class="text-[9px] text-slate-500 uppercase font-black">{$t('session.combat_card.speed')}</span>
                   <span class="text-white font-bold">{entity.speed || 10}</span>
                </div>

                 <div class="p-2 rounded bg-slate-900/50 border border-slate-800/50 flex flex-col items-center">
                     <span class="text-[9px] text-slate-500 uppercase font-black">{$t('session.combat_card.defense')}</span>
                     <span class="text-white font-bold">{entity.defense || 10}</span>
                 </div>
            </div>

            <!-- Sections: Senses, Traits, Actions, Reactions -->
            <div class="space-y-4">
                 <!-- Senses Display -->
                 {#if entity.senses && entity.senses.length > 0}
                    <div>
                         <div class="text-emerald-500 text-[10px] font-black uppercase mb-2 flex items-center gap-2">
                             {$t('character.senses.title')} <span class="h-px flex-1 bg-current opacity-20"></span>
                         </div>
                         <div class="flex flex-wrap gap-2">
                             {#each entity.senses as sense}
                                 {@const [key, val] = sense.split(':')}
                                 {@const label = $t(`character.senses.list.${key}`) + (val ? ` ${val}` : '')}
                                 {@const desc = $t(`character.senses.descriptions.${key}`)}
                                 <div class="text-xs bg-emerald-950/30 text-emerald-200 px-3 py-1.5 rounded border border-emerald-900/50 font-bold flex items-center gap-2" title={desc}>
                                    <Eye size={12} class="text-emerald-500"/> {label}
                                 </div>
                             {/each}
                         </div>
                    </div>
                 {/if}

                 {#each [
                     { key: 'traits', label: 'Traços', color: 'text-amber-500' },
                     { key: 'actions', label: 'Ações', color: 'text-red-400' },
                     { key: 'reactions', label: 'Reações', color: 'text-indigo-400' },
                     { key: 'end_of_round', label: 'Fim da Rodada', color: 'text-emerald-400' }
                 ] as section}
                    {#if entity[section.key] && entity[section.key].length > 0}
                         <div>
                             <div class="{section.color} text-[10px] font-black uppercase mb-2 flex items-center gap-2">
                                 {section.label} <span class="h-px flex-1 bg-current opacity-20"></span>
                             </div>
                             <div class="grid gap-2">
                                 {#each entity[section.key] as item}
                                     <div class="text-sm bg-slate-900/30 p-2 rounded border border-slate-800/30">
                                         <span class="font-bold text-slate-300">{item.name}</span>
                                         <span class="text-slate-400 text-xs block mt-1 leading-relaxed">{item.description || item.effect}</span>
                                     </div>
                                 {/each}
                             </div>
                         </div>
                    {/if}
                 {/each}
            </div>
        </div>
    {/if}

    <!-- Affliction Modal -->
    <AfflictionModal
        isOpen={showAfflictionModal}
        onClose={() => showAfflictionModal = false}
        afflictions={entity.afflictions || []}
        onToggle={toggleAffliction}
    />
</div>
