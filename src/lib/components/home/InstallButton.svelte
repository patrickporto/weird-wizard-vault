<script lang="ts">
    import { Download, Share, X, PlusSquare, MoreVertical } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import { t } from 'svelte-i18n';

    let deferredPrompt: any = $state(null);
    let isVisible = $state(false);
    let showInstructions = $state(false);
    let isIOS = $state(false);

    // Initial check for standalone mode
    onMount(() => {
        // Check if standalone (already installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) {
             isVisible = false;
             return;
        }

        // Detect iOS
        const ua = window.navigator.userAgent;
        isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
        
        // Detect Mobile (Android or iOS)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

        // Always show install button on Mobile (fallback to manual instructions if no prompt)
        if (isMobile) {
            isVisible = true;
        }

        // Listen for prompt (Android/Desktop chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            isVisible = true;
        });

        window.addEventListener('appinstalled', () => {
            deferredPrompt = null;
            isVisible = false;
            showInstructions = false;
        });
    });

    async function handleClick() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                deferredPrompt = null;
                isVisible = false;
            }
        } else {
            // Show manual instructions for iOS or browsers without prompt support
            showInstructions = true;
        }
    }

    // SVG Strings for interpolation in i18n
    const iconClass = "inline w-3.5 h-3.5";
    const shareIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${iconClass}"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>`;
    const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${iconClass}"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>`;
    const moreIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${iconClass}"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;
    
    // Helper to replace {icon} with proper HTML wrapper
    function tIcon(key: string, iconSvg: string) {
        const text = $t(key);
        const iconHtml = `<span class="inline-flex items-center justify-center bg-slate-800 p-1 rounded mx-1 align-middle">${iconSvg}</span>`;
        return text.replace('{icon}', iconHtml);
    }
</script>

{#if isVisible}
    <button 
        onclick={handleClick}
        class="fixed bottom-28 md:bottom-6 right-6 z-[60] bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl shadow-indigo-900/50 flex items-center gap-2 font-bold animate-pulse hover:animate-none transition-all active:scale-95 group"
        aria-label={$t('home.install.button')}
    >
        <Download size={24} />
        <span class="text-sm uppercase tracking-wider max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 md:max-w-xs md:inline">{$t('home.install.button')}</span>
    </button>
{/if}

{#if showInstructions}
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl mb-4 sm:mb-0 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <button onclick={() => showInstructions = false} class="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
                <X size={20} />
            </button>
            
            <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Download size={24} class="text-indigo-500"/> {$t('home.install.title')}
            </h3>
            
            <ol class="space-y-4 text-slate-300 text-sm">
                {#if isIOS}
                    <li class="flex items-start gap-3">
                        <span class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-slate-700 text-indigo-400">1</span>
                        <div>{@html tIcon('home.install.ios_step1', shareIcon)}</div>
                    </li>
                    <li class="flex items-start gap-3">
                         <span class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-slate-700 text-indigo-400">2</span>
                         <div>{@html tIcon('home.install.ios_step2', plusIcon)}</div>
                    </li>
                {:else}
                     <li class="flex items-start gap-3">
                        <span class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-slate-700 text-indigo-400">1</span>
                        <div>{@html tIcon('home.install.android_step1', moreIcon)}</div>
                    </li>
                    <li class="flex items-start gap-3">
                         <span class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-slate-700 text-indigo-400">2</span>
                         <div>{@html $t('home.install.android_step2')}</div>
                    </li>
                {/if}
            </ol>
            <div class="mt-6 text-center">
                <button onclick={() => showInstructions = false} class="text-indigo-400 text-sm font-bold hover:text-indigo-300">{$t('home.install.close')}</button>
            </div>
        </div>
    </div>
{/if}
