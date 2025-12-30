<script lang="ts">
    import { t } from 'svelte-i18n';
    import { character, characterActions } from '$lib/stores/characterStore';
    import { Eye, X, Plus, Info } from 'lucide-svelte';
    import tippy from 'tippy.js';
    import 'tippy.js/dist/tippy.css';

    const { addSense, removeSense } = characterActions;

    let selectedSense = $state("");
    let senseValue = $state("");

    // Reactive list of sense keys from translations
    let senseOptions = $derived(Object.keys($t('character.senses.list')));

    function handleAdd() {
        if (!selectedSense) return;

        let finalSense = selectedSense;
        if (selectedSense === 'awareness' && senseValue) {
            finalSense = `${selectedSense}:${senseValue}`;
        }

        addSense(finalSense);

        // Reset
        selectedSense = "";
        senseValue = "";
    }

    function tooltip(node: HTMLElement, { content }: { content: string }) {
        const instance = tippy(node, {
            content,
            placement: 'top',
            arrow: true,
            theme: 'light-border'
        });

        return {
            update({ content }: { content: string }) {
                instance.setContent(content);
            },
            destroy() {
                instance.destroy();
            }
        };
    }

    function getSenseLabel(senseString: string): string {
        const [key, val] = senseString.split(':');
        let label = $t(`character.senses.list.${key}`);
        if (val) label += ` ${val}`;
        return label;
    }

    function getSenseDescription(senseString: string): string {
        const [key, val] = senseString.split(':');
        let desc = $t(`character.senses.descriptions.${key}`);
        if (val) {
             // Replace "listed number" or general placeholder if needed,
             // but generic description usually fits.
             // "within the listed number in yards" -> "within 5 yards" could be dynamic but static is fine.
        }
        return desc;
    }
</script>

<div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl shadow-black/20">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
        <h4 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Eye size={16} class="text-emerald-500"/> {$t('character.senses.title')}
        </h4>
    </div>

    <!-- Tags List -->
    <div class="flex flex-wrap gap-2 mb-4">
        {#each $character.senses || [] as sense, idx}
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div
                class="bg-slate-950 border border-emerald-900/30 text-emerald-100 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2 group transition-all hover:border-emerald-500/50 cursor-help"
                use:tooltip={{ content: getSenseDescription(sense) }}
                tabindex="0"
            >
                {getSenseLabel(sense)}
                <button
                    onclick={() => removeSense(idx)}
                    class="text-emerald-500/50 hover:text-red-400 p-1 rounded-full hover:bg-red-400/10 transition-all"
                    aria-label="Remove"
                >
                    <X size={14}/>
                </button>
            </div>
        {/each}
        {#if (!$character.senses || $character.senses.length === 0)}
            <span class="text-sm text-slate-500 italic py-2 px-1">Nenhum sentido especial.</span>
        {/if}
    </div>

    <!-- Controls -->
    <div class="flex gap-2 items-start">
        <div class="flex-1 relative">
            <select
                bind:value={selectedSense}
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none"
            >
                <option value="" disabled selected>{$t('character.senses.select_placeholder')}</option>
                {#each senseOptions as opt}
                     <option value={opt}>{$t(`character.senses.list.${opt}`)}</option>
                {/each}
            </select>
            <!-- Dropdown Arrow -->
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
            </div>
        </div>

        {#if selectedSense === 'awareness'}
            <div class="w-24">
                <input
                    type="number"
                    bind:value={senseValue}
                    placeholder="#"
                    class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all text-center"
                />
            </div>
        {/if}

        <button
            onclick={handleAdd}
            disabled={!selectedSense || (selectedSense === 'awareness' && !senseValue)}
            class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
        >
            <Plus size={20}/>
        </button>
    </div>
</div>
