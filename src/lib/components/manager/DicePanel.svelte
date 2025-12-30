<script lang="ts">
    import { t } from 'svelte-i18n';
    import { isHistoryOpen } from '$lib/stores/characterStore';
    import { Dices } from 'lucide-svelte';
    import { characterActions } from '$lib/stores/characterStore';

    function rollDice(sides: number, count = 1) {
        const results: number[] = [];
        let total = 0;
        for(let i=0; i<count; i++) {
            const r = Math.floor(Math.random() * sides) + 1;
            results.push(r);
            total += r;
        }
        
        characterActions.addToHistory({
            source: 'GM',
            charName: 'Mestre',
            name: `${count}d${sides}`,
            description: count > 1 ? `Resultados: [${results.join(', ')}]` : null,
            total,
            formula: `${count}d${sides}`,
            crit: sides === 20 && results.includes(20)
        });
        isHistoryOpen.set(true); // Auto-open sidebar
    }
</script>

<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sticky top-4 shadow-xl">
    <h3 class="font-bold text-slate-400 text-xs mb-3 flex items-center gap-2 uppercase tracking-widest"><Dices size={14}/> {$t('character.dice_roll.quick_rolls')}</h3>
    <div class="grid grid-cols-2 gap-2">
        <button 
            onclick={() => rollDice(20)} 
            class="bg-slate-800 hover:bg-indigo-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5"
            aria-label={$t('character.dice_roll.roll_d20')}
        >
            <Dices size={16}/> d20
        </button>
        <button 
            onclick={() => rollDice(6)} 
            class="bg-slate-800 hover:bg-indigo-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5"
            aria-label={$t('character.dice_roll.roll_d6')}
        >
            <Dices size={16}/> d6
        </button>
        <button 
            onclick={() => rollDice(6, 2)} 
            class="bg-slate-800 hover:bg-indigo-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5 text-sm"
            aria-label={$t('character.dice_roll.roll_2d6')}
        >
            2d6
        </button>
        <button 
            onclick={() => rollDice(6, 3)} 
            class="bg-slate-800 hover:bg-indigo-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5 text-sm"
            aria-label={$t('character.dice_roll.roll_3d6')}
        >
            3d6
        </button>
    </div>
    <p class="text-[10px] text-slate-500 mt-3 text-center italic tracking-tight">{$t('character.dice_roll.history_note')}</p>
</div>
