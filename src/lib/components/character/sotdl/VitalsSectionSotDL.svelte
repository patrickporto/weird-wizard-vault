<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Shield, Zap, Eye, HeartPulse, Sparkles, Maximize2, Edit } from 'lucide-svelte';
    import { sotdlCharacter, sotdlTotalHealingRate, sotdlDerivedStats } from '$lib/stores/characterStoreSotDL';
    import { modalState } from '$lib/stores/characterStore';

    function openModal(type: string, data: any) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }
</script>

<div class="space-y-3">
    <!-- Row 1: Defense & Speed -->
    <div class="grid grid-cols-2 gap-3">
        <!-- Defense Card -->
        <button
            onclick={() => openModal('stat', { system: 'sofdl', key: 'defense' })}
            class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 p-3 text-left transition-all hover:bg-slate-800 shadow-lg shadow-black/20 group flex flex-col w-full"
        >
            <div class="flex justify-between items-start w-full mb-2">
                <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 min-w-0 pr-1">
                    <Shield size={12} class="flex-shrink-0"/> <span class="truncate">{$t('character.vitals.defense')}</span>
                </div>
                <!-- Visual edit indicator -->
                <div class="text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100">
                    <Edit size={12} />
                </div>
            </div>

            <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-black text-white leading-none">{$sotdlDerivedStats.defense}</span>
                {#if $sotdlDerivedStats.defense !== $sotdlCharacter.defense}
                    <div class="text-[11px] font-bold {$sotdlDerivedStats.defense > $sotdlCharacter.defense ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                        {$sotdlDerivedStats.defense > $sotdlCharacter.defense ? '+' : ''}{$sotdlDerivedStats.defense - $sotdlCharacter.defense}
                    </div>
                {/if}
            </div>
        </button>

        <!-- Speed Card -->
        <button
            onclick={() => openModal('stat', { system: 'sofdl', key: 'speed' })}
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

            <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-black text-white leading-none">{$sotdlDerivedStats.speed}</span>
                {#if $sotdlDerivedStats.speed !== $sotdlCharacter.speed}
                    <div class="text-[11px] font-bold {$sotdlDerivedStats.speed > $sotdlCharacter.speed ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                        {$sotdlDerivedStats.speed > $sotdlCharacter.speed ? '+' : ''}{$sotdlDerivedStats.speed - $sotdlCharacter.speed}
                    </div>
                {/if}
            </div>
        </button>
    </div>

    <!-- Row 2: Perception -->
    <button
        onclick={() => openModal('stat', { system: 'sofdl', key: 'perception' })}
        class="w-full bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 p-3 text-left transition-all hover:bg-slate-800 shadow-lg shadow-black/20 group flex flex-col"
    >
        <div class="flex justify-between items-start w-full mb-2">
            <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 min-w-0 pr-1">
                <Eye size={12} class="flex-shrink-0"/> <span class="truncate">{$t('sofdl.attributes.perception')}</span>
            </div>
            <div class="text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100">
                <Edit size={12} />
            </div>
        </div>

        <div class="flex items-baseline gap-1.5">
            <span class="text-3xl font-black text-cyan-400 leading-none">{$sotdlDerivedStats.perception}</span>
            {#if $sotdlDerivedStats.perception !== $sotdlCharacter.perception}
                <div class="text-[11px] font-bold {$sotdlDerivedStats.perception > $sotdlCharacter.perception ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                    {$sotdlDerivedStats.perception > $sotdlCharacter.perception ? '+' : ''}{$sotdlDerivedStats.perception - $sotdlCharacter.perception}
                </div>
            {/if}
        </div>
    </button>

    <!-- Row 3: Power -->
    <button
        onclick={() => openModal('stat', { system: 'sofdl', key: 'power' })}
        class="w-full bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-lg shadow-black/20 text-left transition-all hover:bg-slate-800 group"
    >
        <div class="flex justify-between items-start w-full mb-3">
            <span class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                <Sparkles size={14} class="text-yellow-500 flex-shrink-0"/> {$t('sofdl.attributes.power')}
            </span>
            <div class="text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100">
                <Edit size={12} />
            </div>
        </div>

        <div class="flex items-center gap-3">
            <span class="text-3xl font-black text-white">{$sotdlDerivedStats.power}</span>
            {#if $sotdlDerivedStats.power !== $sotdlCharacter.power}
                <div class="text-[11px] font-bold {$sotdlDerivedStats.power > $sotdlCharacter.power ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                    {$sotdlDerivedStats.power > $sotdlCharacter.power ? '+' : ''}{$sotdlDerivedStats.power - $sotdlCharacter.power}
                </div>
            {/if}
        </div>
    </button>

    <!-- Row 4: Healing Rate & Size -->
    <div class="grid grid-cols-2 gap-3">
        <!-- Healing Rate Card -->
        <button
            onclick={() => openModal('stat', { system: 'sofdl', key: 'healingRate' })}
            class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 p-3 text-left transition-all hover:bg-slate-800 shadow-lg shadow-black/20 group flex flex-col w-full"
        >
            <div class="flex justify-between items-start w-full mb-2">
                <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 min-w-0 pr-1">
                    <HeartPulse size={12} class="flex-shrink-0"/> <span class="truncate">{$t('character.vitals.healing_rate')}</span>
                </div>
                <div class="text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100">
                    <Edit size={12} />
                </div>
            </div>

            <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-black text-rose-400 leading-none">{$sotdlTotalHealingRate}</span>
                {#if $sotdlTotalHealingRate !== $sotdlCharacter.healingRate}
                    <div class="text-[11px] font-bold {$sotdlTotalHealingRate > $sotdlCharacter.healingRate ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-1 rounded-md">
                        {$sotdlTotalHealingRate > $sotdlCharacter.healingRate ? '+' : ''}{$sotdlTotalHealingRate - $sotdlCharacter.healingRate}
                    </div>
                {/if}
            </div>
        </button>

        <!-- Size Card -->
        <button
            onclick={() => openModal('stat', { system: 'sofdl', key: 'size' })}
            class="bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 p-3 text-left transition-all hover:bg-slate-800 shadow-lg shadow-black/20 group flex flex-col w-full"
        >
            <div class="flex justify-between items-start w-full mb-2">
                <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 min-w-0 pr-1">
                    <Maximize2 size={12} class="flex-shrink-0"/> <span class="truncate">{$t('sofdl.attributes.size')}</span>
                </div>
                <div class="text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100">
                    <Edit size={12} />
                </div>
            </div>

            <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-white leading-none">{$sotdlCharacter.size}</span>
            </div>
        </button>
    </div>
</div>
