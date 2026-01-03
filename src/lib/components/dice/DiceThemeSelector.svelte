<script lang="ts">
    import { onMount } from 'svelte';
    import { DiceBox } from '$lib/dice/services/renderer';
    import { appSettings } from '$lib/stores/characterStore';
    import { THEMES } from '$lib/dice/constants/themes';
    import { Check } from 'lucide-svelte';

    let diceBoxContainer: HTMLDivElement;
    let diceBox: DiceBox;

    // Convert THEMES object to array for easier iteration
    const themes = Object.entries(THEMES).map(([id, theme]) => ({
        id,
        ...theme
    }));

    // Selected theme ID
    let selectedTheme = $state($appSettings.diceTheme || 'default');

    onMount(async () => {
        // Initialize DiceBox for preview
        diceBox = new DiceBox(diceBoxContainer, {
            assetPath: '/assets/dice-box/',
            scale: 6,
            theme_surface: selectedTheme, // Use selected theme for surface
            theme_customColorset: THEMES[selectedTheme as keyof typeof THEMES]?.dice,
            theme_colorset: selectedTheme, // Use selected theme
            gravity_multiplier: 400,
            baseScale: 45, // Smaller scale for preview
            strength: 1,
            onRollComplete: () => {}
        });

        await diceBox.initialize();

        // Show rotating dice for preview: d20, boon d6, and bane d6
        await diceBox.showSelector([
            'd20',
            { type: 'd6', style: 'boon' },
            { type: 'd6', style: 'bane' }
        ]);
    });

    async function selectTheme(themeId: string) {
        selectedTheme = themeId;
        $appSettings.diceTheme = themeId;

        const theme = THEMES[themeId as keyof typeof THEMES];
        if (diceBox && theme) {
            await diceBox.updateConfig({
                theme_surface: themeId,
                theme_colorset: themeId, // Update colorset for boon/bane styles
                theme_customColorset: theme.dice
            });
            await diceBox.showSelector([
                'd20',
                { type: 'd6', style: 'boon' },
                { type: 'd6', style: 'bane' }
            ]);
        }
    }
</script>

<div class="h-full flex flex-col">
    <!-- Preview Area -->
    <div class="h-48 bg-black/30 rounded-xl relative overflow-hidden shrink-0 mb-4 border border-white/5">
        <div bind:this={diceBoxContainer} class="w-full h-full"></div>
        <div class="absolute bottom-2 left-2 text-xs text-white/50 bg-black/50 px-2 py-1 rounded">
            Preview
        </div>
    </div>

    <!-- Theme Grid -->
    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {#each themes as theme}
                <button
                    class="relative group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200
                    {selectedTheme === theme.id
                        ? 'bg-primary/20 border-primary/50 ring-1 ring-primary/50'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}"
                    onclick={() => selectTheme(theme.id)}
                    aria-label="Select theme {theme.name}"
                >
                    <!-- Color Swatch -->
                    <div class="w-12 h-12 rounded-full shadow-lg relative border-2 border-white/10 overflow-hidden"
                         style="background: {Array.isArray(theme.dice.background) ? theme.dice.background[0] : theme.dice.background};">
                        <div class="absolute inset-0 flex items-center justify-center font-bold text-sm"
                             style="color: {Array.isArray(theme.dice.foreground) ? theme.dice.foreground[0] : theme.dice.foreground};">
                            20
                        </div>
                    </div>

                    <!-- Theme Name -->
                    <span class="text-xs font-medium text-center truncate w-full px-1"
                          class:text-primary-300={selectedTheme === theme.id}
                          class:text-zinc-400={selectedTheme !== theme.id}>
                        {theme.name}
                    </span>

                    {#if selectedTheme === theme.id}
                        <div class="absolute top-2 right-2 text-primary-400">
                            <Check size={14} />
                        </div>
                    {/if}
                </button>
            {/each}
        </div>
    </div>
</div>

<style>

  /* Full canvas in preview */
  .preview-canvas {
      width: 100%;
      height: 100%;
      display: block;
  }

  /* Ensure canvas inside is block */
  .preview-canvas :global(canvas) {
      width: 100% !important;
      height: 100% !important;
      outline: none;
  }

  .preview-label {
      position: absolute;
      top: 0.5rem;
      right: 0.75rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: hsl(220 10% 60%);
      pointer-events: none;
  }

  .themes-list {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
  }

  .category-section {
      margin-bottom: 1.5rem;
  }

  .category-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: hsl(220 10% 60%);
      margin-bottom: 0.75rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid hsl(220 20% 20%);
  }

  .theme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.75rem;
  }

  .theme-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: hsl(220 15% 14%);
      border: 1px solid transparent;
      border-radius: var(--radius-m, 8px);
      transition: all 0.2s ease;
      cursor: pointer;
  }

  .theme-btn:hover {
      background: hsl(220 15% 18%);
      transform: translateY(-2px);
  }

  .theme-btn.active {
      background: hsl(220 20% 20%);
      border-color: var(--primary, hsl(260 100% 70%));
      box-shadow: 0 0 0 1px var(--primary, hsl(260 100% 70%));
  }

  .swatch {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.2);
      border: 2px solid transparent;
  }

  .theme-name {
      font-size: 0.75rem;
      text-align: center;
      color: hsl(220 10% 80%);
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
  }

  .theme-btn.active .theme-name {
      color: var(--primary-foreground, white);
      font-weight: 500;
  }
</style>
