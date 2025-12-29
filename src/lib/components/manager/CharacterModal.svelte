<script lang="ts">
    interface Props {
        isOpen: boolean;
        initialData?: string; // JSON string
        onClose: () => void;
        onSave: (form: any) => void;
    }

    let { 
        isOpen = false, 
        initialData = "{}", 
        onClose, 
        onSave 
    }: Props = $props();

    let form = $state({ 
        name: '', 
        ancestry: '', 
        novicePath: '', 
        level: 1, 
        defense: 10, 
        health: 24 
    });
    
    $effect(() => {
        if (isOpen && initialData) {
            try {
                const parsed = JSON.parse(initialData);
                form.name = parsed.name || '';
                form.ancestry = parsed.ancestry || '';
                form.novicePath = (parsed.paths && parsed.paths.novice) ? parsed.paths.novice : '';
                form.level = parsed.level || 1;
                form.defense = parsed.defense || 10;
                form.health = parsed.health || (parsed.normalHealth) || 24;
            } catch(e) {
                form.name = '';
                form.ancestry = '';
                form.novicePath = '';
                form.level = 1;
                form.defense = 10;
                form.health = 24;
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
            aria-labelledby="character-modal-title"
        >
            <h3 id="character-modal-title" class="font-bold text-white text-lg mb-4 tracking-tight">Configurações do Personagem</h3>
            <div class="space-y-4">
                <div>
                    <label for="char-name" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Nome</label>
                    <input id="char-name" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Ex: Alaric" bind:value={form.name}/>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="char-ancestry" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Ancestralidade</label>
                        <input id="char-ancestry" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Ex: Humano" bind:value={form.ancestry}/>
                    </div>
                    <div>
                        <label for="char-level" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Nível</label>
                        <input id="char-level" type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" bind:value={form.level}/>
                    </div>
                </div>
                <div>
                    <label for="char-path" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Trilha Inicial (Novice)</label>
                    <input id="char-path" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Ex: Guerreiro, Mago" bind:value={form.novicePath}/>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="char-defense" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Defesa</label>
                        <input id="char-defense" type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" bind:value={form.defense}/>
                    </div>
                    <div>
                        <label for="char-health" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Vida Máxima</label>
                        <input id="char-health" type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" bind:value={form.health}/>
                    </div>
                </div>
            </div>
            <div class="flex gap-3 mt-8">
                <button onclick={onClose} class="flex-1 bg-slate-700 hover:bg-slate-600 transition-all py-3 rounded-xl text-white font-bold active:scale-95">Cancelar</button>
                <button onclick={() => onSave({...form})} class="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-all py-3 rounded-xl text-white font-bold shadow-lg shadow-indigo-900/20 active:scale-95">Salvar</button>
            </div>
        </div>
    </div>
{/if}
