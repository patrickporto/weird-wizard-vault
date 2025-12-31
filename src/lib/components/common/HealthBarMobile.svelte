<script lang="ts">
  import { t } from 'svelte-i18n';

  interface Props {
    currentHealth: number;
    damage: number;
    tempHealth: number;
    isInjured: boolean;
    isIncapacitated: boolean;
    damagePercentage: number;
    onClick?: (e: Event) => void;
  }

  let {
    currentHealth = $bindable(),
    damage = $bindable(),
    tempHealth = $bindable(),
    isInjured = $bindable(),
    isIncapacitated = $bindable(),
    damagePercentage = $bindable(),
    onClick
  }: Props = $props();
</script>

<div class="md:hidden border-t border-white/5 bg-slate-950/20">
    <button
        class="w-full px-4 py-2 text-left active:bg-white/5 transition-colors"
        onclick={onClick}
        aria-label={$t('character.header.health_label')}
    >
        <div class="flex justify-between text-[10px] mb-1">
            <span class="font-black uppercase tracking-widest {isIncapacitated ? 'text-red-500 animate-pulse' : isInjured ? 'text-amber-500' : damage > 0 ? 'text-slate-400' : 'text-emerald-500'}">
                {#if isIncapacitated}
                    {$t('character.health.incapacitated')}
                {:else if isInjured}
                    {$t('character.health.injured')}
                {:else}
                    {$t('character.health.healthy')}
                {/if}
            </span>
            <span class="text-slate-300 font-mono font-black">
                <span class="{damage === 0 ? 'text-emerald-400' : isIncapacitated ? 'text-red-400' : isInjured ? 'text-amber-400' : 'text-orange-400'}">{damage}</span> / {currentHealth}
            </span>
        </div>
        <div class="h-2 w-full bg-slate-950 rounded-full border border-white/5 relative overflow-hidden shadow-inner">
            <div class="absolute top-0 left-0 h-full w-full {damage === 0 ? 'bg-emerald-900/20' : 'bg-slate-900/50'}"></div>
            {#if damagePercentage > 0}
            <div
                class="absolute top-0 left-0 h-full transition-all duration-500 ease-out z-10 {isIncapacitated ? 'bg-gradient-to-r from-red-600 via-red-500 to-rose-500 animate-pulse' : damagePercentage >= 80 ? 'bg-gradient-to-r from-red-600 to-rose-500' : isInjured ? 'bg-gradient-to-r from-amber-600 to-orange-500' : 'bg-gradient-to-r from-orange-500 to-amber-400'}"
                style="width: {damagePercentage}%"
            >
                <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>
            {/if}
            {#if damage === 0}
            <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-400/30 to-emerald-500/20 z-10"></div>
            {/if}
            {#if tempHealth > 0}<div class="absolute top-0 left-0 w-full h-full z-20 bg-cyan-400/20 pointer-events-none animate-pulse"></div>{/if}
        </div>
    </button>
</div>
