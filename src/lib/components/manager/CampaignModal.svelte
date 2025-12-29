<script lang="ts">
    import { Shield } from 'lucide-svelte';
    import Modal from '$lib/components/common/Modal.svelte';

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

    let form = $state({ name: '', description: '', gmName: '', password: '', removePassword: false });
    let hasPassword = $state(false);
    let isEditing = $state(false); // True if editing existing campaign
    
    // Sync form state with initialData prop
    $effect(() => {
        if (isOpen) {
            try {
                const data = JSON.parse(initialData);
                form = {
                    name: data.name || '',
                    description: data.description || '',
                    gmName: data.gmName || '',
                    password: '',
                    removePassword: false
                };
                hasPassword = !!data.passwordHash;
                isEditing = !!data.id;
            } catch (e) {
                form = { name: '', description: '', gmName: '', password: '', removePassword: false };
                hasPassword = false;
                isEditing = false;
            }
        }
    });
    
    function handleSave() {
        onSave({
            ...form
        });
    }
</script>

<Modal {isOpen} {onClose} title={isEditing ? "Configurações da Campanha" : "Nova Campanha"} maxWidth="max-w-md">
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
        <div>
            <label for="campaign-pwd" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest flex items-center justify-between">
                <div class="flex items-center gap-1">
                    <Shield size={12}/> Senha de Acesso (Opcional)
                </div>
                {#if hasPassword}
                    <div class="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        Protegida
                    </div>
                {/if}
            </label>
            <div class="relative">
                <input 
                    type="password" 
                    id="campaign-pwd" 
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors pr-24" 
                    placeholder={hasPassword ? "Preencha para alterar..." : "Deixe em branco para sem senha"} 
                    bind:value={form.password} 
                />
                {#if hasPassword}
                    <button 
                        onclick={() => { form.removePassword = true; hasPassword = false; }} 
                        class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-1 rounded-md transition-colors"
                    >
                        Remover Senha
                    </button>
                {/if}
            </div>
            {#if form.removePassword}
                <p class="text-[10px] text-red-400 mt-1">A senha será removida ao salvar.</p>
            {:else}
                <p class="text-[10px] text-slate-500 mt-1">Defina uma senha para proteger o convite desta campanha.</p>
            {/if}
        </div>


    </div>
    <div class="flex flex-col-reverse sm:flex-row gap-3 mt-6">
        <button onclick={onClose} class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 sm:py-3 rounded-xl font-bold transition-all active:scale-95">Cancelar</button>
        <button onclick={handleSave} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 sm:py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all active:scale-95">{isEditing ? 'Salvar' : 'Criar Campanha'}</button>
    </div>
</Modal>


