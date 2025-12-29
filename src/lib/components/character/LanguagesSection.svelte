<script lang="ts">
    import { character, characterActions } from '$lib/stores/characterStore';
    import { Languages, X, Plus } from 'lucide-svelte';

    const { addLanguage, removeLanguage } = characterActions;

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            const value = target.value.trim();
            if (value !== "") {
                addLanguage(value);
                target.value = '';
            }
        }
    }
</script>

<div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl shadow-black/20">
    <div class="flex justify-between items-center mb-4">
        <h4 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Languages size={16} class="text-indigo-500"/> Idiomas
        </h4>
    </div>
    
    <div class="flex flex-wrap gap-2 mb-4">
        {#each $character.languages as lang, idx}
            <div class="bg-slate-950 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2 group transition-all hover:border-indigo-500/50">
                {lang}
                <button 
                    onclick={() => removeLanguage(idx)} 
                    class="text-slate-500 hover:text-red-400 p-1 rounded-full hover:bg-red-400/10 transition-all"
                    aria-label="Remover idioma {lang}"
                >
                    <X size={14}/>
                </button>
            </div>
        {/each}
        {#if $character.languages.length === 0}
            <span class="text-sm text-slate-500 italic py-2 px-1">Nenhum idioma registrado.</span>
        {/if}
    </div>

    <div class="relative group">
        <input 
            type="text" 
            placeholder="Adicionar novo idioma..." 
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500/20" 
            onkeydown={handleKeyDown} 
            aria-label="Adicionar novo idioma"
        />
        <div class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-800 rounded-lg text-slate-500 group-focus-within:text-indigo-400 group-focus-within:bg-indigo-400/10 transition-all">
            <Plus size={16}/>
        </div>
    </div>
</div>

