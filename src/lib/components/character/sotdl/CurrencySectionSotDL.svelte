<script lang="ts">
    import { t } from 'svelte-i18n';
    import { sotdlCharacter, sotdlCharacterActions } from '$lib/stores/characterStoreSotDL';
    import { Coins, Minus, Plus } from 'lucide-svelte';

    const { updateCurrency } = sotdlCharacterActions;
</script>

<div class="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xl shadow-black/20">
    <div class="flex justify-between items-center mb-3">
        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Coins size={14} class="text-yellow-500"/> {$t('character.currency.title')}
        </h4>
    </div>

    <div class="grid grid-cols-4 gap-2">
        <!-- GC (Gold Crowns) -->
        <div class="bg-slate-950 rounded-xl p-2 border border-slate-800/50 flex flex-col items-center gap-1.5 relative overflow-hidden group">
            <div class="text-[9px] text-yellow-500 font-black uppercase tracking-tight relative z-10">gc</div>
            <div class="flex items-center justify-between w-full relative z-10 bg-black/40 rounded-lg p-0.5 border border-white/5">
                <button
                    onclick={() => updateCurrency('gc', -1)}
                    class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all active:scale-75"
                    aria-label="Remover GC"
                >
                    <Minus size={12}/>
                </button>
                <span class="text-sm font-black text-white font-mono leading-none">{$sotdlCharacter.currency.gc}</span>
                <button
                    onclick={() => updateCurrency('gc', 1)}
                    class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-all active:scale-75"
                    aria-label="Adicionar GC"
                >
                    <Plus size={12}/>
                </button>
            </div>
        </div>

        <!-- SS (Silver Shillings) -->
        <div class="bg-slate-950 rounded-xl p-2 border border-slate-800/50 flex flex-col items-center gap-1.5 relative overflow-hidden group">
            <div class="text-[9px] text-slate-300 font-black uppercase tracking-tight relative z-10">ss</div>
            <div class="flex items-center justify-between w-full relative z-10 bg-black/40 rounded-lg p-0.5 border border-white/5">
                <button
                    onclick={() => updateCurrency('ss', -1)}
                    class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all active:scale-75"
                    aria-label="Remover SS"
                >
                    <Minus size={12}/>
                </button>
                <span class="text-sm font-black text-white font-mono leading-none">{$sotdlCharacter.currency.ss}</span>
                <button
                    onclick={() => updateCurrency('ss', 1)}
                    class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-all active:scale-75"
                    aria-label="Adicionar SS"
                >
                    <Plus size={12}/>
                </button>
            </div>
        </div>

        <!-- CP (Copper Pennies) -->
        <div class="bg-slate-950 rounded-xl p-2 border border-slate-800/50 flex flex-col items-center gap-1.5 relative overflow-hidden group">
            <div class="text-[9px] text-orange-700/80 font-black uppercase tracking-tight relative z-10">cp</div>
            <div class="flex items-center justify-between w-full relative z-10 bg-black/40 rounded-lg p-0.5 border border-white/5">
                <button
                    onclick={() => updateCurrency('cp', -1)}
                    class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all active:scale-75"
                    aria-label="Remover CP"
                >
                    <Minus size={12}/>
                </button>
                <span class="text-sm font-black text-white font-mono leading-none">{$sotdlCharacter.currency.cp}</span>
                <button
                    onclick={() => updateCurrency('cp', 1)}
                    class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-all active:scale-75"
                    aria-label="Adicionar CP"
                >
                    <Plus size={12}/>
                </button>
            </div>
        </div>

         <!-- Bits -->
         <div class="bg-slate-950 rounded-xl p-2 border border-slate-800/50 flex flex-col items-center gap-1.5 relative overflow-hidden group">
            <div class="text-[9px] text-amber-900/60 font-black uppercase tracking-tight relative z-10">bits</div>
            <div class="flex items-center justify-between w-full relative z-10 bg-black/40 rounded-lg p-0.5 border border-white/5">
                <button
                    onclick={() => updateCurrency('bits', -1)}
                    class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all active:scale-75"
                    aria-label="Remover Bits"
                >
                    <Minus size={12}/>
                </button>
                <span class="text-sm font-black text-white font-mono leading-none">{$sotdlCharacter.currency.bits}</span>
                <button
                    onclick={() => updateCurrency('bits', 1)}
                    class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-all active:scale-75"
                    aria-label="Adicionar Bits"
                >
                    <Plus size={12}/>
                </button>
            </div>
        </div>
    </div>
</div>
