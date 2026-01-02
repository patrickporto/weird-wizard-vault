<script lang="ts">
    import { t } from 'svelte-i18n';
    import { SYSTEMS } from '$lib/systems';
    import { Check, Lock } from 'lucide-svelte';

    interface Props {
        selectedSystem: string;
        onSelect: (systemId: string) => void;
    }

    let { selectedSystem, onSelect }: Props = $props();

    const cover = {
        sofdl: '/artworks/books/sofdl-core.webp',
        sofww: '/artworks/books/sofww-core.webp',
        dle: '/artworks/books/dle-core.webp',
    };

    const positions: Record<string, string> = {
        dle: 'object-[center_75%]',
        sofww: 'object-center',
        sofdl: 'object-center'
    };

    function getCoverImage(systemId: string) {
        return cover[systemId as keyof typeof cover] || '';
    }

    function getObjectPosition(systemId: string) {
        return positions[systemId] || 'object-center';
    }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each SYSTEMS as system}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            onclick={() => !system.disabled && onSelect(system.id)}
            class="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border-2
            {selectedSystem === system.id ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.02]' : 'border-transparent hover:border-white/20 hover:scale-[1.01]'}
            {system.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}"
        >
            <!-- Background Image with Overlay -->
            <div class="absolute inset-0 bg-slate-900">
                <img
                    src={getCoverImage(system.id)}
                    alt={$t(system.nameKey)}
                    class="w-full h-full object-cover {getObjectPosition(system.id)} opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
            </div>

            <!-- Content -->
            <div class="relative p-6 h-full flex flex-col justify-end min-h-[200px]">
                {#if system.disabled}
                    <div class="absolute top-4 right-4 bg-black/50 p-2 rounded-full backdrop-blur-sm border border-white/10">
                        <Lock size={16} class="text-slate-400" />
                    </div>
                {/if}

                {#if selectedSystem === system.id}
                    <div class="absolute top-4 right-4 bg-indigo-500 p-2 rounded-full shadow-lg shadow-indigo-500/40 animate-in zoom-in duration-200">
                        <Check size={16} class="text-white" />
                    </div>
                {/if}

                <div>
                    <h3 class="text-xl font-black text-white uppercase leading-tight mb-2 group-hover:text-indigo-400 transition-colors">
                        {$t(system.nameKey)}
                    </h3>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed max-w-[90%]">
                        {$t(system.descriptionKey)}
                    </p>
                </div>
            </div>

            <!-- Selection Highlight Overlay -->
            <div class="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>
    {/each}
</div>
