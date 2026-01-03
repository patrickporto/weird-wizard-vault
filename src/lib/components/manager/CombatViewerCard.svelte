<script lang="ts">
    import { t } from 'svelte-i18n';
    import Avatar from '../common/Avatar.svelte';
    import { Swords, CheckCircle, Skull } from 'lucide-svelte';

    interface Props {
        entity: any;
        healthDisplayModePlayer: 'bar' | 'estimate';
        healthDisplayModeEnemy: 'bar' | 'estimate';
    }

    let { entity, healthDisplayModePlayer = 'bar', healthDisplayModeEnemy = 'bar' }: Props = $props();

    // Derived values
    let isPlayer = $derived(entity.type === 'player');
    let damage = $derived(entity.damage || 0);
    let maxHealth = $derived(entity.normalHealth || entity.health || 10);
    let currentHealth = $derived(entity.currentHealth ?? maxHealth);

    // Which mode to use based on entity type
    let activeHealthMode = $derived(isPlayer ? healthDisplayModePlayer : healthDisplayModeEnemy);

    // Health states with granular levels
    let isIncapacitated = $derived(damage >= currentHealth);
    let isCritical = $derived((damage >= currentHealth * 0.8) && !isIncapacitated);
    let isInjured = $derived((damage >= currentHealth * 0.5) && !isCritical && !isIncapacitated);
    let isWounded = $derived((damage > 0) && !isInjured && !isCritical && !isIncapacitated);
    let damagePercent = $derived(currentHealth > 0 ? Math.min(100, Math.max(0, (damage / currentHealth) * 100)) : 100);

    // Text-based health estimate with granular states
    let healthEstimate = $derived(() => {
        if (isIncapacitated) return $t('session.combat_viewer.health_estimates.incapacitated');
        if (isCritical) return $t('session.combat_viewer.health_estimates.critical');
        if (isInjured) return $t('session.combat_viewer.health_estimates.injured');
        if (isWounded) return $t('session.combat_viewer.health_estimates.wounded');
        return $t('session.combat_viewer.health_estimates.healthy');
    });

    // Color class for text estimates
    let estimateColorClass = $derived(() => {
        if (isIncapacitated) return 'text-red-600';
        if (isCritical) return 'text-red-400';
        if (isInjured) return 'text-orange-400';
        if (isWounded) return 'text-amber-400';
        return 'text-emerald-400';
    });
</script>

<div class="group relative overflow-hidden transition-all duration-300 rounded-xl border {isPlayer ? 'bg-slate-900/80 border-indigo-500/30' : 'bg-slate-950/80 border-red-900/30'} shadow-md">
    {#if isPlayer && entity.initiative}
        <div class="absolute top-0 right-0 bg-gradient-to-l from-yellow-600/20 to-transparent border-l border-b border-yellow-500/30 text-yellow-500 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-bl-lg z-20 uppercase">
            {$t('session.combat_card.initiative')}
        </div>
    {/if}

    {#if isIncapacitated}
        <div class="absolute inset-0 bg-red-950/40 animate-pulse z-0 pointer-events-none"></div>
    {/if}

    <div class="relative z-10 p-3">
        <div class="flex items-center gap-3">
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
                <div class="w-10 h-10 rounded-xl overflow-hidden border-2 shadow-lg {isIncapacitated ? 'border-red-600 grayscale brightness-50' : isPlayer ? 'border-indigo-500/50' : 'border-red-900/50'}">
                    {#key entity.imageUrl}
                        <Avatar hash={entity.imageUrl} alt={entity.name} size="custom" fallbackText={entity.name.charAt(0)} />
                    {/key}
                </div>

                <!-- Action Status Badge -->
                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center border shadow-md z-20 {entity.acted ? 'bg-slate-800 border-slate-600 text-slate-500' : isPlayer ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-red-600 border-red-400 text-white'}">
                    {#if isIncapacitated}
                        <Skull size={10} />
                    {:else if entity.acted}
                        <CheckCircle size={10} />
                    {:else}
                        <Swords size={10} />
                    {/if}
                </div>
            </div>

            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-sm font-bold truncate {isPlayer ? 'text-white' : 'text-red-100'}">
                        {entity.name}
                    </h3>
                    {#if !isPlayer}
                        <span class="text-[8px] font-black bg-red-950/40 text-red-500 px-1 py-0.5 rounded border border-red-900/30 uppercase">
                            {$t('session.combat_card.difficulty')} {entity.difficulty}
                        </span>
                    {/if}
                </div>

                <!-- Health Display -->
                {#if activeHealthMode === 'bar'}
                    <div class="relative w-full h-2.5 bg-slate-950 rounded-full border border-white/5 overflow-hidden shadow-inner">
                        {#if damagePercent > 0}
                            <div
                                class="absolute top-0 left-0 h-full transition-all duration-500 ease-out
                                {isIncapacitated ? 'bg-gradient-to-r from-red-600 via-red-500 to-rose-500 animate-pulse' :
                                 damagePercent >= 80 ? 'bg-gradient-to-r from-red-600 to-rose-500' :
                                 isInjured ? 'bg-gradient-to-r from-amber-600 to-orange-500' :
                                 'bg-gradient-to-r from-orange-500 to-amber-400'}"
                                style="width: {damagePercent}%"
                            >
                                <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                            </div>
                        {/if}
                        {#if damage === 0}
                            <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-400/30 to-emerald-500/20 z-10">
                                <div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Text-based estimate -->
                    <div class="text-xs font-bold uppercase tracking-wider {estimateColorClass()}">
                        {healthEstimate()}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Afflictions (compact) -->
        {#if (entity.afflictions || []).length > 0}
            <div class="flex flex-wrap gap-1 mt-2">
                {#each (entity.afflictions || []) as aff}
                    <span class="text-[8px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                        {aff}
                    </span>
                {/each}
            </div>
        {/if}
    </div>
</div>
