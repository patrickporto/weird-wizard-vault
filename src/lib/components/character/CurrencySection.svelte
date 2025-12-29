<script lang="ts">
    import { character, characterActions } from '$lib/stores/characterStore';
    import { Coins, Minus, Plus } from 'lucide-svelte';

    const { updateCurrency } = characterActions;
</script>

<div class="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xl shadow-black/20">
    <div class="flex justify-between items-center mb-3">
        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Coins size={14} class="text-yellow-500"/> Moedas
        </h4>
    </div>
    
    <div class="grid grid-cols-3 gap-2">
        <!-- GP -->
        <div class="bg-slate-950 rounded-xl p-2 border border-slate-800/50 flex flex-col items-center gap-1.5 relative overflow-hidden group">
            <div class="text-[9px] text-yellow-500 font-black uppercase tracking-tight relative z-10">GP</div>
            <div class="flex items-center justify-between w-full relative z-10 bg-black/40 rounded-lg p-0.5 border border-white/5">
                <button 
                    onclick={() => updateCurrency('gp', -1)} 
                    class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all active:scale-75" 
                    aria-label="Diminuir GP"
                >
                    <Minus size={14}/>
                </button>
                <span class="text-sm font-black text-white font-mono leading-none">{$character.currency.gp}</span>
                <button 
                    onclick={() => updateCurrency('gp', 1)} 
                    class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-all active:scale-75" 
                    aria-label="Aumentar GP"
                >
                    <Plus size={14}/>
                </button>
            </div>
        </div>

        <!-- SP -->
        <div class="bg-slate-950 rounded-xl p-2 border border-slate-800/50 flex flex-col items-center gap-1.5 relative overflow-hidden group">
            <div class="text-[9px] text-slate-300 font-black uppercase tracking-tight relative z-10">SP</div>
            <div class="flex items-center justify-between w-full relative z-10 bg-black/40 rounded-lg p-0.5 border border-white/5">
                <button 
                    onclick={() => updateCurrency('sp', -1)} 
                    class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all active:scale-75" 
                    aria-label="Diminuir SP"
                >
                    <Minus size={14}/>
                </button>
                <span class="text-sm font-black text-white font-mono leading-none">{$character.currency.sp}</span>
                <button 
                    onclick={() => updateCurrency('sp', 1)} 
                    class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-all active:scale-75" 
                    aria-label="Aumentar SP"
                >
                    <Plus size={14}/>
                </button>
            </div>
        </div>

        <!-- CP -->
        <div class="bg-slate-950 rounded-xl p-2 border border-slate-800/50 flex flex-col items-center gap-1.5 relative overflow-hidden group">
            <div class="text-[9px] text-orange-700/80 font-black uppercase tracking-tight relative z-10">CP</div>
            <div class="flex items-center justify-between w-full relative z-10 bg-black/40 rounded-lg p-0.5 border border-white/5">
                <button 
                    onclick={() => updateCurrency('cp', -1)} 
                    class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all active:scale-75" 
                    aria-label="Diminuir CP"
                >
                    <Minus size={14}/>
                </button>
                <span class="text-sm font-black text-white font-mono leading-none">{$character.currency.cp}</span>
                <button 
                    onclick={() => updateCurrency('cp', 1)} 
                    class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-all active:scale-75" 
                    aria-label="Aumentar CP"
                >
                    <Plus size={14}/>
                </button>
            </div>
        </div>
    </div>
</div>


