<script lang="ts">
    import { t } from 'svelte-i18n';

    interface Segment {
        key: string; // i18n key suffix
        max: number;
        color: string;
    }

    let { value, segments }: { value: number, segments: Segment[] } = $props();

    // Find current segment index
    let currentSegmentIndex = $derived(() => {
        for (let i = 0; i < segments.length; i++) {
            if (value <= segments[i].max) return i;
        }
        return segments.length - 1;
    });

    // Calculate progress within the current segment
    // We treat each segment as equal width for the visual bar.
    let progress = $derived(() => {
        const idx = currentSegmentIndex();
        const prevMax = idx === 0 ? 0 : segments[idx - 1].max;
        const currentMax = segments[idx].max;

        // If we are in the last segment and over the max, just cap it
        if (idx === segments.length - 1 && value > currentMax) return 1;

        const range = currentMax - prevMax;
        if (range === 0) return 1;
        return Math.min(1, Math.max(0, (value - prevMax) / range));
    });

    // Total visual percentage
    let totalPercentage = $derived(() => {
        const idx = currentSegmentIndex();
        const segWidth = 100 / segments.length;
        return (idx * segWidth) + (progress() * segWidth);
    });

    let activeColor = $derived(segments[currentSegmentIndex()].color);
</script>

<div class="space-y-4 w-full">
    <!-- The Bar Container -->
    <div class="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
        <!-- Segments Separators -->
        <div class="absolute inset-0 flex">
            {#each segments as _, i}
                <div class="h-full border-r border-slate-900/30 last:border-0" style="width: {100 / segments.length}%"></div>
            {/each}
        </div>

        <!-- Progress Fill -->
        <div
            class="absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full {activeColor}"
            style="width: {totalPercentage()}%"
        >
            <div class="absolute inset-0 bg-white/10 animate-pulse"></div>
        </div>
    </div>

    <!-- Labels -->
    <div class="flex justify-between w-full px-1">
        {#each segments as segment, i}
            <div class="flex flex-col items-center" style="width: {100 / segments.length}%">
                <span class="text-[9px] font-black uppercase tracking-tighter transition-colors {i === currentSegmentIndex() ? activeColor.replace('bg-', 'text-') : 'text-slate-500'}">
                    {$t('campaign.difficulty.' + segment.key)}
                </span>
                <span class="text-[8px] font-mono text-slate-600">
                    {#if i === segments.length - 1}
                        {segments[i-1].max + 1}+
                    {:else if i === 0}
                        {segment.max}
                    {:else}
                        {segment.max}
                    {/if}
                </span>
            </div>
        {/each}
    </div>
</div>

<style>
    /* Gradient for better look */
    .bg-green-500 { background: linear-gradient(90deg, #22c55e, #4ade80); }
    .bg-yellow-500 { background: linear-gradient(90deg, #eab308, #fde047); }
    .bg-orange-500 { background: linear-gradient(90deg, #f97316, #fb923c); }
    .bg-red-500 { background: linear-gradient(90deg, #ef4444, #f87171); }
</style>
