<script lang="ts">
    import { t } from 'svelte-i18n';
    import { character, modalState, derivedStats } from '$lib/stores/characterStore';
    import { Edit } from 'lucide-svelte';

    function openModal(type: string, data: any) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }

    function handleAttributeClick(attr: any) {
        openModal('pre_roll', { type: 'attribute', source: attr });
    }

    function handleEditClick(e: MouseEvent, attr: any) {
        e.stopPropagation();
        openModal('attribute', attr);
    }
</script>

<div class="grid grid-cols-2 gap-3">
    {#each $character.attributes as attr}
       <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
           onclick={() => handleAttributeClick(attr)}
           class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 p-3 text-left transition-all hover:bg-slate-800 active:scale-[0.98] group relative shadow-lg shadow-black/20 cursor-pointer flex flex-col"
           role="button"
           tabindex="0"
           aria-label={`${$t(`sofww.attributes.${attr.key}`)} roll`}
       >
            <div class="flex justify-between items-start w-full mb-2">
                <div class="text-[9px] uppercase text-slate-500 font-black tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 min-w-0 pr-1">
                    <span class="truncate">{$t(`sofww.attributes.${attr.key}`)}</span>
                </div>

                <button
                    onclick={(e) => handleEditClick(e, attr)}
                    class="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-white bg-slate-800/50 hover:bg-indigo-600 rounded-md transition-all flex-shrink-0 -mt-1 -mr-1"
                    aria-label={`${$t('common.buttons.edit')} ${$t(`sofww.attributes.${attr.key}`)}`}
                >
                    <Edit size={12} />
                </button>
            </div>

            <div class="flex items-baseline gap-2 mb-1">
                <div class="text-3xl font-black text-white leading-none">
                    {$derivedStats[attr.key]}
                </div>
                {#if $derivedStats[attr.key] !== attr.value}
                    <div class="text-[11px] font-bold {$derivedStats[attr.key] > attr.value ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                        {$derivedStats[attr.key] > attr.value ? '+' : ''}{$derivedStats[attr.key] - attr.value}
                    </div>
                {/if}
            </div>

            <div class="inline-flex self-start px-2 py-0.5 bg-indigo-500/10 rounded-lg mt-auto">
                <div class="text-xs text-indigo-400 font-black tracking-tight">+{ $derivedStats[attr.key] - 10}</div>
            </div>
       </div>
    {/each}
 </div>
