<script lang="ts">
    import { t } from 'svelte-i18n';
    import { character, modalState, activeEffects, evaluateModifierValue } from '$lib/stores/characterStore';
    import { sotdlCharacter, sotdlCharacterActions, sotdlActiveEffects, sotdlDerivedStats, evaluateModifierValueSotDL } from '$lib/stores/characterStoreSotDL';
    import { MOD_TYPES } from '$lib/constants';
    import Modal from '$lib/components/common/Modal.svelte';
    import { Lock, Sparkles, TrendingUp, TrendingDown, Equal, X as TimesIcon, Calculator, AlertTriangle } from 'lucide-svelte';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'stat');
    let data = $derived($modalState.data);
    let formData = $state<any>({});

    // Get the right stores based on system
    let isSotDL = $derived(data?.system === 'sofdl');
    let currentEffects = $derived(isSotDL ? $sotdlActiveEffects : $activeEffects);
    let currentChar = $derived(isSotDL ? $sotdlCharacter : $character);

    // Get stat key
    let statKey = $derived(() => {
        if (isSotDL) return data?.key;
        return data === 'defense' ? 'defense' : 'speed';
    });

    // Get stat label
    let statLabel = $derived(() => {
        const key = statKey();
        if (!key) return '';
        if (isSotDL) {
            // Map SotDL keys to translation keys
            const keyMap: Record<string, string> = {
                defense: 'character.vitals.defense',
                speed: 'character.vitals.speed',
                perception: 'sofdl.attributes.perception',
                power: 'sofdl.attributes.power',
                healingRate: 'character.vitals.healing_rate',
                health: 'character.vitals.health',
                insanity: 'sofdl.attributes.insanity',
                corruption: 'sofdl.attributes.corruption',
                size: 'sofdl.attributes.size'
            };
            return keyMap[key] || key;
        }
        return key === 'defense' ? 'character.vitals.defense' : 'character.vitals.speed';
    });

    // Find all modifiers affecting this stat
    let affectingModifiers = $derived(() => {
        const key = statKey();
        if (!key || !currentEffects) return [];

        // Map stat keys to modifier target names
        const targetKeyMap: Record<string, string> = {
            naturalDefense: 'defense',
            defense: 'defense',
            speed: 'speed',
            perception: 'perception',
            power: 'power',
            healingRate: 'healing_rate',
            health: 'health'
        };
        const targetKey = targetKeyMap[key] || key;

        const mods: { effectName: string; type: string; value: number | string; evaluatedValue: number }[] = [];

        currentEffects.forEach((eff: any) => {
            if (!eff.modifiers || !eff.isActive) return;
            eff.modifiers.forEach((mod: any) => {
                if (mod.target === targetKey) {
                    const evalFn = isSotDL ? evaluateModifierValueSotDL : evaluateModifierValue;
                    const evalValue = evalFn(mod.value, currentChar as any);
                    mods.push({
                        effectName: eff.name,
                        type: mod.type,
                        value: mod.value,
                        evaluatedValue: evalValue
                    });
                }
            });
        });

        return mods;
    });

    // Check if there's a SET modifier
    let hasSetModifier = $derived(affectingModifiers().some((m: any) => m.type === MOD_TYPES.SET));

    // Get base value
    let baseValue = $derived(() => {
        const key = statKey();
        if (!key) return 0;
        if (isSotDL) {
            return ($sotdlCharacter as any)[key] || 0;
        } else {
            if (data === 'defense') return $character.naturalDefense || 0;
            return $character.speed || 0;
        }
    });

    // Get derived (final) value
    let derivedValue = $derived(() => {
        const key = statKey();
        if (!key) return 0;
        if (isSotDL) {
            return ($sotdlDerivedStats as any)[key] || ($sotdlCharacter as any)[key] || 0;
        } else {
            // For WW, we'd need derived stats for defense/speed too
            return baseValue();
        }
    });

    // Build formula string
    let formulaBreakdown = $derived(() => {
        const mods = affectingModifiers();
        if (mods.length === 0) return null;

        const base = baseValue();
        const parts: string[] = [];

        const setMod = mods.find((m: any) => m.type === MOD_TYPES.SET);
        if (setMod) {
            parts.push(`= ${setMod.evaluatedValue}`);
        } else {
            parts.push(`${base}`);
        }

        mods.filter((m: any) => m.type === MOD_TYPES.ADD).forEach((m: any) => {
            if (m.evaluatedValue >= 0) {
                parts.push(`+ ${m.evaluatedValue}`);
            } else {
                parts.push(`- ${Math.abs(m.evaluatedValue)}`);
            }
        });

        mods.filter((m: any) => m.type === MOD_TYPES.MULT).forEach((m: any) => {
            parts.push(`× ${m.evaluatedValue}`);
        });

        return parts.join(' ');
    });

    $effect(() => {
        if (isOpen && data) {
            if (isSotDL) {
                const key = data.key;
                formData = {
                    key,
                    value: ($sotdlCharacter as any)[key],
                    system: 'sofdl',
                    name: key.charAt(0).toUpperCase() + key.slice(1)
                };
            } else {
                 formData = data === 'defense'
                    ? { key: 'naturalDefense', name: 'Defesa Natural', value: $character.naturalDefense }
                    : { key: 'speed', name: 'Velocidade', value: $character.speed };
            }
        }
    });

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function saveStat() {
        if (hasSetModifier) return;

        if (formData.system === 'sofdl') {
             if (formData.key === 'insanity' || formData.key === 'corruption') {
                 sotdlCharacterActions.updateStat(formData.key, parseInt(formData.value));
             } else {
                 sotdlCharacter.update(c => ({
                     ...c,
                     [formData.key]: parseInt(formData.value) || 0
                 }));
             }
        } else {
            character.update(c => ({
                ...c,
                [formData.key]: parseInt(formData.value as any) || 0
            }));
        }
        onClose();
    }

    function getModTypeIcon(type: string) {
        switch (type) {
            case MOD_TYPES.SET: return Equal;
            case MOD_TYPES.ADD: return TrendingUp;
            case MOD_TYPES.MULT: return TimesIcon;
            default: return Sparkles;
        }
    }

    function getModTypeColor(type: string) {
        switch (type) {
            case MOD_TYPES.SET: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
            case MOD_TYPES.ADD: return 'text-green-400 bg-green-400/10 border-green-400/30';
            case MOD_TYPES.MULT: return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
        }
    }
</script>

<Modal {isOpen} title={$t(statLabel())} {onClose}>
    <div class="space-y-5">
        <!-- Calculated Value Display -->
        <div class="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl p-5 border border-indigo-500/30 text-center">
            <div class="text-xs text-indigo-300/70 uppercase tracking-widest font-bold mb-2">
                {$t('character.modals.calculated_value')}
            </div>
            <div class="text-5xl font-black text-white mb-3">
                {derivedValue()}
            </div>

            {#if formulaBreakdown()}
                <div class="flex items-center justify-center gap-2 text-sm text-slate-300 bg-slate-900/50 rounded-lg px-3 py-2 mx-auto w-fit">
                    <Calculator size={14} class="text-indigo-400"/>
                    <span class="font-mono">{formulaBreakdown()}</span>
                </div>
            {/if}
        </div>

        <!-- Base Value Editor -->
        <div class="space-y-2">
            <div class="flex items-center justify-between">
                <label for="stat-base-value" class="text-xs text-slate-400 uppercase font-bold tracking-wide">
                    {$t('character.modals.base_value')}
                </label>
                {#if hasSetModifier}
                    <div class="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                        <Lock size={12}/>
                        <span class="font-medium">{$t('character.modals.locked_by_effect')}</span>
                    </div>
                {/if}
            </div>

            <div class="relative">
                <input
                    id="stat-base-value"
                    type="number"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-2xl font-bold text-center transition-all
                           {hasSetModifier ? 'opacity-50 cursor-not-allowed' : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}"
                    bind:value={formData.value}
                    disabled={hasSetModifier}
                />
                {#if hasSetModifier}
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Lock size={24} class="text-yellow-500/50"/>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Active Effects Breakdown -->
        {#if affectingModifiers().length > 0}
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-xs text-slate-400 uppercase font-bold tracking-wide">
                    <Sparkles size={12} class="text-indigo-400"/>
                    {$t('character.modals.active_modifiers')}
                </div>

                <div class="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {#each affectingModifiers() as mod}
                        {@const ModIcon = getModTypeIcon(mod.type)}
                        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 transition-all hover:border-slate-700">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg {getModTypeColor(mod.type)} flex items-center justify-center border">
                                    <ModIcon size={14}/>
                                </div>
                                <div>
                                    <div class="text-sm font-bold text-white">{mod.effectName}</div>
                                    <div class="text-xs text-slate-500">
                                        {#if mod.type === MOD_TYPES.SET}
                                            {$t('character.modals.mod_types.set')}
                                        {:else if mod.type === MOD_TYPES.ADD}
                                            {$t('character.modals.mod_types.add')}
                                        {:else}
                                            {$t('character.modals.mod_types.mult')}
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div class="text-lg font-black {mod.evaluatedValue >= 0 && mod.type !== MOD_TYPES.SET ? 'text-green-400' : mod.type === MOD_TYPES.SET ? 'text-yellow-400' : 'text-red-400'}">
                                {mod.type === MOD_TYPES.SET ? '=' : mod.type === MOD_TYPES.MULT ? '×' : (mod.evaluatedValue >= 0 ? '+' : '')}{mod.evaluatedValue}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Warning if SET modifier exists -->
        {#if hasSetModifier}
            <div class="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <AlertTriangle size={18} class="text-yellow-400 flex-shrink-0 mt-0.5"/>
                <div class="text-xs text-yellow-200/80 leading-relaxed">
                    {$t('character.modals.set_warning')}
                </div>
            </div>
        {/if}

        <!-- Save Button -->
        <button
            onclick={saveStat}
            class="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all
                   {hasSetModifier
                       ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                       : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]'}"
            disabled={hasSetModifier}
        >
            {hasSetModifier ? $t('common.buttons.locked') : $t('common.buttons.save')}
        </button>
    </div>
</Modal>
