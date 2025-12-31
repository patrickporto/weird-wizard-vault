<script lang="ts">
    import { t } from 'svelte-i18n';
    import { character, modalState, activeEffects, derivedStats, evaluateModifierValue } from '$lib/stores/characterStore';
    import { sotdlCharacter, sotdlCharacterActions, sotdlActiveEffects, sotdlDerivedStats, sotdlAttributes, evaluateModifierValueSotDL } from '$lib/stores/characterStoreSotDL';
    import { MOD_TYPES } from '$lib/constants';
    import Modal from '$lib/components/common/Modal.svelte';
    import { Lock, Sparkles, TrendingUp, TrendingDown, Equal, X as TimesIcon, Calculator, AlertTriangle } from 'lucide-svelte';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'attribute');
    let data = $derived($modalState.data);
    let formData = $state<any>({});

    // Get the right stores based on system
    let isSotDL = $derived(data?.system === 'sofdl');
    let currentEffects = $derived(isSotDL ? $sotdlActiveEffects : $activeEffects);
    let currentChar = $derived(isSotDL ? $sotdlCharacter : $character);

    // Get attribute key for searching modifiers
    let attrKey = $derived(data?.key || formData?.key);

    // Find all modifiers affecting this attribute
    let affectingModifiers = $derived(() => {
        if (!attrKey || !currentEffects) return [];

        const mods: { effectName: string; type: string; value: number | string; evaluatedValue: number }[] = [];

        currentEffects.forEach((eff: any) => {
            if (!eff.modifiers || !eff.isActive) return;
            eff.modifiers.forEach((mod: any) => {
                if (mod.target === attrKey) {
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

    // Check if there's a SET modifier (which overrides base value)
    let hasSetModifier = $derived(affectingModifiers().some((m: any) => m.type === MOD_TYPES.SET));

    // Get base value
    let baseValue = $derived(() => {
        if (!attrKey) return 0;
        if (isSotDL) {
            return $sotdlCharacter.attributes[attrKey as keyof typeof $sotdlCharacter.attributes] || 0;
        } else {
            const attr = $character.attributes?.find(a => a.key === attrKey);
            return attr?.value || 0;
        }
    });

    // Get derived (final) value
    let derivedValue = $derived(() => {
        if (!attrKey) return 0;
        if (isSotDL) {
            return $sotdlAttributes[attrKey as keyof typeof $sotdlAttributes] || 0;
        } else {
            return $derivedStats[attrKey] || 0;
        }
    });

    // Build formula string
    let formulaBreakdown = $derived(() => {
        const mods = affectingModifiers();
        if (mods.length === 0) return null;

        const base = baseValue();
        const parts: string[] = [];
        let currentValue = base;

        // Check for SET first
        const setMod = mods.find((m: any) => m.type === MOD_TYPES.SET);
        if (setMod) {
            parts.push(`= ${setMod.evaluatedValue}`);
            currentValue = setMod.evaluatedValue;
        } else {
            parts.push(`${base}`);
        }

        // Then ADDs
        mods.filter((m: any) => m.type === MOD_TYPES.ADD).forEach((m: any) => {
            if (m.evaluatedValue >= 0) {
                parts.push(`+ ${m.evaluatedValue}`);
            } else {
                parts.push(`- ${Math.abs(m.evaluatedValue)}`);
            }
        });

        // Then MULTs
        mods.filter((m: any) => m.type === MOD_TYPES.MULT).forEach((m: any) => {
            parts.push(`× ${m.evaluatedValue}`);
        });

        return parts.join(' ');
    });

    $effect(() => {
        if (isOpen && data) {
            formData = { ...data };
        }
    });

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function saveAttribute() {
        if (hasSetModifier) return; // Prevent saving if locked

        if (formData.system === 'sofdl') {
            sotdlCharacterActions.updateAttribute(formData.key, parseInt(formData.value));
        } else {
            character.update(c => ({
                ...c,
                attributes: c.attributes.map(a => a.key === formData.key ? { ...a, value: parseInt(formData.value) } : a)
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

<Modal
    {isOpen}
    title={isSotDL ? $t(`sofdl.attributes.${attrKey}`) : $t(`sofww.attributes.${attrKey}`)}
    {onClose}
>
    <div class="space-y-5">
        <!-- Calculated Value Display -->
        <div class="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl p-5 border border-indigo-500/30 text-center">
            <div class="text-xs text-indigo-300/70 uppercase tracking-widest font-bold mb-2">
                {$t('character.modals.calculated_value') || 'Calculated Value'}
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
                <label for="attribute-base-value" class="text-xs text-slate-400 uppercase font-bold tracking-wide">
                    {$t('character.modals.base_value')}
                </label>
                {#if hasSetModifier}
                    <div class="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                        <Lock size={12}/>
                        <span class="font-medium">{$t('character.modals.locked_by_effect') || 'Locked by Effect'}</span>
                    </div>
                {/if}
            </div>

            <div class="relative">
                <input
                    id="attribute-base-value"
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
                    {$t('character.modals.active_modifiers') || 'Active Modifiers'}
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
                    {$t('character.modals.set_warning') || 'An active effect is overriding the base value. Remove or deactivate the effect to edit this attribute.'}
                </div>
            </div>
        {/if}

        <!-- Save Button -->
        <button
            onclick={saveAttribute}
            class="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all
                   {hasSetModifier
                       ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                       : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]'}"
            disabled={hasSetModifier}
        >
            {hasSetModifier ? $t('common.buttons.locked') || 'Locked' : $t('common.buttons.save')}
        </button>
    </div>
</Modal>
