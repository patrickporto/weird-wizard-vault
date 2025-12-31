<script lang="ts">
    import { t } from 'svelte-i18n';
    import { sotdlCharacter, sotdlModifiers, sotdlAttributes } from '$lib/stores/characterStoreSotDL';
    import { modalState } from '$lib/stores/characterStore';
    import { Edit } from 'lucide-svelte';

    function openModal(type: string, data: any) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }

    function handleAttributeClick(key: string) {
        openModal('pre_roll', { type: 'attribute', system: 'sofdl', key });
    }

    function handleEditClick(e: MouseEvent, key: string) {
        e.stopPropagation();
        openModal('attribute', { system: 'sofdl', key, value: $sotdlCharacter.attributes[key as keyof typeof $sotdlCharacter.attributes] });
    }

    const attrs = [
        { key: 'strength', label: 'sofdl.attributes.strength' },
        { key: 'agility', label: 'sofdl.attributes.agility' },
        { key: 'intellect', label: 'sofdl.attributes.intellect' },
        { key: 'will', label: 'sofdl.attributes.will' }
    ];
</script>

<div class="grid grid-cols-2 gap-3">
    {#each attrs as attr}
       <!-- svelte-ignore a11y_click_events_have_key_events -->
       <div
           onclick={() => handleAttributeClick(attr.key)}
           class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 text-center transition-all hover:bg-slate-800 active:scale-[0.98] group relative shadow-lg shadow-black/20 cursor-pointer"
           role="button"
           tabindex="0"
           aria-label={`${$t(attr.label)} roll`}
       >
          <div class="py-2.5 px-2">
            <div class="text-[9px] uppercase text-slate-500 font-black tracking-widest group-hover:text-indigo-400 transition-colors mb-1">{$t(attr.label)}</div>

            <div class="flex items-center justify-center gap-1.5 mb-1.5">
                <div class="text-2xl font-black text-white leading-none">
                    {$sotdlAttributes[attr.key as keyof typeof $sotdlAttributes]}
                </div>
                {#if $sotdlAttributes[attr.key as keyof typeof $sotdlAttributes] !== $sotdlCharacter.attributes[attr.key as keyof typeof $sotdlCharacter.attributes]}
                    <div class="text-[11px] font-bold {$sotdlAttributes[attr.key as keyof typeof $sotdlAttributes] > $sotdlCharacter.attributes[attr.key as keyof typeof $sotdlCharacter.attributes] ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                        {$sotdlAttributes[attr.key as keyof typeof $sotdlAttributes] > $sotdlCharacter.attributes[attr.key as keyof typeof $sotdlCharacter.attributes] ? '+' : ''}{$sotdlAttributes[attr.key as keyof typeof $sotdlAttributes] - $sotdlCharacter.attributes[attr.key as keyof typeof $sotdlCharacter.attributes]}
                    </div>
                {/if}
            </div>

            <div class="inline-flex px-2 py-0.5 bg-indigo-500/10 rounded-lg">
                <div class="text-xs text-indigo-400 font-black tracking-tight">
                    {$sotdlModifiers[attr.key as keyof typeof $sotdlModifiers] >= 0 ? '+' : ''}{$sotdlModifiers[attr.key as keyof typeof $sotdlModifiers]}
                </div>
            </div>
          </div>

          <button
              onclick={(e) => handleEditClick(e, attr.key)}
              class="absolute top-1 right-1 w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white bg-slate-800/80 hover:bg-indigo-600 rounded-lg transition-all shadow-sm border border-slate-700/50 hover:border-indigo-500/50 active:scale-90"
              aria-label={`${$t('common.buttons.edit')} ${$t(attr.label)}`}
          >
              <Edit size={14} />
          </button>
       </div>
    {/each}
 </div>
