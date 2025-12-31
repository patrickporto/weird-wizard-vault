<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Trash2 } from 'lucide-svelte';
    import { characterActions, modalState, character } from '$lib/stores/characterStore';
    import { sotdlCharacterActions, sotdlCharacter } from '$lib/stores/characterStoreSotDL';
    import Modal from '$lib/components/common/Modal.svelte';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'rest_confirm');
    let currentSystem = $derived($character?.system || $sotdlCharacter?.system || 'sofww');

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function handleRest() {
        if (currentSystem === 'sofdl') {
            sotdlCharacterActions.rest();
        } else {
            characterActions.confirmRest();
        }
        onClose();
    }
</script>

<Modal {isOpen} title={$t('character.modals.rest')} {onClose}>
    <div class="text-center space-y-6 py-4 p-1">
        <div class="flex justify-center">
            <div class="p-4 bg-indigo-500/10 rounded-full">
                <Trash2 size={48} class="text-indigo-400" />
            </div>
        </div>
        <div>
            <p class="text-lg text-white font-bold">{$t('character.modals.perform_rest')}</p>
            <p class="text-sm text-slate-500 mt-1">This will recover health and refresh all spell castings and talent uses.</p>
        </div>
        <div class="flex gap-4 justify-center pt-2">
            <button onclick={onClose} class="flex-1 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors">
                {$t('common.buttons.cancel')}
            </button>
            <button onclick={handleRest} class="flex-[1.5] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98]">
                {$t('character.modals.rest')}
            </button>
        </div>
    </div>
</Modal>
