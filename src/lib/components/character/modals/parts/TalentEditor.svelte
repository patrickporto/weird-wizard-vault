<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Trash2, Clock, Zap, Infinity } from 'lucide-svelte';
    import { characterActions, modalState } from '$lib/stores/characterStore';
    import Modal from '$lib/components/common/Modal.svelte';
    import { TALENT_SOURCES, DURATION_TYPES } from '../../../../../routes/sofww';
    import { uuidv7 } from 'uuidv7';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'talent');
    let data = $derived($modalState.data);

    // Track if we're editing an existing talent (has an id that was passed initially)
    let isEditing = $state(false);

    let formData = $state({
        id: undefined as string | undefined,
        name: '',
        description: '',
        source: TALENT_SOURCES.ANCESTRY,
        activityType: 'Passive', // Passive, Uses, Duration
        uses: 0,
        maxUses: 0,
        duration: 'ROUNDS',
        durationValue: 1,
        isPassive: true, // Legacy support/derived
        effect: null as any
    });

    $effect(() => {
        if (isOpen && data) {
            // Check if this is an existing talent being edited (has an id property directly on data)
            // vs. returning from EffectEditor (data comes from parentData which may not have id)
            const existingTalentId = data.id;
            isEditing = !!existingTalentId;
            
            formData = { 
                id: data.id,
                name: data.name || '',
                description: data.description || '',
                source: data.source || TALENT_SOURCES.ANCESTRY,
                activityType: data.activityType || (data.isPassive ? 'Passive' : 'Uses'),
                uses: data.uses || 0,
                maxUses: data.maxUses || 0,
                duration: data.duration || 'ROUNDS',
                durationValue: data.durationValue || 1,
                isPassive: data.isPassive ?? true,
                effect: data.effect || null
            };
        } else if (isOpen && !data) {
            isEditing = false;
            formData = { 
                id: undefined, 
                name: '', 
                description: '', 
                source: TALENT_SOURCES.ANCESTRY,
                activityType: 'Passive',
                uses: 0, 
                maxUses: 0, 
                duration: 'ROUNDS',
                durationValue: 1,
                isPassive: true, 
                effect: null 
            };
        }
    });

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function saveTalent() {
        if (!formData.name?.trim()) return alert($t('character.modals.name_required'));
        
        const newTalent = { 
            ...formData, 
            id: formData.id || uuidv7(),
            isPassive: formData.activityType === 'Passive' // Maintain legacy flag
        };

        if (formData.activityType === 'Passive') {
            newTalent.maxUses = 0;
            newTalent.uses = 0;
        } else if (formData.activityType === 'Uses' && !isEditing) {
            newTalent.uses = formData.maxUses;
        } else if (formData.activityType === 'Duration' && formData.duration === 'LUCK_ENDS' && !isEditing) {
            newTalent.maxUses = 1;
            newTalent.uses = 1;
        }
        
        if (isEditing) characterActions.updateTalent(newTalent);
        else characterActions.addTalent(newTalent);
        onClose();
    }

    function openEffectEditor() {
        modalState.update(m => ({ 
            ...m, 
            type: 'effect', 
            data: { parentType: 'talent', parentData: formData } 
        }));
    }
</script>

<Modal {isOpen} title={$t('character.modals.talent_editor')} {onClose}>
    <div class="space-y-4 p-1">
        <div>
            <label for="talentName" class="text-xs font-bold text-slate-400 uppercase block mb-1">
                {$t('character.modals.name')} 
            </label>
            <input 
                id="talentName"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold" 
                placeholder={$t('character.modals.name')} 
                bind:value={formData.name} 
            />
            {#if !formData.name}<p class="text-[10px] text-red-500 mt-1">{$t('character.modals.name_required')}</p>{/if}
        </div>

        <div class="grid grid-cols-2 gap-3">
             <div>
                <label for="talentSource" class="text-xs font-bold text-slate-400 uppercase block mb-1">{$t('character.talents.source')}</label>
                <select id="talentSource" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-xs" bind:value={formData.source}>
                    {#each Object.values(TALENT_SOURCES) as source}
                        <option value={source}>{$t(`character.talents.sources.${source}`)}</option>
                    {/each}
                </select>
             </div>
             <div>
                <label for="talentType" class="text-xs font-bold text-slate-400 uppercase block mb-1">{$t('character.talents.type')}</label>
                <select id="talentType" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-xs" bind:value={formData.activityType}>
                    <option value="Passive">{$t('character.talents.types.Passive')}</option>
                    <option value="Uses">{$t('character.talents.types.Uses')}</option>
                    <option value="Duration">{$t('character.talents.types.Duration')}</option>
                </select>
             </div>
        </div>

        {#if formData.activityType === 'Uses'}
            <div class="bg-indigo-900/10 border border-indigo-900/30 rounded-xl p-4">
                <label for="maxUses" class="block">
                    <span class="text-[10px] text-indigo-300 uppercase font-bold mb-1 block">{$t('character.modals.max_uses')}</span>
                    <input id="maxUses" type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold" bind:value={formData.maxUses} />
                </label>
            </div>
        {:else if formData.activityType === 'Duration'}
             <div class="bg-indigo-900/10 border border-indigo-900/30 rounded-xl p-4 space-y-3">
                 <label for="durationType" class="block">
                     <span class="text-[10px] text-indigo-300 uppercase font-bold mb-1 block">Tipo de Duração</span>
                     <select id="durationType" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-xs" bind:value={formData.duration}>
                         <option value="LUCK_ENDS">Sorte Encerra</option>
                         <option value="MINUTES">Minutos</option>
                         <option value="HOURS">Horas</option>
                     </select>
                 </label>
                 {#if formData.duration === 'MINUTES' || formData.duration === 'HOURS'}
                     <label for="durationValue" class="block">
                         <span class="text-[10px] text-indigo-300 uppercase font-bold mb-1 block">Duração ({formData.duration === 'MINUTES' ? 'Min' : 'Horas'})</span>
                         <input id="durationValue" type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold" bind:value={formData.durationValue} />
                     </label>
                 {/if}
             </div>
        {/if}

        <div class="bg-slate-900 p-2 rounded border border-slate-700 flex justify-between items-center">
             <span class="text-xs text-slate-400 font-bold uppercase">{$t('character.modals.associated_effect')}</span>
             <button 
                onclick={openEffectEditor} 
                class="text-[10px] px-2 py-1 rounded border {formData.effect ? 'bg-indigo-900 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-600 text-slate-500'}"
            >
                 {formData.effect ? $t('character.modals.configured') : $t('character.modals.none')}
             </button>
        </div>

        <div>
            <label for="talentDesc" class="block text-xs font-bold text-slate-400 uppercase mb-1">
                {$t('character.modals.description')} 
            </label>
            <textarea 
                id="talentDesc"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                rows={4} 
                placeholder={$t('character.modals.description')} 
                bind:value={formData.description}
            ></textarea>
        </div>

        <div class="flex gap-2 pt-2">
            {#if data}<button onclick={() => { characterActions.deleteTalent(data.id); onClose(); }} class="bg-red-900/50 hover:bg-red-900 text-red-200 p-3 rounded-lg transition-colors" title={$t('character.modals.delete')}><Trash2 size={20}/></button>{/if}
            <button onclick={saveTalent} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all">{$t('common.buttons.save')}</button>
        </div>
    </div>
</Modal>
