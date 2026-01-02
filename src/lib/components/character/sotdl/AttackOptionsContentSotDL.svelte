<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Dices, Wand2, Sword, ArrowLeft, Plus, Minus } from 'lucide-svelte';
    import { modalState } from '$lib/stores/characterStore';
    import Modal from '$lib/components/common/Modal.svelte';

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'weapon_menu_sotdl');
    let data = $derived($modalState.data);

    // Format damage display
    let damageDisplay = $derived(() => {
        if (!data) return '1d6';
        const dmg = data.damage || '0';
        const mod = data.damageMod || 0;

        // If it's a number, append d6
        if (dmg !== '0' && !dmg.includes('d') && !isNaN(Number(dmg))) {
            return mod > 0 ? `${dmg}d6+${mod}` : `${dmg}d6`;
        }
        // If it includes 'd' or special
        return mod > 0 ? `${dmg}+${mod}` : dmg;
    });

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function selectRoll(type: 'attack' | 'damage') {
        if (!data) return;

        const rollDataType = type === 'attack' ? 'weapon_attack' : 'weapon_damage';

        // Switch to the standard DiceRollModal (pre_roll)
        // This unifies the UX and enables 3D dice
        modalState.set({
            type: 'pre_roll',
            isOpen: true,
            data: {
                type: rollDataType,
                source: data, // Pass the item
                name: data.name // Ensure name is available for title
            }
        });
    }
</script>

<Modal {isOpen} title={$t('character.modals.attack_options')} {onClose}>
    {#if data}
        <div class="space-y-6 pt-2">
            <!-- Header Card -->
            <div class="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-6 group transition-all hover:border-indigo-500/30">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sword size={80} />
                </div>

                <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-3 relative z-10">{data.name}</h3>

                <div class="flex flex-wrap gap-2 mb-4 relative z-10">
                    <span class="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-lg font-bold uppercase tracking-widest shadow-sm">
                        {data.hands || 'One-handed'}
                    </span>
                    <span class="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1 rounded-lg font-bold uppercase">
                        {data.range || 'Melee'}
                    </span>
                    {#if data.properties}
                        {#each data.properties.split(',').map((t: string) => t.trim()).filter((t: string) => t) as trait}
                            <span class="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg font-bold uppercase">
                                {trait}
                            </span>
                        {/each}
                    {/if}
                </div>

                <p class="text-sm text-slate-400 italic leading-relaxed relative z-10">
                    {data.description || $t('character.modals.no_traits')}
                </p>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-4">
                <button
                    onclick={() => selectRoll('attack')}
                    class="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white p-1 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-[0.98] group"
                >
                    <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="bg-slate-900/10 backdrop-blur-[2px] h-full rounded-[14px] p-5 flex flex-col items-center justify-center gap-3 border border-white/10">
                        <Dices size={32} class="text-indigo-200 group-hover:scale-110 transition-transform duration-300" />
                        <div class="text-center">
                            <span class="block text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">
                                {$t('character.modals.attack')}
                            </span>
                            <span class="text-xl font-bold font-mono text-white">1d20</span>
                        </div>
                    </div>
                </button>

                <button
                    onclick={() => selectRoll('damage')}
                    class="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white p-1 rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-[0.98] group"
                >
                    <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="bg-slate-900/10 backdrop-blur-[2px] h-full rounded-[14px] p-5 flex flex-col items-center justify-center gap-3 border border-white/10">
                        <Wand2 size={32} class="text-red-200 group-hover:scale-110 transition-transform duration-300" />
                        <div class="text-center">
                            <span class="block text-[10px] font-black uppercase tracking-widest text-red-200 mb-1">
                                {$t('character.modals.damage')}
                            </span>
                            <span class="text-xl font-bold font-mono text-white">{damageDisplay()}</span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    {/if}
</Modal>
