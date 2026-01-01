<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Skull } from 'lucide-svelte';
    import type { TierLevel } from '$lib/systems';
    import DifficultyBar from './DifficultyBar.svelte';

    interface Props {
        tier: TierLevel;
        totalDifficulty: number;
        playerCount: number;
    }

    let { tier, totalDifficulty, playerCount }: Props = $props();

    // Difficulty per character per scene for Weird Wizard
    const DIFFICULTY_PER_PLAYER: Record<TierLevel, { easy: number; average: number; hard: number }> = {
        starting: { easy: 0.5, average: 1, hard: 1.5 },
        novice: { easy: 1, average: 2, hard: 3 },
        expert: { easy: 2, average: 4, hard: 6 },
        master: { easy: 4, average: 8, hard: 12 }
    };

    let tierData = $derived(DIFFICULTY_PER_PLAYER[tier] || DIFFICULTY_PER_PLAYER.novice);

    // Calculate thresholds based on player count
    let thresholds = $derived({
        easy: tierData.easy * playerCount,
        average: tierData.average * playerCount,
        hard: tierData.hard * playerCount
    });

    let difficultyLevel = $derived(() => {
        if (totalDifficulty <= thresholds.easy) return 'easy';
        if (totalDifficulty <= thresholds.average) return 'average';
        return 'hard';
    });

    let segments = $derived([
        { key: 'easy', max: thresholds.easy, color: 'bg-green-500' },
        { key: 'average', max: thresholds.average, color: 'bg-yellow-500' },
        { key: 'hard', max: thresholds.hard * 1.5, color: 'bg-red-500' }
    ]);

    let colorClass = $derived(() => {
        const level = difficultyLevel();
        switch (level) {
            case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'average': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
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
        <div class="flex items-center gap-2 text-xs font-bold uppercase opacity-70">
            <span>{$t('campaign.settings.tiers.' + tier)}</span>
            <span class="text-[10px] bg-black/20 px-2 py-0.5 rounded">{$t('campaign.difficulty.players', { values: { count: playerCount } })}</span>
        </div>
    </div>

    <div class="flex items-center justify-between mb-6">
        <div>
            <div class="text-3xl font-black leading-none">{totalDifficulty}</div>
            <div class="text-[10px] font-bold uppercase opacity-50 mt-1">{$t('campaign.difficulty.total')}</div>
        </div>
        <div class="text-right">
            <div class="text-sm font-black uppercase">{ $t('campaign.difficulty.' + difficultyLevel()) }</div>
            <div class="text-[10px] font-medium opacity-50 mt-1 uppercase tracking-tighter">{tierData.average}/{$t('common.labels.master')}</div>
        </div>
    </div>

    <DifficultyBar value={totalDifficulty} {segments} />
</div>
