<script lang="ts">
    import { Plus, Minus } from 'lucide-svelte';

    interface Props {
        value: number | string;
        label?: string;
        onUpdate: (newValue: number | string) => void;
        min?: number;
        customSteps?: string[];
    }

    let { value, label, onUpdate, min = 0, customSteps = [] }: Props = $props();

    function decrease() {
        if (typeof value === 'number') {
            if (value > 1) {
                onUpdate(value - 1);
            } else if (value === 1) {
                if (customSteps.length > 0) {
                    onUpdate(customSteps[customSteps.length - 1]);
                } else {
                    onUpdate(min);
                }
            } else {
                // val is 0 or min
                onUpdate(min);
            }
        } else {
            // string value (in customSteps)
            const index = customSteps.indexOf(value as string);
            if (index > 0) {
                onUpdate(customSteps[index - 1]);
            } else {
                onUpdate(min);
            }
        }
    }

    function increase() {
        if (typeof value === 'number') {
             if (value === 0 && customSteps.length > 0) {
                 // 0 -> first step
                 onUpdate(customSteps[0]);
             } else {
                 onUpdate(value + 1);
             }
        } else {
            // string value
            const index = customSteps.indexOf(value as string);
            if (index >= 0 && index < customSteps.length - 1) {
                onUpdate(customSteps[index + 1]);
            } else {
                // End of custom steps, go to 1d6
                onUpdate(1);
            }
        }
    }

    function formatValue(val: number | string) {
        if (val === 0) return `${val}d6`;
        if (typeof val === 'number') return `${val}d6`;
        return val;
    }
</script>

<div>
    {#if label}
        <span class="text-[10px] text-indigo-300 uppercase font-bold mb-2 block">{label}</span>
    {/if}
    <div class="flex items-center justify-between bg-black/40 rounded-xl p-1.5 border border-white/5">
        <button
            type="button"
            onclick={decrease}
            class="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all active:scale-90"
            aria-label="Diminuir"
        >
            <Minus size={18}/>
        </button>
        <div class="flex flex-col items-center">
            <span class="text-2xl font-black text-white leading-none tracking-tighter">{formatValue(value)}</span>
        </div>
        <button
            type="button"
            onclick={increase}
            class="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all active:scale-90 shadow-lg shadow-indigo-500/20"
            aria-label="Aumentar"
        >
            <Plus size={18}/>
        </button>
    </div>
</div>
