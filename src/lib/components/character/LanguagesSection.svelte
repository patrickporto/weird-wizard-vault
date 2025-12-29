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

<div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
    <div class="flex justify-between items-center mb-2">
        <h4 class="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Languages size={12}/> Idiomas
        </h4>
    </div>
    <div class="flex flex-wrap gap-1 mb-2">
        {#each $character.languages as lang, idx}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span class="bg-slate-950 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 group cursor-default">
                {lang}
                <button 
                    onclick={() => removeLanguage(idx)} 
                    class="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remover idioma {lang}"
                >
                    <X size={10}/>
                </button>
            </span>
        {/each}
    </div>
    <div class="relative">
        <input 
            type="text" 
            placeholder="Novo..." 
            class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-indigo-500" 
            onkeydown={handleKeyDown} 
            aria-label="Adicionar novo idioma"
        />
        <Plus size={12} class="absolute right-2 top-1.5 text-slate-600 pointer-events-none"/>
    </div>
</div>
