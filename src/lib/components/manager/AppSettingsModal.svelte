<script lang="ts">
    import { t, locale } from 'svelte-i18n';
    import { appSettings } from '$lib/stores/characterStore';
    import { googleSession } from '$lib/logic/googleDrive';
    import { X, Settings, History, Monitor, Smartphone, Palette, Globe, ArrowLeft, Check, User } from 'lucide-svelte';
    import Toggle from '../common/Toggle.svelte';
    import { slide, fly, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { onMount } from 'svelte';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen = false, onClose }: Props = $props();
    let isMobile = $state(false);

    onMount(() => {
        const checkMobile = () => isMobile = window.innerWidth < 768;
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    });

    function updateSetting(key: string, value: any) {
        appSettings.update(s => ({ ...s, [key]: value }));
    }

    function setLanguage(lang: string) {
        locale.set(lang);
        localStorage.setItem('user_locale', lang);
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center md:p-4"
        onclick={onClose}
        transition:fade={{ duration: 200 }}
    >
        <div
            class="bg-slate-900 border-white/10 w-full md:max-w-md md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh]"
            onclick={e => e.stopPropagation()}
            in:fly={isMobile ? { x: '100%', duration: 600, easing: quintOut } : { y: 20, duration: 300 }}
            out:fly={isMobile ? { x: '100%', duration: 600, easing: quintOut } : { y: 20, duration: 300 }}
        >
            <!-- Header -->
            <div class="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div class="flex items-center gap-3">
                    {#if isMobile}
                        <button
                            onclick={onClose}
                            class="p-2 -ml-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all active:scale-95"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    {:else}
                        <div class="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <Settings size={20} class="text-indigo-400" />
                        </div>
                    {/if}
                    <div>
                        <h2 class="text-lg font-black text-white uppercase tracking-tight">{$t('settings.title')}</h2>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{$t('settings.description')}</p>
                    </div>
                </div>
                {#if !isMobile}
                    <button
                        onclick={onClose}
                        class="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all active:scale-95"
                    >
                        <X size={24} />
                    </button>
                {/if}
            </div>

            <!-- Content -->
            <div class="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar pb-32 md:pb-6">

                <!-- Section: Interface -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2 mb-2 text-indigo-400">
                        <Monitor size={16} />
                        <h3 class="text-xs font-black uppercase tracking-widest">{$t('settings.sections.interface')}</h3>
                    </div>

                    <div class="space-y-6">
                        <Toggle
                            checked={$appSettings.autoOpenHistory}
                            onToggle={(val) => updateSetting('autoOpenHistory', val)}
                            label={$t('settings.options.auto_open_history.label')}
                            description={$t('settings.options.auto_open_history.description')}
                        />
                    </div>
                </div>

                <!-- Section: Language -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2 mb-2 text-amber-400">
                        <Globe size={16} />
                        <h3 class="text-xs font-black uppercase tracking-widest">{$t('common.labels.language') || 'Language'}</h3>
                    </div>

                    <div class="grid grid-cols-1 gap-2">
                        <button
                            onclick={() => setLanguage('pt')}
                            class="flex items-center justify-between px-4 py-3 rounded-2xl border transition-all {$locale === 'pt' ? 'bg-indigo-600/10 border-indigo-500/50 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}"
                        >
                            <div class="flex items-center gap-3">
                                <span class="text-xl">🇧🇷</span>
                                <span class="font-bold">Português (Brasil)</span>
                            </div>
                            {#if $locale === 'pt'}
                                <Check size={18} class="text-indigo-400" />
                            {/if}
                        </button>

                        <button
                            onclick={() => setLanguage('en')}
                            class="flex items-center justify-between px-4 py-3 rounded-2xl border transition-all {$locale === 'en' ? 'bg-indigo-600/10 border-indigo-500/50 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}"
                        >
                            <div class="flex items-center gap-3">
                                <span class="text-xl">🇺🇸</span>
                                <span class="font-bold">English (US)</span>
                            </div>
                            {#if $locale === 'en'}
                                <Check size={18} class="text-indigo-400" />
                            {/if}
                        </button>
                    </div>
                </div>


                <!-- Section: User Identity -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2 mb-2 text-indigo-400">
                        <User size={16} />
                        <h3 class="text-xs font-black uppercase tracking-widest">{$t('settings.sections.identity')}</h3>
                    </div>

                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label for="settings-user-name" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{$t('settings.options.user_name.label')}</label>
                            <div class="relative">
                                <input
                                    id="settings-user-name"
                                    type="text"
                                    class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pr-10 text-white focus:border-indigo-500 outline-none transition-all"
                                    placeholder={$t('settings.options.user_name.placeholder')}
                                    value={$appSettings.userName || ''}
                                    oninput={(e) => updateSetting('userName', e.currentTarget.value)}
                                />
                                {#if !$appSettings.userName && $googleSession.userProfile}
                                    <button
                                        onclick={() => updateSetting('userName', $googleSession.userProfile?.name)}
                                        class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500 px-2 py-1 rounded transition-all"
                                    >
                                        Google
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Appearance -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2 mb-2 text-emerald-400">
                        <Palette size={16} />
                        <h3 class="text-xs font-black uppercase tracking-widest">{$t('settings.sections.appearance')}</h3>
                    </div>

                    <div class="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div class="flex justify-between items-center opacity-50 cursor-not-allowed">
                            <div class="flex flex-col">
                                <span class="text-sm font-black uppercase tracking-widest text-slate-400">{$t('settings.options.theme.label')}</span>
                                <span class="text-[10px] text-slate-500">{$t('settings.options.theme.description')}</span>
                            </div>
                            <div class="w-12 h-6 bg-slate-800 rounded-full border border-white/5 p-1 relative">
                                <div class="w-4 h-4 bg-slate-600 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info footer -->
                <div class="pt-4 border-t border-white/5 flex flex-col items-center gap-4 text-center">
                    <p class="text-[10px] text-slate-500 leading-relaxed max-w-[250px]">
                        {$t('settings.sync_info')}
                    </p>
                </div>
            </div>

            <!-- Bottom Action - Only on Desktop -->
            {#if !isMobile}
                <div class="p-4 bg-white/[0.02] border-t border-white/5">
                    <button
                        onclick={onClose}
                        class="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest py-3 rounded-2xl transition-all active:scale-[0.98] text-sm"
                    >
                        {$t('common.buttons.close')}
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
    }
</style>
