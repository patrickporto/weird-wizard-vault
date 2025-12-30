<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Heading1, Heading2, List, ListOrdered, Quote, Code, Type, CheckSquare } from 'lucide-svelte';

    let { items, command, editor, location } = $props();

    let selectedIndex = $state(0);
    let menuElement: HTMLElement;

    // Reset selection when items change
    $effect(() => {
        if (items) {
            selectedIndex = 0;
        }
    });

    export const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
            upHandler();
            return true;
        }

        if (event.key === 'ArrowDown') {
            downHandler();
            return true;
        }

        if (event.key === 'Enter') {
            enterHandler();
            return true;
        }

        return false;
    };

    const upHandler = () => {
        selectedIndex = (selectedIndex + items.length - 1) % items.length;
    };

    const downHandler = () => {
        selectedIndex = (selectedIndex + 1) % items.length;
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    const selectItem = (index: number) => {
        const item = items[index];
        if (item) {
            command(item);
        }
    };

    // Icons map for valid Lucid icons
    const icons = {
        Heading1,
        Heading2,
        List,
        ListOrdered,
        Quote,
        Code,
        Type,
        CheckSquare
    };
</script>

<div
    bind:this={menuElement}
    class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[200px] p-1.5 flex flex-col gap-0.5 z-[9999]"
>
    {#if items.length}
        {#each items as item, index}
            <button
                class="flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-lg transition-colors {index === selectedIndex ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-slate-800 text-slate-400'}"
                onclick={() => selectItem(index)}
            >
                {#if item.icon && icons[item.icon]}
                    {@const Icon = icons[item.icon]}
                    <div class="p-1 rounded bg-slate-800 border border-slate-700 {index === selectedIndex ? 'border-indigo-500/30' : ''}">
                        <Icon size={14} />
                    </div>
                {/if}
                <div class="flex flex-col">
                    <span class="text-xs font-bold {index === selectedIndex ? 'text-indigo-200' : 'text-slate-200'}">{item.title}</span>
                    <span class="text-[10px] opacity-70 truncate max-w-[140px]">{item.description || ''}</span>
                </div>
            </button>
        {/each}
    {:else}
        <div class="px-3 py-2 text-xs text-slate-500">Sem resultados</div>
    {/if}
</div>
