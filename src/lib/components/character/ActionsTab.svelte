<script lang="ts">
    import { t } from 'svelte-i18n';
    import { activeTab, character, modalState, characterActions } from '$lib/stores/characterStore';
    import { Sword, Bomb, Wand2, Zap, Backpack } from 'lucide-svelte';
    import { fade } from 'svelte/transition';
    import { ITEM_TYPES } from '../../../routes/sofww';

    const { useConsumable } = characterActions;

    let actions = $derived($character.equipment.filter(i => (i.type === ITEM_TYPES.WEAPON && i.equippedState) || i.type === ITEM_TYPES.EXPLOSIVE));
    let hasSpells = $derived($character.spells.length > 0);
    let hasTalents = $derived($character.talents.length > 0);
    let isEmpty = $derived(actions.length === 0 && !hasSpells && !hasTalents);

    function openModal(type: string, data: any = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }

    function handleUseConsumable(e: MouseEvent, item: any) {
        e.stopPropagation();
        useConsumable(item);
    }
</script>

<div class="space-y-4">
    {#each actions as item}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
            onclick={() => openModal('weapon_menu', item)} 
            class="flex flex-col sm:flex-row justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-900 cursor-pointer transition-colors gap-4 active:scale-[0.99]"
            role="button"
            tabindex="0"
            aria-label="Opções para {item.name}"
        >
            <div class="flex items-start gap-3">
                <div class="bg-slate-800 p-2 rounded text-slate-400 mt-1"><Sword size={20}/></div>
                <div>
                    <p class="font-bold text-white flex items-center gap-2">
                        {item.name} 
                        {#if item.equippedState}
                            <span class="text-[10px] bg-indigo-900 text-indigo-200 px-1 rounded uppercase">{item.equippedState}</span>
                        {/if}
                    </p>
                    <p class="text-xs text-slate-500">{item.traits || '-'} • {item.range || '-'}</p>
                </div>
            </div>
            <div class="flex flex-col items-end gap-2">
                <div class="flex items-center gap-4 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div class="text-center px-2">
                        <span class="block text-[10px] font-bold text-slate-500 uppercase">{$t('character.actions.damage')}</span>
                        <span class="text-xl font-mono text-white font-bold">{item.damageDice || 0}d6</span>
                    </div>
                </div>
                {#if item.type === ITEM_TYPES.EXPLOSIVE}
                    <button 
                        onclick={(e) => handleUseConsumable(e, item)} 
                        class="text-xs bg-red-900/50 text-red-200 px-3 py-1 rounded border border-red-800 hover:bg-red-900 flex items-center gap-1"
                        aria-label="Usar {item.name}"
                    >
                        <Bomb size={12}/> {$t('character.actions.throw')} ({item.quantity})
                    </button>
                {/if}
            </div>
        </div>
    {/each}

    {#if hasSpells}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
            onclick={() => openModal('cast_spell')} 
            class="flex flex-col sm:flex-row items-center p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-500 cursor-pointer transition-colors gap-4 group"
            role="button"
            tabindex="0"
        >
            <div class="flex items-start gap-3 w-full">
                <div class="bg-indigo-900/50 p-2 rounded text-indigo-300 mt-1"><Wand2 size={20}/></div>
                <div>
                    <p class="font-bold text-white flex items-center gap-2 group-hover:text-indigo-300 transition-colors">{$t('character.actions.cast_spell')}</p>
                    <p class="text-xs text-slate-500">{$t('character.actions.cast_spell_desc')}</p>
                </div>
            </div>
            <div class="ml-auto">
                <div class="bg-slate-900 px-3 py-1 rounded text-xs font-bold text-indigo-400 uppercase tracking-wider border border-slate-800">{$t('character.actions.select')}</div>
            </div>
        </div>
    {/if}

    {#if hasTalents}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
            onclick={() => openModal('select_talent')} 
            class="flex flex-col sm:flex-row items-center p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-yellow-600 cursor-pointer transition-colors gap-4 group"
            role="button"
            tabindex="0"
        >
            <div class="flex items-start gap-3 w-full">
                <div class="bg-yellow-900/30 p-2 rounded text-yellow-300 mt-1"><Zap size={20}/></div>
                <div>
                    <p class="font-bold text-white flex items-center gap-2 group-hover:text-yellow-300 transition-colors">{$t('character.actions.use_talent')}</p>
                    <p class="text-xs text-slate-500">{$t('character.actions.use_talent_desc')}</p>
                </div>
            </div>
            <div class="ml-auto">
                <div class="bg-slate-900 px-3 py-1 rounded text-xs font-bold text-yellow-500 uppercase tracking-wider border border-slate-800">{$t('character.actions.select')}</div>
            </div>
        </div>
    {/if}

    {#if isEmpty}
        <div 
            in:fade={{ duration: 300 }}
            class="flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-b from-slate-900/50 to-slate-950/50 rounded-[2.5rem] border border-dashed border-slate-800 shadow-2xl relative overflow-hidden group mt-4"
        >
            <!-- Background Decor -->
            <div class="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full"></div>
            <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full"></div>

            <div class="relative">
                <div class="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-indigo-400 mb-6 mx-auto transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl border border-slate-700">
                    <Sword size={40} class="opacity-80" />
                </div>
                
                <h3 class="text-2xl font-black text-white mb-3 uppercase tracking-tight">{$t('character.actions.empty_title')}</h3>
                <p class="text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
                    {$t('character.actions.empty_desc')}
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md">
                    <button 
                        onclick={() => activeTab.set('equipamento')}
                        class="flex flex-col items-center gap-2 p-4 bg-slate-900/80 hover:bg-slate-800 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all active:scale-95 group/btn"
                    >
                        <div class="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover/btn:text-indigo-400 transition-colors">
                            <Backpack size={20} />
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover/btn:text-slate-300">{$t('character.actions.inventory')}</span>
                    </button>

                    <button 
                        onclick={() => activeTab.set('magias')}
                        class="flex flex-col items-center gap-2 p-4 bg-slate-900/80 hover:bg-slate-800 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all active:scale-95 group/btn"
                    >
                        <div class="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover/btn:text-indigo-400 transition-colors">
                            <Wand2 size={20} />
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover/btn:text-slate-300">{$t('character.tabs.spells')}</span>
                    </button>

                    <button 
                        onclick={() => activeTab.set('talentos')}
                        class="flex flex-col items-center gap-2 p-4 bg-slate-900/80 hover:bg-slate-800 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all active:scale-95 group/btn"
                    >
                        <div class="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover/btn:text-indigo-400 transition-colors">
                            <Zap size={20} />
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover/btn:text-slate-300">{$t('character.tabs.talents')}</span>
                    </button>
                </div>
            </div>
        </div>
    {/if}

</div>


