<script>
    export let isOpen = false;
    export let title = "Confirmar";
    export let message = "Tem certeza?";
    export let confirmText = "Confirmar";
    export let cancelText = "Cancelar";
    export let onConfirm;
    export let onCancel;
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" on:click|self={onCancel}>
    <div class="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-sm" role="dialog" aria-modal="true">
        <h3 class="text-xl font-bold text-white mb-2">{title}</h3>
        <p class="text-slate-400 mb-6">{message}</p>
        <div class="flex gap-3">
            <button on:click={onCancel} class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded transition-colors">{cancelText}</button>
            <button on:click={onConfirm} class="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded transition-colors">{confirmText}</button>
        </div>
    </div>
</div>
{/if}
