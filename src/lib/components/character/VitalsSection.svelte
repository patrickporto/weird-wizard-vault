<script lang="ts">
    import { character, modalState, totalDefense, effectiveSpeed } from '$lib/stores/characterStore';
    import { Shield, Zap, Sword, Minus, Plus, Activity } from 'lucide-svelte';

    function openModal(type: string, data: any) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }

    function decreaseBonusDamage() {
        character.update(c => ({...c, bonusDamage: Math.max(0, (c.bonusDamage || 0) - 1)}));
    }

    function increaseBonusDamage() {
        character.update(c => ({...c, bonusDamage: (c.bonusDamage || 0) + 1}));
    }
</script>

<div class="space-y-3">
    <div class="grid grid-cols-2 gap-3">
        <button 
            onclick={() => openModal('stat', 'defense')} 
            class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 p-3 text-left transition-all hover:bg-slate-800 active:scale-95 group shadow-lg shadow-black/20"
        >
            <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 mb-2">
                <Shield size={12}/> Defesa
            </div>
            <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-white leading-none">{$totalDefense}</span>
            </div>
        </button>

        <button 
            onclick={() => openModal('stat', 'speed')} 
            class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 p-3 text-left transition-all hover:bg-slate-800 active:scale-95 group shadow-lg shadow-black/20"
        >
            <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 mb-2">
                <Zap size={12}/> Speed
            </div>
            <div class="flex items-baseline justify-between w-full">
                <span class="text-3xl font-black {$effectiveSpeed < $character.speed ? 'text-red-400' : 'text-white'} leading-none">{$effectiveSpeed}</span>
                {#if $effectiveSpeed < $character.speed}
                    <div class="p-1 bg-red-500/10 rounded">
                        <Activity size={10} class="text-red-500"/>
                    </div>
                {/if}
            </div>
        </button>
    </div>

    <!-- Bonus Damage Controller -->
    <div class="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-lg shadow-black/20">
        <span class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Sword size={14} class="text-indigo-500"/> Bônus de Dano
        </span>
        <div class="flex items-center justify-between bg-black/40 rounded-xl p-1.5 border border-white/5">
            <button 
                onclick={decreaseBonusDamage} 
                class="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all active:scale-90" 
                aria-label="Diminuir Dano Bônus"
            >
                <Minus size={18}/>
            </button>
            <div class="flex flex-col items-center">
                <span class="text-2xl font-black text-white leading-none tracking-tighter">{$character.bonusDamage || 0}d6</span>
                <span class="text-[9px] text-slate-600 font-bold uppercase mt-1">Dados Extras</span>
            </div>
            <button 
                onclick={increaseBonusDamage} 
                class="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all active:scale-90 shadow-lg shadow-indigo-500/20" 
                aria-label="Aumentar Dano Bônus"
            >
                <Plus size={18}/>
            </button>
        </div>
    </div>
</div>
