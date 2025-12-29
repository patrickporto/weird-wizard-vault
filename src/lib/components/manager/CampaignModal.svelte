<script>
    export let isOpen = false;
    export let initialData = "{}";
    export let onClose;
    export let onSave;

    let form = { name: '', description: '', gm: '', isPrivate: false };
    
    $: if (isOpen && initialData) {
        try {
            const parsed = JSON.parse(initialData);
            form = {
                name: parsed.name || '',
                description: parsed.description || '',
                gm: parsed.gm || '',
                isPrivate: parsed.isPrivate || false
            };
        } catch(e) {
            form = { name: '', description: '', gm: '', isPrivate: false };
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" on:click|self={onClose}>
    <div class="bg-slate-800 rounded-xl w-full max-w-md p-6 border border-slate-700 shadow-2xl">
        <h3 class="text-xl font-bold text-white mb-4">Campanha</h3>
        <div class="space-y-3">
            <div>
                 <label class="text-xs text-slate-500 uppercase font-bold block mb-1">Nome</label>
                 <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-hidden focus:border-indigo-500" placeholder="Nome da Campanha" bind:value={form.name} />
            </div>
            <div>
                 <label class="text-xs text-slate-500 uppercase font-bold block mb-1">Mestre (GM)</label>
                 <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-hidden focus:border-indigo-500" placeholder="Nome do Mestre" bind:value={form.gm} />
            </div>
            <div>
                 <label class="text-xs text-slate-500 uppercase font-bold block mb-1">Descrição</label>
                 <textarea class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-hidden focus:border-indigo-500 resize-none" rows="3" placeholder="Descrição breve..." bind:value={form.description}></textarea>
            </div>
            <div class="flex items-center gap-2 pt-2">
                 <input type="checkbox" id="isPrivate" bind:checked={form.isPrivate} class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"/>
                 <label for="isPrivate" class="text-sm text-slate-400 font-medium cursor-pointer">Campanha Privada (apenas o Mestre vê)</label>
            </div>
        </div>
        <div class="flex gap-3 mt-6">
            <button on:click={onClose} class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-bold">Cancelar</button>
            <button on:click={() => onSave(form)} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold">Salvar</button>
        </div>
    </div>
 </div>
{/if}
