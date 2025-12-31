<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Dices, Wand2, Sword, ArrowLeft, Plus, Minus } from 'lucide-svelte';
    import { modalState } from '$lib/stores/characterStore';
    import { sotdlCharacter, sotdlActiveEffects, sotdlCharacterActions } from '$lib/stores/characterStoreSotDL';
    import Modal from '$lib/components/common/Modal.svelte';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'weapon_menu_sotdl');
    let data = $derived($modalState.data);

    let view = $state<'selection' | 'roll'>('selection');
    let rollType = $state<'attack' | 'damage'>('attack');
    let modifier = $state(0);
    let selectedEffectsIds = $state<string[]>([]);

    let displayEffects = $derived($sotdlActiveEffects);

    // Format damage display
    let damageDisplay = $derived(() => {
        if (!data) return '1d6';
        const dmg = data.damage || '0';
        const mod = data.damageMod || 0;

        // If it's a number, append d6
        if (dmg !== '0' && !dmg.includes('d') && !isNaN(Number(dmg))) {
            return mod > 0 ? `${dmg}d6+${mod}` : `${dmg}d6`;
        }
        // If it includes 'd' or special
        return mod > 0 ? `${dmg}+${mod}` : dmg;
    });

    // Reset state when modal opens OR closes
    $effect(() => {
        if (isOpen) {
            modifier = 0;
            selectedEffectsIds = displayEffects.map(e => e.id);
            view = 'selection';
            rollType = 'attack';
        } else {
            selectedEffectsIds = [];
            modifier = 0;
        }
    });

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function selectRoll(type: 'attack' | 'damage') {
        rollType = type;
        view = 'roll';
        modifier = 0;
    }

    function toggleEffect(id: string) {
        if (selectedEffectsIds.includes(id)) {
            selectedEffectsIds = selectedEffectsIds.filter(e => e !== id);
        } else {
            selectedEffectsIds = [...selectedEffectsIds, id];
        }
    }

    function confirmRoll() {
        if (!data) return;

        const rollDataType = rollType === 'attack' ? 'weapon_attack' : 'weapon_damage';

        const rollData = {
            type: rollDataType,
            source: data // Pass the item directly as source
        };

        const selectedEffects = displayEffects.filter(e => selectedEffectsIds.includes(e.id));
        sotdlCharacterActions.finalizeRoll(rollData, modifier, selectedEffects.map(e => e.name));
        onClose();
    }
</script>

<Modal {isOpen} title={view === 'roll' ? $t('character.dice_roll.confirm_roll') : $t('character.modals.attack_options')} {onClose}>
    {#if data}
        {#if view === 'selection'}
            <div class="space-y-6 pt-2">
                <!-- Header Card -->
                <div class="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-6 group transition-all hover:border-indigo-500/30">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Sword size={80} />
                    </div>

                    <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-3 relative z-10">{data.name}</h3>

                    <div class="flex flex-wrap gap-2 mb-4 relative z-10">
                        <span class="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-lg font-bold uppercase tracking-widest shadow-sm">
                            {data.hands || 'One-handed'}
                        </span>
                        <span class="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1 rounded-lg font-bold uppercase">
                            {data.range || 'Melee'}
                        </span>
                        {#if data.properties}
                            {#each data.properties.split(',').map((t: string) => t.trim()).filter((t: string) => t) as trait}
                                <span class="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg font-bold uppercase">
                                    {trait}
                                </span>
                            {/each}
                        {/if}
                    </div>

                    <p class="text-sm text-slate-400 italic leading-relaxed relative z-10">
                        {data.description || $t('character.modals.no_traits')}
                    </p>
                </div>

                <!-- Action Buttons -->
                <div class="grid grid-cols-2 gap-4">
                    <button
                        onclick={() => selectRoll('attack')}
                        class="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white p-1 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-[0.98] group"
                    >
                        <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="bg-slate-900/10 backdrop-blur-[2px] h-full rounded-[14px] p-5 flex flex-col items-center justify-center gap-3 border border-white/10">
                            <Dices size={32} class="text-indigo-200 group-hover:scale-110 transition-transform duration-300" />
                            <div class="text-center">
                                <span class="block text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">
                                    {$t('character.modals.attack')}
                                </span>
                                <span class="text-xl font-bold font-mono text-white">1d20</span>
                            </div>
                        </div>
                    </button>

                    <button
                        onclick={() => selectRoll('damage')}
                        class="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white p-1 rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-[0.98] group"
                    >
                        <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="bg-slate-900/10 backdrop-blur-[2px] h-full rounded-[14px] p-5 flex flex-col items-center justify-center gap-3 border border-white/10">
                            <Wand2 size={32} class="text-red-200 group-hover:scale-110 transition-transform duration-300" />
                            <div class="text-center">
                                <span class="block text-[10px] font-black uppercase tracking-widest text-red-200 mb-1">
                                    {$t('character.modals.damage')}
                                </span>
                                <span class="text-xl font-bold font-mono text-white">{damageDisplay()}</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        {:else}
            <!-- ROLL MODIFIER VIEW -->
            <div class="space-y-6 pt-2">
                <button
                    onclick={() => view = 'selection'}
                    class="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors -mt-2 mb-4 group"
                >
                    <ArrowLeft size={16} class="group-hover:-translate-x-1 transition-transform"/> {$t('common.buttons.back')}
                </button>

                <div class="bg-slate-900/50 p-6 rounded-2xl border border-white/5 text-center shadow-inner relative overflow-hidden group">
                    <div class="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                    <div class="flex justify-center items-center gap-8 mb-4 relative z-10">
                        <button
                            onclick={() => modifier--}
                            class="w-12 h-12 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 flex items-center justify-center transition-all active:scale-90 shadow-lg"
                        >
                            <Minus size={24}/>
                        </button>

                        <div class="flex flex-col items-center min-w-[100px]">
                            <span class="text-5xl font-black {modifier > 0 ? 'text-green-400' : modifier < 0 ? 'text-red-400' : 'text-slate-500'} tabular-nums drop-shadow-sm transition-colors duration-300">
                                {modifier > 0 ? '+' : ''}{modifier}
                            </span>
                        </div>

                        <button
                            onclick={() => modifier++}
                            class="w-12 h-12 rounded-full bg-slate-800 hover:bg-green-500/20 text-slate-300 hover:text-green-400 border border-slate-700 hover:border-green-500/30 flex items-center justify-center transition-all active:scale-90 shadow-lg"
                        >
                            <Plus size={24}/>
                        </button>
                    </div>

                    <div class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10">
                        {rollType === 'damage' ? $t('character.dice_roll.extra_dice') : $t('character.dice_roll.boons_banes')}
                    </div>
                </div>

                <!-- ACTIVE EFFECTS SELECTION -->
                {#if displayEffects.length > 0}
                    <div class="space-y-2">
                         <h4 class="text-xs font-bold text-slate-500 uppercase px-1">{$t('character.effects.active')}</h4>
                         <div class="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-1">
                            {#each displayEffects as eff (eff.id)}
                                <button
                                    onclick={() => toggleEffect(eff.id)}
                                    class="flex items-center justify-between p-3 rounded-lg border transition-all text-left {selectedEffectsIds.includes(eff.id) ? 'bg-indigo-900/30 border-indigo-500/50 shadow-sm' : 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'}"
                                >
                                    <div class="flex items-center gap-3">
                                        <div class="w-4 h-4 rounded border flex items-center justify-center transition-colors {selectedEffectsIds.includes(eff.id) ? 'bg-indigo-500 border-indigo-400' : 'border-slate-600 bg-slate-900'}">
                                            {#if selectedEffectsIds.includes(eff.id)}
                                                <div class="w-2 h-2 bg-white rounded-sm"></div>
                                            {/if}
                                        </div>
                                        <span class="text-sm font-bold text-slate-200 block leading-tight">{eff.name}</span>
                                    </div>
                                </button>
                            {/each}
                         </div>
                    </div>
                {/if}

                <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                     <span class="text-xs font-bold uppercase text-slate-500 tracking-wider">{$t('character.modals.rolling')}</span>
                     <span class="font-bold text-white">
                        {#if rollType === 'attack'}
                           Ataque (1d20)
                        {:else}
                           Dano ({damageDisplay()})
                        {/if}
                     </span>
                </div>

                <button
                    onclick={confirmRoll}
                    class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
                >
                    <Dices size={18} /> {$t('character.dice_roll.roll')}
                </button>
            </div>
        {/if}
    {/if}
</Modal>
