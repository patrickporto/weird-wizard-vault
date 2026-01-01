<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Skull } from 'lucide-svelte';
    import type { TierLevel } from '$lib/systems';
    import DifficultyBar from './DifficultyBar.svelte';

    interface Props {
        tier: TierLevel;
        totalDifficulty: number;
    }

    let { tier, totalDifficulty }: Props = $props();

    // Difficulty thresholds for Shadow of the Demon Lord
    const THRESHOLDS: Record<TierLevel, { easy: number; avgMin: number; avgMax: number; challMin: number; challMax: number; hard: number; maxCreature: number | null }> = {
        starting: { easy: 3, avgMin: 4, avgMax: 15, challMin: 16, challMax: 30, hard: 31, maxCreature: 25 },
        novice: { easy: 10, avgMin: 11, avgMax: 30, challMin: 31, challMax: 50, hard: 51, maxCreature: 100 },
        expert: { easy: 30, avgMin: 31, avgMax: 50, challMin: 51, challMax: 125, hard: 126, maxCreature: 250 },
        master: { easy: 50, avgMin: 51, avgMax: 125, challMin: 126, challMax: 200, hard: 201, maxCreature: null }
    };

    let thresholds = $derived(THRESHOLDS[tier] || THRESHOLDS.starting);

    let difficultyLevel = $derived(() => {
        if (totalDifficulty <= thresholds.easy) return 'easy';
        if (totalDifficulty <= thresholds.avgMax) return 'average';
        if (totalDifficulty <= thresholds.challMax) return 'challenging';
        return 'hard';
    });

    let segments = $derived([
        { key: 'easy', max: thresholds.easy, color: 'bg-green-500' },
        { key: 'average', max: thresholds.avgMax, color: 'bg-yellow-500' },
        { key: 'challenging', max: thresholds.challMax, color: 'bg-orange-500' },
        { key: 'hard', max: thresholds.challMax * 1.5, color: 'bg-red-500' }
    ]);

    let colorClass = $derived(() => {
        const level = difficultyLevel();
        switch (level) {
            case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'average': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'challenging': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
            case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/30';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
        }
    });
</script>

<div class="rounded-xl border p-4 {colorClass()} shadow-lg">
    <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
            <Skull size={18} />
            <span class="text-xs font-black uppercase tracking-widest">{$t('campaign.difficulty.title')}</span>
        </div>
        <div class="text-xs font-bold uppercase opacity-70">{$t('campaign.settings.tiers.' + tier)}</div>
    </div>

    <div class="flex items-center justify-between mb-6">
        <div>
            <div class="text-3xl font-black leading-none">{totalDifficulty}</div>
            <div class="text-[10px] font-bold uppercase opacity-50 mt-1">{$t('campaign.difficulty.total')}</div>
        </div>
        <div class="text-right">
            <div class="text-sm font-black uppercase">{$t('campaign.difficulty.' + difficultyLevel())}</div>
            <div class="text-[10px] font-bold opacity-40 mt-1 flex items-center justify-end gap-1">
                <span class="uppercase tracking-tighter">{$t('campaign.difficulty.max_creature')}:</span>
                <span>{thresholds.maxCreature ?? $t('campaign.difficulty.none')}</span>
            </div>
        </div>
    </div>

    <DifficultyBar value={totalDifficulty} {segments} />
</div>
