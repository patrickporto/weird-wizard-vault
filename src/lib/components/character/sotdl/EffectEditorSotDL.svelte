<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Plus, Trash2 } from 'lucide-svelte';
    import { DURATION_TYPES, MOD_TYPES } from '$lib/constants';
    import { sotdlCharacter, sotdlCharacterActions } from '$lib/stores/characterStoreSotDL';
    import { modalState } from '$lib/stores/characterStore';
    import Modal from '$lib/components/common/Modal.svelte';
    import { untrack } from 'svelte';
    import { uuidv7 } from 'uuidv7';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'effect' && $modalState.system === 'sofdl');
    let data = $derived($modalState.data);
    let formEffectData = $state<any>(null);

    const SOTDL_MOD_TARGETS = [
        'strength', 'agility', 'intellect', 'will', 'perception',
        'defense', 'speed', 'health', 'damage', 'healing_rate', 'power', 'boons'
    ];

    // Initialize state reactively when data changes
    $effect(() => {
        if (isOpen) {
            untrack(() => {
                if (data && data.parentType) {
                    formEffectData = data.parentData.effect ? { ...data.parentData.effect } : { name: '', description: '', isActive: true, duration: 'ROUNDS', roundsLeft: 1, initialRounds: 1, modifiers: [] };
                } else if (data) {
                    formEffectData = { ...data };
                    if (!Array.isArray(formEffectData.modifiers)) formEffectData.modifiers = [];
                } else {
                    formEffectData = { name: '', description: '', isActive: true, duration: 'ROUNDS', roundsLeft: 1, initialRounds: 1, modifiers: [] };
                }
            });
        }
    });

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function addModifier() {
        formEffectData.modifiers = [...(formEffectData.modifiers || []), { target: 'strength', type: MOD_TYPES.ADD, value: 1 }];
    }

    function removeModifier(idx: number) {
        formEffectData.modifiers = formEffectData.modifiers.filter((_: any, i: number) => i !== idx);
    }

    function saveEffect() {
        if (!data?.parentType && !formEffectData.name?.trim()) {
            return alert($t('character.modals.effect_name_required'));
        }

        const effectWithInitial = {
            ...formEffectData,
            initialRounds: formEffectData.duration === 'ROUNDS' ? formEffectData.roundsLeft : 0
        };

        if (data?.parentType) {
            // Nested effect editing (Spell/Talent)
            const updatedParent = { ...data.parentData, effect: effectWithInitial };
            modalState.update(m => ({ ...m, type: data.parentType, data: updatedParent }));
            return;
        }

        // Standalone effect
        if (formEffectData.id && $sotdlCharacter.effects.some(e => e.id === formEffectData.id)) {
            sotdlCharacter.update(c => ({
                ...c,
                effects: c.effects.map(e => e.id === formEffectData.id ? effectWithInitial : e)
            }));
        } else {
            sotdlCharacter.update(c => ({
                ...c,
                effects: [...c.effects, { ...effectWithInitial, id: uuidv7(), isActive: true }]
            }));
        }
        onClose();
    }
</script>

<Modal {isOpen} title={$t('character.modals.effect_manager')} {onClose}>
    {#if formEffectData}
    <div class="space-y-4 p-1">
        {#if !data?.parentType}
            <div>
                <label for="effectName" class="text-xs font-bold text-slate-400 uppercase">{$t('character.modals.name')}</label>
                <input id="effectName" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formEffectData.name} />
                {#if !formEffectData.name}<p class="text-[10px] text-red-500">{$t('character.modals.effect_name_required')}</p>{/if}
            </div>
        {/if}
        <div>
            <label for="effectDuration" class="text-xs font-bold text-slate-400 uppercase">{$t('character.modals.duration')}</label>
            <div class="grid grid-cols-2 gap-2">
                <select id="effectDuration" class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" bind:value={formEffectData.duration}>
                    {#each Object.entries(DURATION_TYPES) as [k,v]}<option value={k}>{v}</option>{/each}
                </select>
                {#if formEffectData.duration === 'ROUNDS'}
                    <input type="number" class="bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formEffectData.roundsLeft} />
                {/if}
            </div>
        </div>
        <div class="bg-slate-950 p-3 rounded border border-slate-800">
            <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-indigo-400 uppercase">{$t('character.modals.modifiers')}</span>
                <button onclick={addModifier} class="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600 flex items-center gap-1"><Plus size={10}/> {$t('character.modals.add')}</button>
            </div>
            <div class="space-y-2">
                {#each formEffectData.modifiers as mod, idx}
                    <div class="flex gap-1 items-center animate-in fade-in slide-in-from-left-1 duration-200">
                        <select class="bg-slate-900 border border-slate-700 rounded text-[10px] text-white p-1 w-1/3" bind:value={mod.target}>
                            {#each SOTDL_MOD_TARGETS as target}
                                <option value={target}>{$t(`character.modals.mod_targets.${target}`)}</option>
                            {/each}
                        </select>
                        <select class="bg-slate-900 border border-slate-700 rounded text-[10px] text-white p-1 w-1/4" bind:value={mod.type}>
                            <option value={MOD_TYPES.ADD}>{$t('character.modals.mod_types.add')}</option>
                            <option value={MOD_TYPES.SET}>{$t('character.modals.mod_types.set')}</option>
                            <option value={MOD_TYPES.MULT}>{$t('character.modals.mod_types.mult')}</option>
                        </select>
                        <input type="text" class="bg-slate-900 border border-slate-700 rounded text-[10px] text-white p-1 w-1/4 text-center" bind:value={mod.value} />
                        <button onclick={() => removeModifier(idx)} class="text-slate-600 hover:text-red-400 p-1" aria-label={$t('character.modals.remove_modifier')}><Trash2 size={12}/></button>
                    </div>
                {/each}
            </div>
        </div>
        {#if !data?.parentType}
            <div>
                <label for="effectDesc" class="text-xs font-bold text-slate-400 uppercase">{$t('character.modals.description')}</label>
                <textarea id="effectDesc" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formEffectData.description}></textarea>
            </div>
        {/if}
        <button onclick={saveEffect} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">{$t('character.modals.save_effect')}</button>
    </div>
    {/if}
</Modal>
