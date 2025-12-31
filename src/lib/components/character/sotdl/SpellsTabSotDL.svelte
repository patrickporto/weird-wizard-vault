<script lang="ts">
    import { t } from 'svelte-i18n';
    import { modalState } from '$lib/stores/characterStore';
    import { sotdlCharacter, sotdlCharacterActions, type SotDLSpell } from '$lib/stores/characterStoreSotDL';
    import { getSotDLCastings } from '$lib/constants';
    import { Plus, Edit, Wand2, Sparkles, RotateCcw } from 'lucide-svelte';

    function openModal(data: SotDLSpell | null = null) {
        modalState.update(m => ({ ...m, type: 'spell_sotdl', isOpen: true, data }));
    }

    // Derived: available castings per rank based on power
    let power = $derived($sotdlCharacter.power);
    let spells = $derived($sotdlCharacter.spells);

    // Group spells by tradition
    let spellsByTradition = $derived(() => {
        const grouped: Record<string, SotDLSpell[]> = {};
        spells.forEach(s => {
            const key = s.tradition || 'Sem Tradição';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(s);
        });
        return grouped;
    });

    // Get remaining castings for a specific rank
    function getRemainingCastings(rank: number): number {
        const maxCastings = getSotDLCastings(power, rank);
        const usedCastings = spells.filter(s => s.rank === rank).reduce((sum, s) => sum + (s.castingsUsed || 0), 0);
        return Math.max(0, maxCastings - usedCastings);
    }

    // Check if can cast a spell
    function canCast(spell: SotDLSpell): boolean {
        return getRemainingCastings(spell.rank) > 0;
    }

    function castSpell(spell: SotDLSpell) {
        if (!canCast(spell)) return;
        sotdlCharacterActions.castSpell(spell.id);
        // If spell has an effect, could trigger it here
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
        <div>
            <h3 class="text-lg font-bold text-white tracking-tight">{$t('sofdl.spells.title')}</h3>
            <p class="text-xs text-slate-500">{$t('sofdl.spells.subtitle')}</p>
        </div>
        <div class="flex gap-2">
            <button
                onclick={() => sotdlCharacterActions.resetSpellCastings()}
                class="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-400 hover:text-white font-bold flex items-center gap-2 border border-slate-700 transition-all"
                title={$t('sofdl.spells.reset_castings')}
            >
                <RotateCcw size={14} />
            </button>
            <button
                onclick={() => openModal()}
                class="text-xs bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
            >
                <Plus size={16} /> {$t('sofdl.spells.new_spell')}
            </button>
        </div>
    </div>

    <!-- Power Level Display -->
    <div class="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4 rounded-xl border border-purple-500/30">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-purple-600/30 rounded-xl flex items-center justify-center">
                    <Sparkles size={24} class="text-purple-400" />
                </div>
                <div>
                    <span class="text-[10px] text-purple-400 uppercase font-bold tracking-widest block">{$t('sofdl.spells.power_level')}</span>
                    <span class="text-3xl font-black text-white">{power}</span>
                </div>
            </div>
            <!-- Castings by Rank Summary -->
            <div class="flex gap-2">
                {#each Array(11) as _, rank}
                    {@const max = getSotDLCastings(power, rank)}
                    {#if max > 0}
                        <div class="text-center px-2 py-1 bg-slate-900/50 rounded border border-slate-700">
                            <div class="text-[9px] text-slate-500 uppercase font-bold">R{rank}</div>
                            <div class="text-sm font-mono font-bold {getRemainingCastings(rank) === 0 ? 'text-red-500' : 'text-indigo-400'}">
                                {getRemainingCastings(rank)}/{max}
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    </div>

    <!-- Spells by Tradition -->
    {#each Object.entries(spellsByTradition()) as [tradition, traditionSpells]}
        <div class="space-y-3">
            <h4 class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span class="w-8 h-px bg-indigo-500/30"></span>
                {tradition}
                <span class="flex-1 h-px bg-indigo-500/30"></span>
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each traditionSpells as spell}
                    {@const remaining = getRemainingCastings(spell.rank)}
                    <div class="p-5 bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl group hover:border-indigo-500/50 transition-all duration-300">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <div class="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{spell.name}</div>
                                <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex gap-2">
                                    <span class="bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">R{spell.rank}</span>
                                    <span>{spell.type}</span>
                                    {#if spell.target}<span>• {spell.target}</span>{/if}
                                </div>
                            </div>
                            <button
                                onclick={() => openModal(spell)}
                                class="text-slate-600 hover:text-white p-1 hover:bg-slate-800 rounded-md transition-all"
                            >
                                <Edit size={14}/>
                            </button>
                        </div>

                        {#if spell.area || spell.duration}
                            <div class="text-[10px] text-slate-500 mb-2 flex gap-3">
                                {#if spell.area}<span>{$t('sofdl.spells.area')}: {spell.area}</span>{/if}
                                {#if spell.duration}<span>{$t('sofdl.spells.duration')}: {spell.duration}</span>{/if}
                            </div>
                        {/if}

                        <div class="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">{spell.description}</div>

                        <div class="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{$t('sofdl.spells.castings')}</span>
                            <div class="flex items-center gap-3">
                                <span class="text-sm font-mono font-bold {remaining === 0 ? 'text-red-500' : 'text-indigo-400'}">
                                    {remaining}/{getSotDLCastings(power, spell.rank)}
                                </span>
                                <button
                                    onclick={() => castSpell(spell)}
                                    disabled={!canCast(spell)}
                                    class="bg-indigo-600 disabled:opacity-20 text-white text-[10px] font-black px-4 py-1.5 rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/40 active:scale-95 uppercase tracking-wider"
                                >{$t('sofdl.spells.cast')}</button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/each}

    {#if spells.length === 0}
        <div class="text-center py-16 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-2xl">
            <Wand2 size={48} class="mx-auto text-slate-800 mb-3" />
            <p class="text-slate-500 font-medium">{$t('sofdl.spells.empty')}</p>
            <button
                onclick={() => openModal()}
                class="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-1 mx-auto"
            >
                <Plus size={14}/> {$t('sofdl.spells.add_first')}
            </button>
        </div>
    {/if}
</div>
