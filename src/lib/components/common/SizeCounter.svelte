<script lang="ts">
    import { Plus, Minus } from 'lucide-svelte';

    interface Props {
        value: number;
        onUpdate: (newValue: number) => void;
        label?: string;
    }

    let { value, onUpdate, label }: Props = $props();

    // Specific steps as requested: 1/8, 1/2, 1, 2, ... 20
    const steps = [0.125, 0.5, ...Array.from({ length: 20 }, (_, i) => i + 1)];

    function decrease() {
        const currentIndex = steps.indexOf(value);
        if (currentIndex > 0) {
            onUpdate(steps[currentIndex - 1]);
        } else if (currentIndex === -1) {
             // If value is not in steps, find the closest one below
             const closest = steps.slice().reverse().find(s => s < value);
             if (closest) onUpdate(closest);
             else onUpdate(steps[0]);
        }
    }

    function increase() {
         const currentIndex = steps.indexOf(value);
         if (currentIndex !== -1 && currentIndex < steps.length - 1) {
             onUpdate(steps[currentIndex + 1]);
         } else if (currentIndex === -1) {
             // If value is not in steps, find the closest one above
             const closest = steps.find(s => s > value);
             if (closest) onUpdate(closest);
             else onUpdate(steps[steps.length - 1]);
         }
    }

    function formatValue(val: number) {
        if (val === 0.125) return '1/8';
        if (val === 0.5) return '1/2';
        return val.toString();
    }
</script>

<div>
    {#if label}
        <span class="text-[10px] text-indigo-300 uppercase font-bold mb-2 block">{label}</span>
    {/if}
    <div class="flex items-center justify-between bg-black/40 rounded-xl p-1.5 border border-white/5" role="group" aria-label="Seletor de Tamanho">
        <button
            type="button"
            onclick={decrease}
            class="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Diminuir"
            disabled={value <= steps[0]}
        >
            <Minus size={18}/>
        </button>
        <div class="flex flex-col items-center min-w-[3rem]">
            <span class="text-2xl font-black text-white leading-none tracking-tighter" data-testid="size-display">{formatValue(value)}</span>
        </div>
        <button
            type="button"
            onclick={increase}
            class="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all active:scale-90 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Aumentar"
            disabled={value >= steps[steps.length - 1]}
        >
            <Plus size={18}/>
        </button>
    </div>
</div>
