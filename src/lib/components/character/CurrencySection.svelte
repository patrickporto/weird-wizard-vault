<script>
    import { character, characterActions } from '$lib/stores/characterStore';
    import { Coins, Minus, Plus } from 'lucide-svelte';

    const { updateCurrency } = characterActions;
</script>

<div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
    <div class="flex justify-between items-center mb-2"><h4 class="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Coins size={12}/> Moedas</h4></div>
    <div class="grid grid-cols-3 gap-2 text-center">
        <div class="bg-slate-950 rounded p-1 border border-slate-800"><div class="text-[9px] text-yellow-500 font-bold uppercase">GP</div><div class="flex items-center justify-between px-1"><button on:click={()=>updateCurrency('gp',-1)} class="text-slate-600 hover:text-red-400"><Minus size={10}/></button><span class="text-white font-mono text-sm">{$character.currency.gp}</span><button on:click={()=>updateCurrency('gp',1)} class="text-slate-600 hover:text-green-400"><Plus size={10}/></button></div></div>
        <div class="bg-slate-950 rounded p-1 border border-slate-800"><div class="text-[9px] text-slate-300 font-bold uppercase">SP</div><div class="flex items-center justify-between px-1"><button on:click={()=>updateCurrency('sp',-1)} class="text-slate-600 hover:text-red-400"><Minus size={10}/></button><span class="text-white font-mono text-sm">{$character.currency.sp}</span><button on:click={()=>updateCurrency('sp',1)} class="text-slate-600 hover:text-green-400"><Plus size={10}/></button></div></div>
        <div class="bg-slate-950 rounded p-1 border border-slate-800"><div class="text-[9px] text-orange-700 font-bold uppercase">CP</div><div class="flex items-center justify-between px-1"><button on:click={()=>updateCurrency('cp',-1)} class="text-slate-600 hover:text-red-400"><Minus size={10}/></button><span class="text-white font-mono text-sm">{$character.currency.cp}</span><button on:click={()=>updateCurrency('cp',1)} class="text-slate-600 hover:text-green-400"><Plus size={10}/></button></div></div>
    </div>
 </div>
