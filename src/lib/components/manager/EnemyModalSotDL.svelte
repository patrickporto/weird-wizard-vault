<script lang="ts">
    import { t } from 'svelte-i18n';
    import { X, Plus, Trash2, Save, Eye, Camera, Sword, Shield, Heart, Zap, Globe } from 'lucide-svelte';
    import Avatar from '../common/Avatar.svelte';
    import ImageCropperModal from '../common/ImageCropperModal.svelte';
    import { saveImage } from '$lib/logic/image';

    interface Props {
        isOpen: boolean;
        initialData?: string;
        onClose: () => void;
        onSave: (form: any) => void;
    }

    let { isOpen = false, initialData = "{}", onClose, onSave }: Props = $props();

    let form = $state(createDefaultForm());
    let tab = $state<'stats' | 'attributes' | 'abilities'>('stats');

    let isCropperOpen = $state(false);
    let tempImage = $state('');
    let fileInput = $state<HTMLInputElement>();

    function handleFileSelect(e: Event) {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = () => {
                tempImage = reader.result as string;
                isCropperOpen = true;
            };
            reader.readAsDataURL(file);
        }
        if (e.target) (e.target as HTMLInputElement).value = '';
    }

    async function handleCrop(blob: Blob) {
        try {
            const hash = await saveImage(blob);
            form.imageUrl = hash;
            isCropperOpen = false;
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Erro ao salvar imagem");
        }
    }

    function createDefaultForm() {
        return {
            name: '',
            difficulty: 1,
            size: '1',
            descriptors: '',
            perception: 10,
            senses: '',
            defense: 10,
            health: 10,
            attributes: { strength: 10, agility: 10, intellect: 10, will: 10 },
            speed: 10,
            speedNotes: '',
            immunities: '',
            traits: [] as { name: string; desc: string }[],
            attackOptions: [] as { name: string; type: string; attackRoll: string; damage: string; desc: string }[],
            specialAttacks: [] as { name: string; desc: string }[],
            endOfRound: [] as { name: string; desc: string }[],
            imageUrl: '',
            global: false
        };
    }

    function getModifier(value: number): string {
        const mod = value - 10;
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    $effect(() => {
        if (isOpen && initialData) {
            try {
                const parsed = JSON.parse(initialData);
                if (Object.keys(parsed).length === 0) {
                    form = createDefaultForm();
                } else {
                    form = { ...createDefaultForm(), ...parsed };
                }
            } catch (e) {
                form = createDefaultForm();
            }
        }
    });

    function addTrait() {
        form.traits = [...form.traits, { name: '', desc: '' }];
    }

    function removeTrait(index: number) {
        form.traits = form.traits.filter((_, i) => i !== index);
    }

    function addAttackOption() {
        form.attackOptions = [...form.attackOptions, { name: '', type: 'melee', attackRoll: '+0', damage: '1d6', desc: '' }];
    }

    function removeAttackOption(index: number) {
        form.attackOptions = form.attackOptions.filter((_, i) => i !== index);
    }

    function addSpecialAttack() {
        form.specialAttacks = [...form.specialAttacks, { name: '', desc: '' }];
    }

    function removeSpecialAttack(index: number) {
        form.specialAttacks = form.specialAttacks.filter((_, i) => i !== index);
    }

    function addEndOfRound() {
        form.endOfRound = [...form.endOfRound, { name: '', desc: '' }];
    }

    function removeEndOfRound(index: number) {
        form.endOfRound = form.endOfRound.filter((_, i) => i !== index);
    }

    function handleBackdropClick(e: MouseEvent) {
        // Do nothing to prevent closing when clicking backdrop
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onclick={handleBackdropClick} role="button" aria-label="Close" tabindex="-1">
    <div class="bg-slate-800 rounded-xl w-full max-w-6xl h-[90vh] border border-slate-700 shadow-2xl overflow-hidden flex flex-col lg:flex-row" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        <!-- Editor Column -->
        <div class="w-full lg:w-1/2 flex flex-col h-full border-r border-slate-700">
            <div class="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                <h3 id="modal-title" class="font-bold text-white text-lg">{$t('session.enemy_modal.title_sotdl')}</h3>
                <button onclick={onClose} class="lg:hidden text-slate-400 hover:text-white"><X size={20}/></button>
            </div>

            <div class="flex border-b border-slate-700 bg-slate-900/50">
                <button onclick={() => tab = 'stats'} class="flex-1 py-3 text-sm font-bold border-b-2 transition-colors {tab === 'stats' ? 'border-indigo-500 text-indigo-400 bg-slate-800' : 'border-transparent text-slate-500 hover:text-white'}">{$t('session.enemy_modal.tab_general')}</button>
                <button onclick={() => tab = 'attributes'} class="flex-1 py-3 text-sm font-bold border-b-2 transition-colors {tab === 'attributes' ? 'border-indigo-500 text-indigo-400 bg-slate-800' : 'border-transparent text-slate-500 hover:text-white'}">{$t('session.enemy_modal.tab_attributes')}</button>
                <button onclick={() => tab = 'abilities'} class="flex-1 py-3 text-sm font-bold border-b-2 transition-colors {tab === 'abilities' ? 'border-indigo-500 text-indigo-400 bg-slate-800' : 'border-transparent text-slate-500 hover:text-white'}">{$t('session.enemy_modal.tab_abilities')}</button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-800/50">
                {#if tab === 'stats'}
                    <div class="space-y-4">
                        <div class="flex items-center gap-4">
                            <div class="relative group cursor-pointer" onclick={() => fileInput?.click()}>
                                <div class="w-16 h-16 rounded-xl overflow-hidden border border-slate-700">
                                    {#key form.imageUrl}
                                        <Avatar hash={form.imageUrl} alt={form.name} size="custom" fallbackText="?" />
                                    {/key}
                                </div>
                                <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                    <Camera size={20} class="text-white"/>
                                </div>
                            </div>
                            <div class="flex-1">
                                <label for="enemy-name" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.name')}</label>
                                <input id="enemy-name" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold text-lg" bind:value={form.name} />
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="enemy-diff" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.difficulty')}</label>
                                <input id="enemy-diff" type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={form.difficulty} />
                            </div>
                            <div>
                                <label for="enemy-size" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.size')}</label>
                                <input id="enemy-size" type="text" placeholder="1/2, 1, 2..." class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={form.size} />
                            </div>
                            <div>
                                <label for="enemy-desc" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.descriptors')}</label>
                                <input id="enemy-desc" type="text" placeholder={$t('session.enemy_modal.descriptors_placeholder')} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" bind:value={form.descriptors} />
                            </div>
                        </div>

                        <div class="flex items-center gap-2 mt-4">
                            <input id="enemy-global" type="checkbox" class="w-4 h-4 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500" bind:checked={form.global} />
                            <label for="enemy-global" class="text-sm font-bold text-slate-400 select-none cursor-pointer flex items-center gap-2">
                                <Globe size={14} /> {$t('session.enemy_modal.global_enemy')}
                            </label>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="enemy-perception" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('sofdl.attributes.perception')}</label>
                                <input id="enemy-perception" type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={form.perception} />
                            </div>
                            <div>
                                <label for="enemy-senses" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.senses')}</label>
                                <input id="enemy-senses" type="text" placeholder={$t('session.enemy_modal.senses_placeholder_sotdl')} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" bind:value={form.senses} />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="enemy-defense" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.defense')}</label>
                                <input id="enemy-defense" type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={form.defense} />
                            </div>
                            <div>
                                <label for="enemy-health" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.health')}</label>
                                <input id="enemy-health" type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={form.health} />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="enemy-speed" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.speed')}</label>
                                <input id="enemy-speed" type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={form.speed} />
                            </div>
                            <div>
                                <label for="enemy-speed-notes" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.speed_notes')}</label>
                                <input id="enemy-speed-notes" type="text" placeholder={$t('session.enemy_modal.speed_notes_placeholder')} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" bind:value={form.speedNotes} />
                            </div>
                        </div>

                        <div>
                            <label for="enemy-immune" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.immunities')}</label>
                            <textarea
                                id="enemy-immune"
                                class="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm min-h-[80px] resize-none focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder={$t('session.enemy_modal.immunities_placeholder_sotdl')}
                                bind:value={form.immunities}
                            ></textarea>
                        </div>
                    </div>
                {:else if tab === 'attributes'}
                    <div class="space-y-6">
                        <div>
                            <h4 class="text-indigo-400 font-bold text-sm uppercase mb-3">{$t('session.enemy_modal.main_attributes')}</h4>
                            <div class="grid grid-cols-4 gap-3">
                                {#each [{ key: 'strength', label: $t('sofdl.attributes.strength') }, { key: 'agility', label: $t('sofdl.attributes.agility') }, { key: 'intellect', label: $t('sofdl.attributes.intellect') }, { key: 'will', label: $t('sofdl.attributes.will') }] as attr}
                                    <div class="bg-slate-900 p-3 rounded border border-slate-700 text-center">
                                        <label for="attr-{attr.key}" class="text-[10px] text-slate-500 uppercase font-bold block mb-1 text-ellipsis overflow-hidden whitespace-nowrap" title={attr.label}>{attr.label.substring(0,3)}</label>
                                        <input id="attr-{attr.key}" type="number" class="w-full bg-transparent text-center font-bold text-white text-xl focus:outline-none mb-1" bind:value={form.attributes[attr.key as keyof typeof form.attributes]} />
                                        <div class="text-xs font-bold {(form.attributes[attr.key as keyof typeof form.attributes] - 10) >= 0 ? 'text-green-500' : 'text-red-500'}">
                                            {getModifier(form.attributes[attr.key as keyof typeof form.attributes])}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                {:else if tab === 'abilities'}
                    <div class="space-y-6">
                        <!-- Traits -->
                        <div class="p-4 bg-slate-900 rounded border border-indigo-500/30">
                            <div class="flex justify-between items-center mb-3">
                                <h4 class="font-bold text-sm uppercase text-indigo-400">{$t('session.enemy_modal.traits')}</h4>
                                <button onclick={addTrait} class="text-xs bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 text-white flex items-center gap-1 border border-slate-700"><Plus size={12}/> {$t('common.buttons.add')}</button>
                            </div>
                            <div class="space-y-3">
                                {#each form.traits as item, idx}
                                    <div class="flex gap-2 items-start">
                                        <div class="flex-1 space-y-1">
                                            <input class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm font-bold placeholder-slate-600" placeholder={$t('session.enemy_modal.name_placeholder')} bind:value={item.name} />
                                            <textarea class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm placeholder-slate-600 resize-none" rows="2" placeholder={$t('session.enemy_modal.desc_placeholder')} bind:value={item.desc}></textarea>
                                        </div>
                                        <button onclick={() => removeTrait(idx)} class="mt-1 text-slate-600 hover:text-red-400 p-2 hover:bg-slate-800 rounded"><Trash2 size={16}/></button>
                                    </div>
                                {/each}
                                {#if form.traits.length === 0}
                                    <div class="text-xs text-slate-600 italic text-center py-4 border-2 border-dashed border-slate-800 rounded">{$t('session.enemy_modal.empty')}</div>
                                {/if}
                            </div>
                        </div>

                        <!-- Attack Options -->
                        <div class="p-4 bg-slate-900 rounded border border-red-500/30">
                            <div class="flex justify-between items-center mb-3">
                                <h4 class="font-bold text-sm uppercase text-red-400">{$t('session.enemy_modal.attack_options')}</h4>
                                <button onclick={addAttackOption} class="text-xs bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 text-white flex items-center gap-1 border border-slate-700"><Plus size={12}/> {$t('common.buttons.add')}</button>
                            </div>
                            <div class="space-y-3">
                                {#each form.attackOptions as item, idx}
                                    <div class="flex gap-2 items-start">
                                        <div class="flex-1 space-y-2">
                                            <div class="grid grid-cols-2 gap-2">
                                                <input class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm font-bold placeholder-slate-600" placeholder={$t('session.enemy_modal.name_placeholder')} bind:value={item.name} />
                                                <select class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" bind:value={item.type}>
                                                    <option value="melee">{$t('session.enemy_modal.melee')}</option>
                                                    <option value="ranged">{$t('session.enemy_modal.ranged')}</option>
                                                </select>
                                            </div>
                                            <div class="grid grid-cols-2 gap-2">
                                                <input class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm placeholder-slate-600" placeholder={$t('session.enemy_modal.attack_placeholder')} bind:value={item.attackRoll} />
                                                <input class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm placeholder-slate-600" placeholder={$t('session.enemy_modal.damage_placeholder')} bind:value={item.damage} />
                                            </div>
                                            <textarea class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm placeholder-slate-600 resize-none" rows="2" placeholder={$t('session.enemy_modal.desc_effects_placeholder')} bind:value={item.desc}></textarea>
                                        </div>
                                        <button onclick={() => removeAttackOption(idx)} class="mt-1 text-slate-600 hover:text-red-400 p-2 hover:bg-slate-800 rounded"><Trash2 size={16}/></button>
                                    </div>
                                {/each}
                                {#if form.attackOptions.length === 0}
                                    <div class="text-xs text-slate-600 italic text-center py-4 border-2 border-dashed border-slate-800 rounded">{$t('session.enemy_modal.empty')}</div>
                                {/if}
                            </div>
                        </div>

                        <!-- Special Attacks -->
                        <div class="p-4 bg-slate-900 rounded border border-orange-500/30">
                            <div class="flex justify-between items-center mb-3">
                                <h4 class="font-bold text-sm uppercase text-orange-400">{$t('session.enemy_modal.special_attacks')}</h4>
                                <button onclick={addSpecialAttack} class="text-xs bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 text-white flex items-center gap-1 border border-slate-700"><Plus size={12}/> {$t('common.buttons.add')}</button>
                            </div>
                            <div class="space-y-3">
                                {#each form.specialAttacks as item, idx}
                                    <div class="flex gap-2 items-start">
                                        <div class="flex-1 space-y-1">
                                            <input class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm font-bold placeholder-slate-600" placeholder={$t('session.enemy_modal.name_placeholder')} bind:value={item.name} />
                                            <textarea class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm placeholder-slate-600 resize-none" rows="2" placeholder={$t('session.enemy_modal.desc_placeholder')} bind:value={item.desc}></textarea>
                                        </div>
                                        <button onclick={() => removeSpecialAttack(idx)} class="mt-1 text-slate-600 hover:text-red-400 p-2 hover:bg-slate-800 rounded"><Trash2 size={16}/></button>
                                    </div>
                                {/each}
                                {#if form.specialAttacks.length === 0}
                                    <div class="text-xs text-slate-600 italic text-center py-4 border-2 border-dashed border-slate-800 rounded">{$t('session.enemy_modal.empty')}</div>
                                {/if}
                            </div>
                        </div>

                        <!-- End of Round -->
                        <div class="p-4 bg-slate-900 rounded border border-yellow-500/30">
                            <div class="flex justify-between items-center mb-3">
                                <h4 class="font-bold text-sm uppercase text-yellow-400">{$t('session.enemy_modal.end_of_round')}</h4>
                                <button onclick={addEndOfRound} class="text-xs bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 text-white flex items-center gap-1 border border-slate-700"><Plus size={12}/> {$t('common.buttons.add')}</button>
                            </div>
                            <div class="space-y-3">
                                {#each form.endOfRound as item, idx}
                                    <div class="flex gap-2 items-start">
                                        <div class="flex-1 space-y-1">
                                            <input class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm font-bold placeholder-slate-600" placeholder={$t('session.enemy_modal.name_placeholder')} bind:value={item.name} />
                                            <textarea class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm placeholder-slate-600 resize-none" rows="2" placeholder={$t('session.enemy_modal.desc_placeholder')} bind:value={item.desc}></textarea>
                                        </div>
                                        <button onclick={() => removeEndOfRound(idx)} class="mt-1 text-slate-600 hover:text-red-400 p-2 hover:bg-slate-800 rounded"><Trash2 size={16}/></button>
                                    </div>
                                {/each}
                                {#if form.endOfRound.length === 0}
                                    <div class="text-xs text-slate-600 italic text-center py-4 border-2 border-dashed border-slate-800 rounded">{$t('session.enemy_modal.empty')}</div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}
            </div>

            <div class="p-4 border-t border-slate-700 bg-slate-900 flex justify-end gap-3">
                <button onclick={onClose} class="px-6 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors">{$t('common.buttons.cancel')}</button>
                <button onclick={() => onSave(form)} class="px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 transition-colors"><Save size={18}/> {$t('common.buttons.save')}</button>
            </div>
        </div>

        <!-- Preview Column -->
        <div class="hidden lg:flex w-1/2 bg-slate-950 flex-col border-l border-slate-800">
            <div class="p-4 border-b border-slate-800 bg-slate-950">
                <h3 class="font-bold text-slate-500 text-xs uppercase flex items-center gap-2"><Eye size={14}/> {$t('session.enemy_modal.preview')}</h3>
            </div>
            <div class="flex-1 p-8 overflow-y-auto flex items-start justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                <!-- Card Preview - SotDL Style -->
                <div class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl">
                    <!-- Header -->
                    <div class="flex items-start gap-3 mb-4">
                        {#if form.imageUrl}
                            <div class="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shadow-lg flex-shrink-0">
                                <Avatar hash={form.imageUrl} alt={form.name} size="custom" />
                            </div>
                        {/if}
                        <div class="flex-1 min-w-0">
                            <div class="flex items-baseline gap-2">
                                <h2 class="text-xl font-bold text-white font-serif tracking-wide">{form.name || $t('session.enemy_modal.enemy_default')}</h2>
                                <span class="text-red-500 font-bold text-sm">{$t('session.enemies.difficulty').toUpperCase()} {form.difficulty}</span>
                            </div>
                            <div class="text-sm text-slate-400 mt-1">
                                {$t('session.enemy_modal.size')} {form.size} {form.descriptors}
                            </div>
                        </div>
                    </div>

                    <!-- Perception & Senses -->
                    <div class="text-sm mb-3">
                        <span class="text-slate-500 font-bold">{$t('sofdl.attributes.perception')}</span>
                        <span class="text-white ml-1">{form.perception} ({getModifier(form.perception)})</span>
                        {#if form.senses}
                            <span class="text-slate-400">; {form.senses}</span>
                        {/if}
                    </div>

                    <!-- Defense & Health -->
                    <div class="text-sm mb-3">
                        <span class="text-slate-500 font-bold">{$t('session.enemy_modal.defense')}</span>
                        <span class="text-white ml-1">{form.defense}</span>
                        <span class="text-slate-500 font-bold ml-3">{$t('session.enemy_modal.health')}</span>
                        <span class="text-white ml-1">{form.health}</span>
                    </div>

                    <!-- Attributes -->
                    <div class="text-sm mb-3">
                        <span class="text-white">
                            <span class="text-slate-500 font-bold">{$t('sofdl.attributes.strength')}</span> {form.attributes.strength} ({getModifier(form.attributes.strength)}),
                            <span class="text-slate-500 font-bold">{$t('sofdl.attributes.agility')}</span> {form.attributes.agility} ({getModifier(form.attributes.agility)}),
                            <span class="text-slate-500 font-bold">{$t('sofdl.attributes.intellect')}</span> {form.attributes.intellect} ({getModifier(form.attributes.intellect)}),
                            <span class="text-slate-500 font-bold">{$t('sofdl.attributes.will')}</span> {form.attributes.will} ({getModifier(form.attributes.will)})
                        </span>
                    </div>

                    <!-- Speed -->
                    <div class="text-sm mb-3">
                        <span class="text-slate-500 font-bold">{$t('session.enemy_modal.speed')}</span>
                        <span class="text-white ml-1">{form.speed}</span>
                        {#if form.speedNotes}
                            <span class="text-slate-400">; {form.speedNotes}</span>
                        {/if}
                    </div>

                    <!-- Immunities -->
                    {#if form.immunities}
                        <div class="text-sm mb-4">
                            <span class="text-slate-500 font-bold">{$t('session.enemy_modal.immunities')}</span>
                            <span class="text-white ml-1">{form.immunities}</span>
                        </div>
                    {/if}

                    <div class="border-t border-slate-700 my-4"></div>

                    <!-- Traits -->
                    {#if form.traits.length > 0}
                        {#each form.traits as trait}
                            <div class="mb-3 text-sm">
                                <span class="font-bold text-indigo-400">{trait.name}</span>
                                <span class="text-slate-300 ml-1">{trait.desc}</span>
                            </div>
                        {/each}
                    {/if}

                    <!-- Attack Options -->
                    {#if form.attackOptions.length > 0}
                        <div class="mt-4">
                            <h4 class="text-red-500 font-bold text-xs uppercase mb-2 tracking-wider">{$t('session.enemy_modal.attack_options')}</h4>
                            {#each form.attackOptions as atk}
                                <div class="mb-2 text-sm">
                                    <span class="font-bold text-white">{atk.name}</span>
                                    <span class="text-slate-400">({atk.type === 'melee' ? $t('session.enemy_modal.melee').toLowerCase() : $t('session.enemy_modal.ranged').toLowerCase()})</span>
                                    <span class="text-white ml-1">{atk.attackRoll} ({atk.damage})</span>
                                    {#if atk.desc}
                                        <span class="text-slate-300">; {atk.desc}</span>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}

                    <!-- Special Attacks -->
                    {#if form.specialAttacks.length > 0}
                        <div class="mt-4">
                            <h4 class="text-orange-500 font-bold text-xs uppercase mb-2 tracking-wider">{$t('session.enemy_modal.special_attacks')}</h4>
                            {#each form.specialAttacks as sa}
                                <div class="mb-2 text-sm">
                                    <span class="font-bold text-white">{sa.name}</span>
                                    <span class="text-slate-300 ml-1">{sa.desc}</span>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    <!-- End of Round -->
                    {#if form.endOfRound.length > 0}
                        <div class="mt-4">
                            <h4 class="text-yellow-500 font-bold text-xs uppercase mb-2 tracking-wider">{$t('session.enemy_modal.end_of_round')}</h4>
                            {#each form.endOfRound as eor}
                                <div class="mb-2 text-sm">
                                    <span class="font-bold text-white">{eor.name}</span>
                                    <span class="text-slate-300 ml-1">{eor.desc}</span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<input
    type="file"
    bind:this={fileInput}
    onchange={handleFileSelect}
    hidden
    accept="image/*"
/>
<ImageCropperModal
    isOpen={isCropperOpen}
    imageUrl={tempImage}
    onClose={() => isCropperOpen = false}
    onCrop={handleCrop}
/>
{/if}
