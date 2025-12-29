<script lang="ts">
    import Modal from './Modal.svelte';
    import { Plus, Minus, Dices } from 'lucide-svelte';

    interface Props {
        isOpen: boolean;
        title: string;
        initialModifier?: number;
        label?: string;
        rollLabel?: string;
        onClose: () => void;
        onRoll: (modifier: number) => void;
        children?: import('svelte').Snippet;
    }

    let { 
        isOpen, 
        title, 
        initialModifier = 0, 
        label = 'Boons / Banes', 
        rollLabel = 'ROLAR',
        onClose, 
        onRoll,
        children
    }: Props = $props();

    let modifier = $state(0);

    // Reset modifier when modal opens
    $effect(() => {
        if (isOpen) {
            modifier = initialModifier;
        }
    });

</script>

{#if isOpen}
    <Modal {isOpen} {onClose} title={title}>
        <div class="space-y-6">
            <div class="bg-slate-900/50 p-6 rounded-2xl border border-white/5 text-center shadow-inner relative overflow-hidden group">
                <!-- Subtle glow effect -->
                <div class="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                
                <div class="flex justify-center items-center gap-8 mb-4 relative z-10">
                    <button 
                        onclick={() => modifier--} 
                        class="w-12 h-12 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 flex items-center justify-center transition-all active:scale-90 shadow-lg"
                        aria-label="Diminuir"
                    >
                        <Minus size={24}/>
                    </button>
                    
                    <div class="flex flex-col items-center min-w-[100px]">
                        <span class="text-5xl font-black {modifier > 0 ? 'text-green-400' : modifier < 0 ? 'text-red-400' : 'text-slate-500'} tabular-nums drop-shadow-sm transition-colors duration-300">
                            {modifier > 0 ? '+' : ''}{modifier}
                        </span>
                    </div>

                    <button 
                        onclick={() => modifier++} 
                        class="w-12 h-12 rounded-full bg-slate-800 hover:bg-green-500/20 text-slate-300 hover:text-green-400 border border-slate-700 hover:border-green-500/30 flex items-center justify-center transition-all active:scale-90 shadow-lg"
                        aria-label="Aumentar"
                    >
                        <Plus size={24}/>
                    </button>
                </div>
                
                <div class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10">{label}</div>
            </div>

            <!-- Optional Snippet for extra content like effect selection -->
            {@render children?.()}

            <button 
                onclick={() => onRoll(modifier)} 
                class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
            >
                <Dices size={18} /> {rollLabel}
            </button>
        </div>
    </Modal>
{/if}
