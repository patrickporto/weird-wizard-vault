<script lang="ts">
    import { t } from 'svelte-i18n';
    import { character, modalState, totalDefense, effectiveSpeed } from '$lib/stores/characterStore';
    import { Shield, Zap, Sword, Activity, Edit } from 'lucide-svelte';
    import DiceCounter from '$lib/components/common/DiceCounter.svelte';

    function openModal(type: string, data: any) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }

    function updateBonusDamage(newValue: number) {
        character.update(c => ({...c, bonusDamage: newValue}));
    }
</script>

<div class="space-y-3">
    <div class="grid grid-cols-2 gap-3">
        <!-- Defense Card -->
        <button
            onclick={() => openModal('stat', 'defense')}
            class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 p-3 text-left transition-all hover:bg-slate-800 shadow-lg shadow-black/20 group flex flex-col w-full"
        >
            <div class="flex justify-between items-start w-full mb-2">
                <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 min-w-0 pr-1">
                    <Shield size={12} class="flex-shrink-0"/> <span class="truncate">{$t('character.vitals.defense')}</span>
                </div>
                <div class="text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100">
                    <Edit size={12} />
                </div>
            </div>

            <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-black text-white leading-none">{$totalDefense}</span>
                {#if $totalDefense !== $character.naturalDefense}
                    <div class="text-[11px] font-bold {$totalDefense > $character.naturalDefense ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                        {$totalDefense > $character.naturalDefense ? '+' : ''}{$totalDefense - $character.naturalDefense}
                    </div>
                {/if}
            </div>
        </button>

        <!-- Speed Card -->
        <button
            onclick={() => openModal('stat', 'speed')}
            class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 p-3 text-left transition-all hover:bg-slate-800 shadow-lg shadow-black/20 group flex flex-col w-full"
        >
            <div class="flex justify-between items-start w-full mb-2">
                <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 min-w-0 pr-1">
                    <Zap size={12} class="flex-shrink-0"/> <span class="truncate">{$t('character.vitals.speed')}</span>
                </div>
                <div class="text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100">
                    <Edit size={12} />
                </div>
            </div>

            <div class="flex items-baseline gap-1.5 w-full">
                <span class="text-3xl font-black {$effectiveSpeed < $character.speed ? 'text-red-400' : 'text-white'} leading-none">{$effectiveSpeed}</span>
                {#if $effectiveSpeed !== $character.speed}
                    <div class="text-[11px] font-bold {$effectiveSpeed > $character.speed ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                        {$effectiveSpeed > $character.speed ? '+' : ''}{$effectiveSpeed - $character.speed}
                    </div>
                {/if}
                {#if $effectiveSpeed < $character.speed}
                    <div class="p-1 bg-red-500/10 rounded ml-auto">
                        <Activity size={10} class="text-red-500"/>
                    </div>
                {/if}
            </div>
        </button>
    </div>

    <!-- Bonus Damage Controller -->
    <div class="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-lg shadow-black/20">
        <span class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
            <Sword size={14} class="text-indigo-500"/> {$t('character.vitals.bonus_damage')}
        </span>
        <DiceCounter
            value={$character.bonusDamage || 0}
            onUpdate={updateBonusDamage}
        />
    </div>
</div>
