<script lang="ts">
    import { t } from 'svelte-i18n';
    import { fade, slide } from 'svelte/transition';
    import { ChevronLeft, ArrowRight, Dices, User, BookOpen, Sword, Check } from 'lucide-svelte';
    import SystemSelector from '$lib/components/common/SystemSelector.svelte';
    import { generateRandomName } from '$lib/logic/nameGenerator';
    import { appSettings } from '$lib/stores/characterStore';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        onSave: (form: any) => void;
    }

    let { isOpen = false, onClose, onSave }: Props = $props();

    let step = $state(1);
    let form = $state({
        name: '',
        playerName: '',
        system: '',
        ancestry: '',
        profession: '',
        novicePath: ''
    });

    let otherAncestry = $state('');
    let otherPath = $state('');

    // Profession Selection State
    let selectedCategory = $state('');

    // Professions Data
    const PROFESSION_KEYS = {
        sofdl: {
            Academic: ['architecture', 'astrology', 'engineering', 'etiquette_customs', 'folklore', 'geography', 'heraldry', 'history', 'law', 'literature', 'magic', 'medicine', 'navigation', 'occult', 'philosophy', 'politics', 'nature', 'religion', 'science', 'war'],
            Criminal: ['agitator', 'beggar', 'burglar', 'carouser', 'charlatan', 'cultist', 'fence', 'forger', 'gambler', 'grave_robber', 'informant', 'murderer', 'pickpocket', 'pirate', 'prostitute', 'rebel', 'saboteur', 'spy', 'thug', 'urchin'],
            Martial: ['constable', 'detective', 'guard', 'jailer', 'officer', 'marine', 'mercenary', 'militia_member', 'patroller', 'peasant_conscript', 'slave', 'soldier', 'squire', 'torturer'],
            Wilderness: ['bandit', 'barbarian', 'exile', 'gatherer', 'guide', 'hermit', 'hunter', 'nomad', 'pioneer', 'poacher', 'prospector', 'outlaw', 'refugee', 'spelunker', 'tracker', 'trapper', 'woodcutter'],
            Religious: ['devotee', 'evangelist', 'flagellant', 'heretic', 'initiate_old_faith', 'minister', 'acolyte_new_god', 'inquisitor_henchman', 'pilgrim', 'street_preacher', 'temple_ward'],
            Common: ['animal_trainer', 'apothecary', 'artisan', 'artist', 'boatman', 'butcher', 'cook', 'drover', 'entertainer', 'farmer', 'fisher', 'groom', 'laborer', 'merchant', 'miner', 'musician', 'sailor', 'servant', 'shopkeeper', 'teamster']
        },
        sofww: {
            Entertainment: ['acrobat', 'animal_handler', 'artist', 'busker', 'clown', 'dancer', 'fortune_teller', 'juggler', 'singer', 'thespian'],
            Military: ['caravan_guard', 'herald', 'house_guard', 'marine', 'member_of_the_watch', 'mercenary_soldier', 'militia_member', 'soldier', 'squire', 'sworn_bodyguard'],
            Religious: ['acolyte', 'aspirant', 'cultist', 'evangelist', 'fundamentalist', 'heretic', 'missionary', 'minister', 'prophet', 'scribe'],
            Academic: ['apothecary', 'apprentice_magician', 'astrologer', 'doctor', 'folklorist', 'inventor', 'naturalist', 'occultist', 'philosopher', 'politician'],
            Aristocratic: ['carouser', 'dilettante', 'merchant', 'landholder', 'influencer'],
            Common: ['baker', 'bartender', 'carpenter', 'cook', 'exterminator', 'farmer', 'fisher', 'gravedigger', 'groom', 'herder', 'jeweler', 'laborer', 'mason', 'miner', 'sailor', 'servant', 'shopkeeper', 'smith', 'tanner', 'teamster'],
            Criminal: ['bandit', 'burglar', 'charlatan', 'constable', 'detective', 'forger', 'grave_robber', 'jailer', 'mugger', 'rake'],
            Wilderness: ['beggar', 'forester', 'gatherer', 'hunter', 'nomad', 'pilgrim', 'prospector', 'recluse', 'spelunker', 'woodcutter']
        }
    };

    $effect(() => {
        if (isOpen) {
            step = 1;
            form.system = '';
            form.name = '';
            form.playerName = $appSettings.defaultPlayerName || '';
            form.ancestry = '';
            form.profession = '';
            form.novicePath = '';
            otherAncestry = '';
            otherPath = '';
            selectedCategory = '';
        }
    });

    function nextStep() {
        if (step === 2 && form.ancestry === 'Other' && !otherAncestry) return;
        if (step === 4 && form.novicePath === 'Other' && !otherPath) return;

        if (step === 2 && form.ancestry === 'Other') form.ancestry = otherAncestry;
        if (step === 4 && form.novicePath === 'Other') form.novicePath = otherPath;

        // Reset category when leaving profession step
        if (step === 3) selectedCategory = '';

        step += 1;
    }

    function prevStep() {
        if (step > 1) step -= 1;
    }

    function handleSystemSelect(systemId: string) {
        form.system = systemId;
        nextStep();
    }

    function generateCharacterName() {
        form.name = generateRandomName('person');
    }

    function getRandomProfession() {
        // @ts-ignore
        const currentSystem = (form.system === 'sofdl' || form.system === 'sofww') ? form.system : 'sofww';
        const systemProfessions = PROFESSION_KEYS[currentSystem];
        const categories = Object.keys(systemProfessions);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        // @ts-ignore
        const keys = systemProfessions[randomCategory];
        const randomKey = keys[Math.floor(Math.random() * keys.length)];

        const translatedProfession = $t(`professions.${currentSystem}.${randomCategory.toLowerCase()}.${randomKey}`);
        const translatedCategory = $t(`professions.categories.${randomCategory.toLowerCase()}`);
        form.profession = `${translatedProfession} (${translatedCategory})`;
        selectedCategory = ''; // Close any open category view
    }

    function selectProfession(category: string, key: string) {
        const currentSystem = (form.system === 'sofdl' || form.system === 'sofww') ? form.system : 'sofww';
        const translatedProfession = $t(`professions.${currentSystem}.${category.toLowerCase()}.${key}`);
        const translatedCategory = $t(`professions.categories.${category.toLowerCase()}`);
        form.profession = `${translatedProfession} (${translatedCategory})`;
    }

    function handleFinish() {
        // Finalize "Other" fields if on last step
        if (form.novicePath === 'Other') form.novicePath = otherPath;

        const currentSystem = (form.system === 'sofdl' || form.system === 'sofww') ? form.system : 'sofww';

        // Translate Ancestry if it's a standard key
        let finalAncestry = form.ancestry;
        const standardAncestries = ['Human', 'Changeling', 'Clockwork', 'Dwarf', 'Goblin', 'Orc'];
        if (standardAncestries.includes(finalAncestry)) {
             finalAncestry = $t(`ancestries.${currentSystem}.${finalAncestry.toLowerCase()}`);
        }

        // Translate Path if it's a standard key
        let finalPath = form.novicePath;
        const standardPaths = ['Magician', 'Priest', 'Rogue', 'Warrior', 'Fighter', 'Mage', 'Ancestry'];
        if (standardPaths.includes(finalPath)) {
            finalPath = $t(`paths.${currentSystem}.${finalPath.toLowerCase()}`);
        }

        const finalForm = {
            ...form,
            ancestry: finalAncestry,
            novicePath: finalPath,
            level: form.system === 'sofdl' ? 0 : 1, // DL starts at 0, WW usually 1
            health: form.system === 'sofdl' ? 10 : 10, // Defaults, will be adjusted by ancestry usually
            defense: 10
        };
        onSave(finalForm);
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
                    <h2 class="text-xl font-black text-white uppercase tracking-tight">{$t('wizard.character.title')}</h2>
                    <div class="flex items-center gap-2 mt-1">
                        {#each [1, 2, 3, 4, 5] as s}
                            <div class="h-1 rounded-full transition-all duration-500 {s <= step ? 'w-8 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'w-2 bg-slate-800'}"></div>
                        {/each}
                    </div>
                </div>
            </div>
            <button onclick={onClose} class="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-white/5 rounded-lg transition-all">
                {$t('wizard.character.cancel')}
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center">
            <div class="w-full max-w-2xl py-8">

                {#if step === 1}
                     <div in:fade={{ duration: 300, delay: 100 }} class="space-y-6 text-center">
                        <h3 class="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2">{$t('wizard.character.step1_title')}</h3>
                        <p class="text-slate-400 max-w-lg mx-auto mb-8">{$t('wizard.character.step1_subtitle')}</p>
                        <SystemSelector selectedSystem={form.system} onSelect={handleSystemSelect} />
                    </div>

                {:else if step === 2}
                    <div in:fade={{ duration: 300, delay: 100 }} class="space-y-8 w-full max-w-lg mx-auto">
                        <div class="text-center">
                            <h3 class="text-3xl font-black text-white uppercase tracking-tight mb-2">{$t('wizard.character.step2_title')}</h3>
                            <p class="text-slate-400">{$t('wizard.character.step2_subtitle')}</p>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            {#if form.system === 'sofdl'}
                                {#each ['Human', 'Changeling', 'Clockwork', 'Dwarf', 'Goblin', 'Orc', 'Other'] as ancestry}
                                    <button
                                        onclick={() => form.ancestry = ancestry}
                                        class="p-4 rounded-xl border-2 text-center font-bold uppercase tracking-wider transition-all {form.ancestry === ancestry ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}"
                                    >
                                        {$t(`ancestries.sofdl.${ancestry.toLowerCase()}`)}
                                    </button>
                                {/each}
                            {:else}
                                <button
                                    onclick={() => form.ancestry = 'Human'}
                                    class="p-4 rounded-xl border-2 text-center font-bold uppercase tracking-wider transition-all {form.ancestry === 'Human' ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}"
                                >
                                    {$t('ancestries.sofww.human')}
                                </button>
                                <button
                                    onclick={() => form.ancestry = 'Other'}
                                    class="p-4 rounded-xl border-2 text-center font-bold uppercase tracking-wider transition-all {form.ancestry === 'Other' ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}"
                                >
                                    {$t('ancestries.sofww.other')}
                                </button>
                            {/if}
                        </div>

                        {#if form.ancestry === 'Other'}
                            <div in:slide class="pt-2">
                                <label for="other-ancestry" class="text-xs text-slate-500 uppercase font-black block mb-2 tracking-widest">{$t('wizard.character.step2_other_label')}</label>
                                <input
                                    id="other-ancestry"
                                    class="w-full bg-slate-900 border-2 border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl p-4 text-white outline-none transition-all placeholder:text-slate-600"
                                    placeholder={$t('wizard.character.step2_other_placeholder')}
                                    bind:value={otherAncestry}
                                />
                            </div>
                        {/if}

                        <button onclick={nextStep} disabled={!form.ancestry || (form.ancestry === 'Other' && !otherAncestry)} class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            {$t('wizard.character.continue')} <ArrowRight size={20} />
                        </button>
                    </div>

                {:else if step === 3}
                    <div in:fade={{ duration: 300, delay: 100 }} class="space-y-8 w-full max-w-lg mx-auto">
                        <div class="text-center">
                            <h3 class="text-3xl font-black text-white uppercase tracking-tight mb-2">{$t('wizard.character.step3_title')}</h3>
                            <p class="text-slate-400">{$t('wizard.character.step3_subtitle')}</p>
                        </div>

                        <div class="space-y-4">
                            <!-- Category Selection or Profession List -->
                            {#if !selectedCategory}
                                <div class="grid grid-cols-2 gap-2">
                                    {#each Object.keys(PROFESSION_KEYS[form.system === 'sofdl' ? 'sofdl' : 'sofww']) as category}
                                        <button
                                            onclick={() => selectedCategory = category}
                                            class="p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                                        >
                                            {$t(`professions.categories.${category.toLowerCase()}`)}
                                        </button>
                                    {/each}
                                </div>
                            {:else}
                                <div in:fade={{ duration: 200 }} class="space-y-3">
                                    <div class="flex items-center justify-between">
                                        <button onclick={() => selectedCategory = ''} class="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest flex items-center gap-1 transition-all">
                                            <ChevronLeft size={14} /> {$t(`professions.categories.${selectedCategory.toLowerCase()}`)}
                                        </button>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                        {#each PROFESSION_KEYS[form.system === 'sofdl' ? 'sofdl' : 'sofww'][selectedCategory] as key}
                                            {@const profName = $t(`professions.${form.system === 'sofdl' ? 'sofdl' : 'sofww'}.${selectedCategory.toLowerCase()}.${key}`)}
                                            <button
                                                onclick={() => selectProfession(selectedCategory, key)}
                                                class="p-2.5 rounded-lg border text-left text-xs font-bold transition-all {form.profession.includes(profName) ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}"
                                            >
                                                {profName}
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <!-- Chosen Profession Display & Random Roll -->
                            <div class="bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-6 text-center space-y-4">
                                {#if !form.profession}
                                    <div class="w-16 h-16 bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-2">
                                        <BookOpen size={28} class="text-slate-600" />
                                    </div>
                                    <p class="text-xs text-slate-500">{$t('wizard.character.step3_empty_message')}</p>
                                {:else}
                                    <div in:fade class="space-y-1">
                                        <div class="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{$t('wizard.character.step3_your_profession')}</div>
                                        <div class="text-xl font-black text-white">{form.profession}</div>
                                    </div>
                                {/if}

                                <button
                                    onclick={getRandomProfession}
                                    class="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 hover:border-white/20 text-xs"
                                >
                                    <Dices size={16} /> {form.profession ? $t('wizard.character.step3_roll_again') : $t('wizard.character.step3_roll')}
                                </button>
                            </div>
                        </div>

                        <button onclick={nextStep} disabled={!form.profession} class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            {$t('wizard.character.continue')} <ArrowRight size={20} />
                        </button>
                    </div>

                {:else if step === 4}
                     <div in:fade={{ duration: 300, delay: 100 }} class="space-y-8 w-full max-w-lg mx-auto">
                        <div class="text-center">
                            <h3 class="text-3xl font-black text-white uppercase tracking-tight mb-2">{$t('wizard.character.step4_title')}</h3>
                            <p class="text-slate-400">{$t('wizard.character.step4_subtitle')}</p>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                             <button
                                onclick={() => form.novicePath = ''}
                                class="col-span-2 p-3 text-xs text-slate-500 hover:text-white uppercase tracking-widest hover:underline"
                            >
                                {$t('wizard.character.step4_skip')}
                            </button>

                             {#if form.system === 'sofdl'}
                                {#each ['Magician', 'Priest', 'Rogue', 'Warrior', 'Other'] as path}
                                    <button
                                        onclick={() => form.novicePath = path}
                                        class="p-4 rounded-xl border-2 text-center font-bold uppercase tracking-wider transition-all {form.novicePath === path ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}"
                                    >
                                        {$t(`paths.sofdl.${path.toLowerCase()}`)}
                                    </button>
                                {/each}
                            {:else}
                                {#each ['Fighter', 'Mage', 'Priest', 'Rogue', 'Ancestry', 'Other'] as path}
                                    <button
                                        onclick={() => form.novicePath = path}
                                        class="p-4 rounded-xl border-2 text-center font-bold uppercase tracking-wider transition-all {form.novicePath === path ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}"
                                    >
                                        {$t(`paths.sofww.${path.toLowerCase()}`)}
                                    </button>
                                {/each}
                            {/if}
                        </div>

                         {#if form.novicePath === 'Other'}
                            <div in:slide class="pt-2">
                                <label for="other-path" class="text-xs text-slate-500 uppercase font-black block mb-2 tracking-widest">{$t('wizard.character.step4_other_label')}</label>
                                <input
                                    id="other-path"
                                    class="w-full bg-slate-900 border-2 border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl p-4 text-white outline-none transition-all placeholder:text-slate-600"
                                    placeholder={$t('wizard.character.step4_other_placeholder')}
                                    bind:value={otherPath}
                                />
                            </div>
                        {/if}

                        <button onclick={nextStep} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            {$t('wizard.character.continue')} <ArrowRight size={20} />
                        </button>
                    </div>

                {:else if step === 5}
                    <div in:fade={{ duration: 300, delay: 100 }} class="space-y-8 w-full max-w-lg mx-auto">
                        <div class="text-center">
                            <h3 class="text-3xl font-black text-white uppercase tracking-tight mb-2">{$t('wizard.character.step5_title')}</h3>
                            <p class="text-slate-400">{$t('wizard.character.step5_subtitle')}</p>
                        </div>

                         <div class="space-y-6">
                            <div>
                                <label for="character-name" class="text-xs text-slate-500 uppercase font-black block mb-2 tracking-widest">{$t('wizard.character.step5_character_name_label')}</label>
                                <div class="relative">
                                    <input
                                        id="character-name"
                                        class="w-full bg-slate-900 border-2 border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl p-4 text-lg font-bold text-white outline-none transition-all placeholder:text-slate-600"
                                        placeholder={$t('wizard.character.step5_character_name_placeholder')}
                                        bind:value={form.name}
                                    />
                                    <button
                                        onclick={generateCharacterName}
                                        class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                        title={$t('wizard.character.step5_random_name_tooltip')}
                                    >
                                        <Dices size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label for="player-name" class="text-xs text-slate-500 uppercase font-black block mb-2 tracking-widest flex items-center gap-2">
                                     <User size={14} /> {$t('wizard.character.step5_player_name_label')}
                                </label>
                                <input
                                    id="player-name"
                                    class="w-full bg-slate-900 border-2 border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl p-4 font-medium text-white outline-none transition-all placeholder:text-slate-600"
                                    placeholder={$t('wizard.character.step5_player_name_placeholder')}
                                    bind:value={form.playerName}
                                />
                            </div>

                            <div class="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
                                <Sword size={20} class="text-indigo-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 class="text-sm font-bold text-white mb-1">{$t('wizard.character.step5_ready_title')}</h4>
                                    <p class="text-xs text-slate-400">{$t('wizard.character.step5_ready_message')}</p>
                                </div>
                            </div>

                             <button onclick={handleFinish} disabled={!form.name} class="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-lg font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                {$t('wizard.character.create')}
                            </button>
                         </div>
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
