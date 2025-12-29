<script lang="ts">
    import { Settings, User } from 'lucide-svelte';
    import Modal from '$lib/components/common/Modal.svelte';

    interface Props {
        isOpen: boolean;
        characterData: any; // Full character object
        onClose: () => void;
        onSave: (updates: any) => void;
    }

    let { 
        isOpen = false, 
        characterData = null,
        onClose, 
        onSave 
    }: Props = $props();

    // Editable fields
    let playerName = $state('');
    
    $effect(() => {
        if (isOpen && characterData) {
            playerName = characterData.playerName || '';
        }
    });

    function handleSave() {
        onSave({
            playerName
        });
    }
</script>

<Modal {isOpen} {onClose} title="⚙️ Configurações do Personagem" maxWidth="max-w-md">
    <div class="space-y-5">
        <!-- Player Name -->
        <div>
            <label for="settings-player-name" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest flex items-center gap-1">
                <User size={12} /> Nome do Jogador
            </label>
            <input 
                id="settings-player-name" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" 
                placeholder="Seu nome ou apelido" 
                bind:value={playerName}
            />
            <p class="text-[10px] text-slate-500 mt-1">O nome do jogador associado a este personagem.</p>
        </div>


    </div>

    <div class="flex flex-col-reverse sm:flex-row gap-3 mt-6">
        <button onclick={onClose} class="flex-1 bg-slate-700 hover:bg-slate-600 transition-all py-4 sm:py-3 rounded-xl text-white font-bold active:scale-95">Cancelar</button>
        <button onclick={handleSave} class="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-all py-4 sm:py-3 rounded-xl text-white font-bold shadow-lg shadow-indigo-900/20 active:scale-95">Salvar</button>
    </div>
</Modal>
