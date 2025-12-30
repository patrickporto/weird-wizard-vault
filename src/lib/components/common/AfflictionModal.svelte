<script lang="ts">
    import { t } from 'svelte-i18n';
    import { portal } from '$lib/actions/portal';
    import Modal from './Modal.svelte';
    import { AFFLICTIONS_DATA } from '../../../routes/sofww';
    import { Check, CheckCircle } from 'lucide-svelte';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        afflictions: string[];
        onToggle: (aff: string) => void;
    }

    let { isOpen, onClose, afflictions, onToggle }: Props = $props();
</script>

{#if isOpen}
    <div use:portal>
        <Modal {isOpen} {onClose} title={$t('session.affliction_modal.title')} maxWidth="max-w-md">
            <div class="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                {#each Object.keys(AFFLICTIONS_DATA) as aff}
                    {@const isActive = afflictions.includes(aff)}
                    <button 
                        onclick={() => onToggle(aff)}
                        class="flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-bold transition-all {isActive ? 'bg-red-500/20 border-red-500 text-red-100' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}"
                    >
                        {aff}
                        {#if isActive}<CheckCircle size={14} class="text-red-400"/>{/if}
                    </button>
                {/each}
            </div>
            
            <div class="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                 <div class="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 min-h-[60px]">
                     <p class="text-[10px] text-slate-500 uppercase font-bold mb-1">{$t('session.affliction_modal.effects')}</p>
                     {#if afflictions.length === 0}
                        <p class="text-xs text-slate-600 italic">{$t('session.affliction_modal.none_selected')}</p>
                     {:else}
                        <div class="space-y-1">
                             {#each afflictions as aff}
                                 <div class="text-xs leading-tight">
                                     <span class="text-red-400 font-bold">{aff}:</span> <span class="text-slate-400">{AFFLICTIONS_DATA[aff]?.effect}</span>
                                 </div>
                             {/each}
                        </div>
                     {/if}
                 </div>
                 
                <div class="flex justify-end mt-2">
                    <button onclick={onClose} class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow hover:bg-indigo-500 transition-colors w-full sm:w-auto">
                        {$t('session.affliction_modal.done')}
                    </button>
                </div>
            </div>
        </Modal>
    </div>
{/if}
