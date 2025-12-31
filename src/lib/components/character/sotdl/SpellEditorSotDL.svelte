<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Trash2 } from 'lucide-svelte';
    import { SOTDL_TRADITIONS } from '$lib/constants';
    import { modalState } from '$lib/stores/characterStore';
    import { sotdlCharacterActions, type SotDLSpell } from '$lib/stores/characterStoreSotDL';
    import Modal from '$lib/components/common/Modal.svelte';
    import { uuidv7 } from 'uuidv7';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'spell_sotdl');
    let data = $derived($modalState.data as SotDLSpell | null);

    let formData = $state<SotDLSpell>({
        id: '',
        name: '',
        tradition: '',
        rank: 0,
        type: 'Attack',
        target: '',
        area: '',
        duration: '',
        description: '',
        castingsUsed: 0,
        effect: null
    });

    $effect(() => {
        if (isOpen && data) {
            formData = { ...data };
        } else if (isOpen && !data) {
            formData = {
                id: '',
                name: '',
                tradition: '',
                rank: 0,
                type: 'Attack',
                target: '',
                area: '',
                duration: '',
                description: '',
                castingsUsed: 0,
                effect: null
            };
        }
    });

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function saveSpell() {
        if (!formData.name?.trim()) return alert($t('character.modals.name_required'));
        const newSpell: SotDLSpell = { ...formData, id: formData.id || uuidv7() };
        if (data?.id) {
            sotdlCharacterActions.updateSpell(newSpell);
        } else {
            sotdlCharacterActions.addSpell(newSpell);
        }
        onClose();
    }

    function openEffectEditor() {
        modalState.update(m => ({
            ...m,
            type: 'effect',
            data: { parentType: 'spell_sotdl', parentData: formData, system: 'sofdl' }
        }));
    }
</script>

<Modal {isOpen} title={$t('sofdl.spells.editor_title')} {onClose}>
    <div class="space-y-3 p-1">
        <div>
            <label class="text-xs font-bold text-slate-400 uppercase">
                {$t('character.modals.name')}
                <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold mb-1" placeholder={$t('character.modals.name')} bind:value={formData.name} />
            </label>
            {#if !formData.name}<p class="text-[10px] text-red-500">{$t('character.modals.name_required')}</p>{/if}
        </div>

        <div class="grid grid-cols-2 gap-2">
            <label class="block">
                <span class="text-[10px] text-slate-500 uppercase font-bold">{$t('sofdl.spells.rank')}</span>
                <input type="number" min="0" max="10" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" bind:value={formData.rank} />
            </label>
            <div class="relative">
                <label class="block">
                    <span class="text-[10px] text-slate-500 uppercase font-bold">{$t('sofdl.spells.tradition')}</span>
                    <input
                        list="sotdl-traditions"
                        class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                        placeholder={$t('sofdl.spells.tradition')}
                        bind:value={formData.tradition}
                    />
                </label>
                <datalist id="sotdl-traditions">
                    {#each SOTDL_TRADITIONS as trad}<option value={trad}>{trad}</option>{/each}
                </datalist>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
            <label class="block">
                <span class="text-[10px] text-slate-500 uppercase font-bold">{$t('sofdl.spells.type')}</span>
                <select class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" bind:value={formData.type}>
                    <option value="Attack">{$t('sofdl.spells.types.attack')}</option>
                    <option value="Utility">{$t('sofdl.spells.types.utility')}</option>
                </select>
            </label>
            <label class="block">
                <span class="text-[10px] text-slate-500 uppercase font-bold">{$t('sofdl.spells.target')}</span>
                <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder={$t('sofdl.spells.target')} bind:value={formData.target} />
            </label>
        </div>

        <div class="grid grid-cols-2 gap-2">
            <label class="block">
                <span class="text-[10px] text-slate-500 uppercase font-bold">{$t('sofdl.spells.area')}</span>
                <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder={$t('sofdl.spells.area')} bind:value={formData.area} />
            </label>
            <label class="block">
                <span class="text-[10px] text-slate-500 uppercase font-bold">{$t('sofdl.spells.duration')}</span>
                <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder={$t('sofdl.spells.duration')} bind:value={formData.duration} />
            </label>
        </div>

        <div class="bg-slate-900 p-2 rounded border border-slate-700 flex justify-between items-center">
             <span class="text-xs text-slate-400 font-bold uppercase">{$t('character.modals.associated_effect')}</span>
             <button
                onclick={openEffectEditor}
                class="text-[10px] px-2 py-1 rounded border {formData.effect ? 'bg-indigo-900 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-600 text-slate-500'}"
            >
                 {formData.effect ? $t('character.modals.configured') : $t('character.modals.none')}
             </button>
        </div>

        <label class="block text-xs font-bold text-slate-400 uppercase">
            {$t('character.modals.description')}
            <textarea class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" rows={4} placeholder={$t('character.modals.description')} bind:value={formData.description}></textarea>
        </label>

        <div class="flex gap-2">
            {#if data?.id}
                <button
                    onclick={() => { sotdlCharacterActions.deleteSpell(data!.id); onClose(); }}
                    class="bg-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded"
                    title={$t('character.modals.delete')}
                >
                    <Trash2 size={18}/>
                </button>
            {/if}
            <button onclick={saveSpell} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">{$t('common.buttons.save')}</button>
        </div>
    </div>
</Modal>
