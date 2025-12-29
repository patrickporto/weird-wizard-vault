<script lang="ts">
    interface Props {
        isOpen: boolean;
        title?: string;
        message?: string;
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
        onCancel: () => void;
    }

    let { 
        isOpen = false, 
        title = "Confirmar", 
        message = "Tem certeza?", 
        confirmText = "Confirmar", 
        cancelText = "Cancelar", 
        onConfirm, 
        onCancel 
    }: Props = $props();

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
    onclick={handleBackdropClick}
    role="button"
    aria-label="Fechar"
    tabindex="-1"
>
    <div class="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title" class="text-xl font-bold text-white mb-2">{title}</h3>
        <p class="text-slate-400 mb-6">{message}</p>
        <div class="flex gap-3">
            <button onclick={onCancel} class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded transition-colors">{cancelText}</button>
            <button onclick={onConfirm} class="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded transition-colors">{confirmText}</button>
        </div>
    </div>
</div>
{/if}
