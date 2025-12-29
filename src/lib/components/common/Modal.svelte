<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { X } from 'lucide-svelte';

    interface Props {
        isOpen: boolean;
        title?: string;
        onClose: () => void;
        children?: import('svelte').Snippet;
        maxWidth?: string;
    }

    let { 
        isOpen = false, 
        title = '', 
        onClose, 
        children,
        maxWidth = 'max-w-lg'
    }: Props = $props();

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
             onClose();
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" 
        onclick={handleBackdropClick}
        role="presentation"
        transition:fade={{ duration: 200 }}
    >
        <div 
            class="bg-slate-800 border-t sm:border border-slate-600 rounded-t-3xl sm:rounded-xl shadow-2xl w-full sm:mx-4 {maxWidth} max-h-[90vh] sm:max-h-[90vh] overflow-hidden flex flex-col relative"
            role="dialog"
            aria-modal="true"
            tabindex="-1"
            transition:fly={{ y: 100, duration: 300, easing: quintOut }}
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Mobile drag handle indicator -->
            <div class="sm:hidden w-12 h-1 bg-slate-600 rounded-full mx-auto mt-3 mb-1"></div>
            
            {#if title}
                <div class="bg-slate-900 px-4 py-3 sm:p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <h3 class="font-bold text-lg text-white flex items-center gap-2">
                        {title}
                    </h3>
                    <button onclick={onClose} class="text-slate-400 hover:text-white transition-colors p-2 -mr-2 active:scale-90" aria-label="Fechar"><X size={22} /></button>
                </div>
            {:else}
                 <button onclick={onClose} class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-2 active:scale-90" aria-label="Fechar"><X size={22} /></button>
            {/if}
            
            <div class="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 pb-safe">
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}
