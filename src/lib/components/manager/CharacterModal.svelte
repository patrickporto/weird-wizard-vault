<script lang="ts">
    import { User } from 'lucide-svelte';
    import Modal from '$lib/components/common/Modal.svelte';

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
        playerName: '',
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
                form.playerName = parsed.playerName || '';
                form.ancestry = parsed.ancestry || '';
                form.novicePath = (parsed.paths && parsed.paths.novice) ? parsed.paths.novice : '';
                form.level = parsed.level || 1;
                form.defense = parsed.defense || 10;
                form.health = parsed.health || (parsed.normalHealth) || 24;
            } catch(e) {
                form.name = '';
                form.playerName = '';
                form.ancestry = '';
                form.novicePath = '';
                form.level = 1;
                form.defense = 10;
                form.health = 24;
            }
        }
    });

    function handleSave() {
        onSave({...form});
    }
</script>

<Modal {isOpen} {onClose} title="Novo Personagem" maxWidth="max-w-md">
    <div class="space-y-4">
        <div>
            <label for="char-name" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest">Nome do Personagem</label>
            <input id="char-name" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Ex: Alaric, o Errante" bind:value={form.name}/>
        </div>
        <div>
            <label for="char-player" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest flex items-center gap-1">
                <User size={12} /> Nome do Jogador
            </label>
            <input id="char-player" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Seu nome ou apelido" bind:value={form.playerName}/>
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
        <button onclick={handleSave} class="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-all py-3 rounded-xl text-white font-bold shadow-lg shadow-indigo-900/20 active:scale-95">Criar Personagem</button>
    </div>
</Modal>
