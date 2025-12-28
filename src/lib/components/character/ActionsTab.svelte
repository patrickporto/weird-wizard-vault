<script>
    import { character, modalState, characterActions } from '$lib/stores/characterStore';
    import { Sword, Bomb, Wand2, Zap } from 'lucide-svelte';
    import { ITEM_TYPES } from '../../../routes/sofww';

    const { useConsumable } = characterActions;

    function openModal(type, data = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }
</script>

<div class="space-y-4">
    {#each $character.equipment.filter(i => (i.type === ITEM_TYPES.WEAPON && i.equippedState) || i.type === ITEM_TYPES.EXPLOSIVE) as item}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div on:click={() => openModal('weapon_menu', item)} class="flex flex-col sm:flex-row justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-900 cursor-pointer transition-colors gap-4 active:scale-[0.99]">
            <div class="flex items-start gap-3">
                <div class="bg-slate-800 p-2 rounded text-slate-400 mt-1"><Sword size={20}/></div>
                <div><p class="font-bold text-white flex items-center gap-2">{item.name} {#if item.equippedState}<span class="text-[10px] bg-indigo-900 text-indigo-200 px-1 rounded uppercase">{item.equippedState}</span>{/if}</p><p class="text-xs text-slate-500">{item.traits || '-'} • {item.range || '-'}</p></div>
            </div>
            <div class="flex flex-col items-end gap-2">
                <div class="flex items-center gap-4 bg-slate-900 p-2 rounded-lg border border-slate-800"><div class="text-center px-2"><span class="block text-[10px] font-bold text-slate-500 uppercase">Dano</span><span class="text-xl font-mono text-white font-bold">{item.damageDice || 0}d6</span></div></div>
                {#if item.type === ITEM_TYPES.EXPLOSIVE}<button on:click|stopPropagation={() => useConsumable(item)} class="text-xs bg-red-900/50 text-red-200 px-3 py-1 rounded border border-red-800 hover:bg-red-900 flex items-center gap-1"><Bomb size={12}/> Throw ({item.quantity})</button>{/if}
            </div>
        </div>
    {/each}
    {#if $character.spells.length > 0}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div on:click={() => openModal('cast_spell')} class="flex flex-col sm:flex-row items-center p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-500 cursor-pointer transition-colors gap-4 group">
            <div class="flex items-start gap-3 w-full"><div class="bg-indigo-900/50 p-2 rounded text-indigo-300 mt-1"><Wand2 size={20}/></div><div><p class="font-bold text-white flex items-center gap-2 group-hover:text-indigo-300 transition-colors">Conjurar Magia</p><p class="text-xs text-slate-500">Selecione uma magia do grimório para lançar.</p></div></div>
            <div class="ml-auto"><div class="bg-slate-900 px-3 py-1 rounded text-xs font-bold text-indigo-400 uppercase tracking-wider border border-slate-800">Selecionar</div></div>
        </div>
    {/if}
    {#if $character.talents.length > 0}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div on:click={() => openModal('select_talent')} class="flex flex-col sm:flex-row items-center p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-yellow-600 cursor-pointer transition-colors gap-4 group">
            <div class="flex items-start gap-3 w-full"><div class="bg-yellow-900/30 p-2 rounded text-yellow-300 mt-1"><Zap size={20}/></div><div><p class="font-bold text-white flex items-center gap-2 group-hover:text-yellow-300 transition-colors">Usar Talento</p><p class="text-xs text-slate-500">Ative uma habilidade ou talento especial.</p></div></div>
            <div class="ml-auto"><div class="bg-slate-900 px-3 py-1 rounded text-xs font-bold text-yellow-500 uppercase tracking-wider border border-slate-800">Selecionar</div></div>
        </div>
    {/if}
 </div>
