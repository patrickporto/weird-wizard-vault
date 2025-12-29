<script lang="ts">
    interface Props {
        isOpen: boolean;
        initialData?: string;
        onClose: () => void;
        onSave: (form: any) => void;
    }

    let { 
        isOpen = false, 
        initialData = "{}", 
        onClose, 
        onSave 
    }: Props = $props();

    let form = $state({ name: '', description: '', gmName: '' });
    
    $effect(() => {
        if (isOpen && initialData) {
            try {
                const parsed = JSON.parse(initialData);
                form.name = parsed.name || '';
                form.description = parsed.description || '';
                form.gmName = parsed.gmName || '';
            } catch(e) {
                form.name = '';
                form.description = '';
                form.gmName = '';
            }
        }
    });

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" 
        onclick={handleBackdropClick}
        role="presentation"
    >
        <div 
            class="bg-slate-800 rounded-xl w-full max-w-md p-6 border border-slate-700 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-modal-title"
        >
            <h3 id="campaign-modal-title" class="text-xl font-bold text-white mb-4 tracking-tight">Configurações da Campanha</h3>
            <div class="space-y-4">
                <div>
                     <label for="campaign-name" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Nome da Campanha</label>
                     <input id="campaign-name" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Ex: A Sombra do Feiticeiro" bind:value={form.name} />
                </div>
                <div>
                     <label for="campaign-gm" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Mestre (GM)</label>
                     <input id="campaign-gm" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Seu nome ou apelido" bind:value={form.gmName} />
                </div>
                <div>
                     <label for="campaign-desc" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Descrição</label>
                     <textarea id="campaign-desc" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors resize-none" rows="3" placeholder="Uma breve descrição da sua jornada..." bind:value={form.description}></textarea>
                </div>

            </div>
            <div class="flex gap-3 mt-8">
                <button onclick={onClose} class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all active:scale-95">Cancelar</button>
                <button onclick={() => onSave({...form})} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all active:scale-95">Salvar</button>
            </div>
        </div>
     </div>
{/if}
