<script lang="ts">
    import { t } from 'svelte-i18n';
    import { sotdlCharacter, sotdlCharacterActions, sotdlActiveEffects } from '$lib/stores/characterStoreSotDL';
    import { modalState } from '$lib/stores/characterStore';
    import { Rewind, FastForward, Eraser, Plus, Edit, Trash2, Clock, Clover, Zap } from 'lucide-svelte';
    import { MOD_TYPES, DURATION_TYPES, MOD_TARGETS } from '$lib/constants';

    const { advanceRound, deleteEffect, checkLuckEnds, cleanInactiveEffects, toggleEffect, checkConcentration } = sotdlCharacterActions;

    // Derived state for talent effects (if we add talents later, for now just active effects)
    let talentEffects = $derived($sotdlActiveEffects.filter((e: any) => e.sourceType === 'talent'));

    function openModal(type: string, data: any = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data, system: 'sofdl' }));
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div class="flex items-center gap-4">
            <button
                onclick={() => advanceRound('prev')}
                disabled={!!$sotdlCharacter.campaignId}
                class="p-2 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={$t('character.effects.prev_round')}
            >
                <Rewind size={20}/>
            </button>
            <div class="text-center min-w-[80px]">
                <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {$sotdlCharacter.combatActive ? $t('character.effects.current_round') : $t('character.effects.status')}
                </div>
                {#if $sotdlCharacter.combatActive}
                    <div class="text-2xl font-mono font-bold text-white leading-tight">{$sotdlCharacter.currentRound || 1}</div>
                {:else}
                    <div class="text-sm font-bold text-slate-500 uppercase tracking-tighter mt-1 italic">{$t('character.effects.out_of_combat')}</div>
                {/if}
            </div>
            <button
                onclick={() => advanceRound('next')}
                disabled={!!$sotdlCharacter.campaignId}
                class="p-2 hover:bg-slate-700 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={$t('character.effects.next_round')}
            >
                <FastForward size={20}/>
            </button>
        </div>
        <div class="flex gap-2">
            <button
                onclick={cleanInactiveEffects}
                class="bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 border border-slate-700"
            >
                <Eraser size={14}/> {$t('character.effects.clean_inactive')}
            </button>
            <button
                onclick={() => openModal('effect')}
                class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
            >
                <Plus size={14}/> {$t('character.effects.new_effect')}
            </button>
        </div>
    </div>

    <div class="space-y-2">
        <!-- Manual/Character Effects -->
        {#if $sotdlCharacter.effects.length > 0}
            <h4 class="text-xs font-bold text-slate-500 uppercase px-1 mt-4 mb-2">{$t('character.effects.active')}</h4>
            {#each $sotdlCharacter.effects as eff (eff.id)}
                <div class="p-3 rounded border flex flex-col gap-2 transition-all {eff.isActive ? 'bg-slate-900 border-indigo-900 shadow-lg shadow-indigo-950/20' : 'bg-slate-950 border-slate-800 opacity-60'}">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-2">
                            <button
                                onclick={() => toggleEffect(eff.id)}
                                class="w-8 h-4 rounded-full relative transition-colors {eff.isActive ? 'bg-green-500' : 'bg-slate-600'}"
                                aria-label={eff.isActive ? 'Desativar efeito ' + eff.name : 'Ativar efeito ' + eff.name}
                                aria-pressed={eff.isActive}
                            >
                                <div class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all {eff.isActive ? 'left-4.5' : 'left-0.5'}"></div>
                            </button>
                            <span class="font-bold text-white tracking-tight">{eff.name}</span>
                        </div>
                        <div class="flex gap-2">
                            <button
                                onclick={() => openModal('effect', eff)}
                                class="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                                aria-label="Editar {eff.name}"
                            >
                                <Edit size={14}/>
                            </button>
                            <button
                                onclick={() => deleteEffect(eff.id)}
                                class="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-800 rounded transition-colors"
                                aria-label="Excluir {eff.name}"
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </div>
                    <div class="text-xs text-slate-400 leading-relaxed">{eff.description}</div>
                    {#if eff.isActive && Array.isArray(eff.modifiers) && eff.modifiers.length > 0}
                        <div class="flex flex-wrap gap-1 mt-1">
                            {#each eff.modifiers as mod}
                                <span class="text-[9px] px-1.5 py-0.5 rounded border {mod.type === MOD_TYPES.SET ? 'bg-yellow-900/30 text-yellow-200 border-yellow-800' : 'bg-slate-800 text-slate-300 border-slate-700'} font-medium">
                                    {MOD_TARGETS[mod.target] || mod.target}: {mod.type === MOD_TYPES.SET ? '=' : mod.type === MOD_TYPES.MULT ? 'x' : (mod.value > 0 ? '+' : '')}{mod.value}
                                </span>
                            {/each}
                        </div>
                    {/if}
                    <div class="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 border-t border-slate-800/50 pt-2">
                        <span class="flex items-center gap-1">
                            <Clock size={10} class="text-indigo-400"/>
                            {DURATION_TYPES[eff.duration] || eff.duration}
                            {eff.duration === 'ROUNDS' ? `(${eff.roundsLeft})` : ''}
                        </span>
                        <div class="flex gap-1">
                            {#if eff.duration === 'LUCK_ENDS' && eff.isActive}
                                <button
                                    onclick={() => checkLuckEnds(eff.id)}
                                    class="bg-yellow-900/40 hover:bg-yellow-800/40 text-yellow-500 border border-yellow-800 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                    aria-label="Sortear encerramento do efeito"
                                >
                                    <Clover size={10}/> {$t('character.effects.luck_ends')}
                                </button>
                            {/if}
                            {#if eff.duration === 'CONCENTRATION' && eff.isActive}
                                <button
                                    onclick={() => checkConcentration(eff.id)}
                                    class="bg-purple-900/40 hover:bg-purple-800/40 text-purple-400 border border-purple-800 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                    aria-label="Manter concentração"
                                >
                                    <Zap size={10}/> {$t('sofdl.effects.maintain_concentration')}
                                </button>
                            {/if}
                            {#if eff.duration === 'END_OF_ROUND' && eff.isActive}
                                <span class="bg-orange-900/40 text-orange-400 border border-orange-800 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Clock size={10}/> {$t('sofdl.effects.end_of_round')}
                                </span>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        {/if}

        {#if $sotdlCharacter.effects.length === 0}
            <div class="text-center text-slate-500 italic py-4">{$t('character.effects.none')}</div>
        {/if}
    </div>
</div>
