<script lang="ts">
    import { t } from 'svelte-i18n';
    import { quintOut } from 'svelte/easing';
    import { slide, fade } from 'svelte/transition';
    import { Shield, ArrowRight, Dices, ChevronLeft, Check } from 'lucide-svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import SystemSelector from '$lib/components/common/SystemSelector.svelte';
    import { DEFAULT_SYSTEM, getDefaultTier, getAvailableTiers } from '$lib/systems';
    import type { TierLevel } from '$lib/systems';
    import { generateRandomName } from '$lib/logic/nameGenerator';
    import { appSettings } from '$lib/stores/characterStore';
    import { googleSession } from '$lib/logic/googleDrive';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        onSave: (form: any) => void;
    }

    let { isOpen = false, onClose, onSave }: Props = $props();

    let step = $state(1);
    let form = $state({
        name: '',
        description: '',
        gmName: '',
        password: '',
        system: '',
        tier: 'starting' as TierLevel
    });

    // Reset form when modal opens
    $effect(() => {
        if (isOpen) {
            step = 1;
            form.system = '';
            form.tier = 'starting';
            form.name = '';
            form.description = '';
            form.gmName = $appSettings.userName || $googleSession.userProfile?.name || '';
            form.password = '';
        }
    });

    function nextStep() {
        step += 1;
    }

    function prevStep() {
        if (step > 1) step -= 1;
    }

    function handleSystemSelect(systemId: string) {
        form.system = systemId;
        form.tier = getDefaultTier(systemId);
        nextStep();
    }

    function handleFinish() {
        onSave({
            ...form
        });
    }

    function generateCampaignName() {
        form.name = generateRandomName('campaign');
    }
</script>

{#if isOpen}
    <!-- Full Screen Overlay -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col overflow-hidden"
        transition:fade={{ duration: 200 }}
    >
        <!-- Header -->
        <div class="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
            <div class="flex items-center gap-4">
                {#if step > 1}
                    <button onclick={prevStep} class="p-2 -ml-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                        <ChevronLeft size={24} />
                    </button>
                {/if}
                <div>
                    <h2 class="text-xl font-black text-white uppercase tracking-tight">{$t('wizard.campaign.title')}</h2>
                    <div class="flex items-center gap-2 mt-1">
                        {#each [1, 2, 3, 4] as s}
                            <div class="h-1 rounded-full transition-all duration-500 {s <= step ? 'w-8 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'w-2 bg-slate-800'}"></div>
                        {/each}
                    </div>
                </div>
            </div>
            <button onclick={onClose} class="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-white/5 rounded-lg transition-all">
                {$t('wizard.campaign.cancel')}
            </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center">

            <div class="w-full max-w-2xl py-8">
                {#if step === 1}
                    <div in:fade={{ duration: 300, delay: 100 }} class="space-y-6 text-center">
                        <h3 class="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2">{$t('wizard.campaign.step1_title')}</h3>
                        <p class="text-slate-400 max-w-lg mx-auto mb-8">{$t('wizard.campaign.step1_subtitle')}</p>

                        <SystemSelector selectedSystem={form.system} onSelect={handleSystemSelect} />
                    </div>
                {:else if step === 2}
                    <div in:fade={{ duration: 300, delay: 100 }} class="space-y-8 w-full max-w-lg mx-auto">
                        <div class="text-center">
                            <h3 class="text-3xl font-black text-white uppercase tracking-tight mb-2">{$t('wizard.campaign.step2_title')}</h3>
                            <p class="text-slate-400">{$t('wizard.campaign.step2_subtitle')}</p>
                        </div>

                        <div class="space-y-6">
                            <div>
                                <label class="text-xs text-slate-500 uppercase font-black block mb-2 tracking-widest">{$t('wizard.campaign.step2_name_label')}</label>
                                <div class="relative">
                                    <input
                                        class="w-full bg-slate-900 border-2 border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl p-4 text-lg font-bold text-white outline-none transition-all placeholder:text-slate-600"
                                        placeholder={$t('wizard.campaign.step2_name_placeholder')}
                                        bind:value={form.name}
                                    />
                                    <button
                                        onclick={generateCampaignName}
                                        class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                        title={$t('wizard.campaign.step2_random_name_tooltip')}
                                    >
                                        <Dices size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="text-xs text-slate-500 uppercase font-black block mb-2 tracking-widest">{$t('wizard.campaign.step2_gm_label')}</label>
                                <input
                                    class="w-full bg-slate-900 border-2 border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl p-4 font-medium text-white outline-none transition-all placeholder:text-slate-600"
                                    placeholder={$t('wizard.campaign.step2_gm_placeholder')}
                                    bind:value={form.gmName}
                                />
                            </div>

                            <div>
                                <label class="text-xs text-slate-500 uppercase font-black block mb-2 tracking-widest">{$t('wizard.campaign.step2_description_label')}</label>
                                <textarea
                                    class="w-full bg-slate-900 border-2 border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl p-4 text-white outline-none transition-all resize-none placeholder:text-slate-600"
                                    rows="4"
                                    placeholder={$t('wizard.campaign.step2_description_placeholder')}
                                    bind:value={form.description}
                                ></textarea>
                            </div>

                            <button onclick={nextStep} disabled={!form.name} class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                {$t('wizard.campaign.continue')} <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                {:else if step === 3}
                    <div in:fade={{ duration: 300, delay: 100 }} class="space-y-8 w-full max-w-lg mx-auto">
                        <div class="text-center">
                            <h3 class="text-3xl font-black text-white uppercase tracking-tight mb-2">{$t('wizard.campaign.step3_title')}</h3>
                            <p class="text-slate-400">{$t('wizard.campaign.step3_subtitle')}</p>
                        </div>

                        <div class="space-y-3">
                            {#each getAvailableTiers(form.system) as tierOption}
                                <button
                                    onclick={() => form.tier = tierOption.value}
                                    class="w-full relative flex items-center p-4 rounded-xl border-2 text-left transition-all {form.tier === tierOption.value ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500/50' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'}"
                                >
                                    <div class="flex-1">
                                        <div class="font-black uppercase tracking-wide text-lg {form.tier === tierOption.value ? 'text-indigo-400' : 'text-slate-300'}">{$t(tierOption.labelKey)}</div>
                                        <div class="text-xs opacity-60 mt-1 font-medium">{$t('wizard.campaign.step3_tier_description')}</div>
                                    </div>
                                    {#if form.tier === tierOption.value}
                                        <div class="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                            <Check size={14} class="text-white" />
                                        </div>
                                    {/if}
                                </button>
                            {/each}
                        </div>

                        <button onclick={nextStep} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            {$t('wizard.campaign.continue')} <ArrowRight size={20} />
                        </button>
                    </div>
                {:else if step === 4}
                     <div in:fade={{ duration: 300, delay: 100 }} class="space-y-8 w-full max-w-lg mx-auto">
                        <div class="text-center">
                            <h3 class="text-3xl font-black text-white uppercase tracking-tight mb-2">{$t('wizard.campaign.step4_title')}</h3>
                            <p class="text-slate-400">{$t('wizard.campaign.step4_subtitle')}</p>
                        </div>

                        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <label class="text-xs text-slate-500 uppercase font-black block mb-2 tracking-widest flex items-center gap-2">
                                <Shield size={14} /> {$t('wizard.campaign.step4_password_label')}
                            </label>

                            <input
                                type="password"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 font-mono text-center tracking-widest text-lg"
                                placeholder="••••••••"
                                bind:value={form.password}
                            />

                            <p class="text-xs text-slate-500 leading-relaxed text-center px-4">
                                {$t('wizard.campaign.step4_password_info')}
                            </p>
                        </div>

                        <button onclick={handleFinish} class="w-full bg-emerald-500 hover:bg-emerald-400 text-white text-lg font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            {$t('wizard.campaign.create')}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
    }
</style>
