<script lang="ts">
    import { t } from 'svelte-i18n';
    import { character, modalState } from '$lib/stores/characterStore';
    import { Plus, Edit, Wand2 } from 'lucide-svelte';

    function openModal(type: string, data: any = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }
</script>

<div class="space-y-8">
    <div class="flex justify-between items-center mb-2">
        <div>
            <h3 class="text-lg font-bold text-white tracking-tight">{$t('character.spells.grimoire')}</h3>
            <p class="text-xs text-slate-500">{$t('character.spells.grimoire_desc')}</p>
        </div>
        <button 
            onclick={() => openModal('spell')} 
            class="text-xs bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
            aria-label={$t('character.spells.add_spell')}
        >
            <Plus size={16} /> {$t('character.spells.new_spell')}
        </button>
    </div>

    {#each ['Novice', 'Expert', 'Master'] as tier}
        {#if $character.spells.some(s => s.tier === tier)}
            <div class="space-y-3">
                <h4 class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span class="w-8 h-px bg-indigo-500/30"></span>
                    {tier} Spells
                    <span class="flex-1 h-px bg-indigo-500/30"></span>
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each $character.spells.filter(s => s.tier === tier) as spell}
                        <div class="p-5 bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl group hover:border-indigo-500/50 transition-all duration-300">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <div class="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{spell.name}</div>
                                    <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{spell.tradition} • {spell.type}</div>
                                </div>
                                <button 
                                    onclick={() => openModal('spell', spell)} 
                                    class="text-slate-600 hover:text-white p-1 hover:bg-slate-800 rounded-md transition-all"
                                    aria-label="Editar {spell.name}"
                                >
                                    <Edit size={14}/>
                                </button>
                            </div>
                            <div class="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed h-10">{spell.description}</div>
                            
                            <div class="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{$t('character.spells.magic_uses')}</span>
                                <div class="flex items-center gap-3">
                                    <span class="text-sm font-mono font-bold {spell.castings === 0 ? 'text-red-500' : 'text-indigo-400'}">{spell.castings}/{spell.maxCastings}</span>
                                    <button 
                                        onclick={() => openModal('confirm_spell', spell)} 
                                        disabled={spell.castings === 0} 
                                        class="bg-indigo-600 disabled:opacity-20 text-white text-[10px] font-black px-4 py-1.5 rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/40 active:scale-95 uppercase tracking-wider"
                                    >{$t('character.spells.cast')}</button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/each}

    {#if $character.spells.length === 0}
        <div class="text-center py-16 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-2xl">
            <Wand2 size={48} class="mx-auto text-slate-800 mb-3" />
            <p class="text-slate-500 font-medium">{$t('character.spells.empty')}</p>
            <button 
                onclick={() => openModal('spell')} 
                class="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-1 mx-auto"
            >
                <Plus size={14}/> {$t('character.spells.add_first')}
            </button>
        </div>
    {/if}
 </div>
