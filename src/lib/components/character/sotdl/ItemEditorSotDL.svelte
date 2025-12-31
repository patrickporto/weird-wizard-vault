<script lang="ts">
    import { t } from 'svelte-i18n';
    import { Trash2, Plus, X, Search } from 'lucide-svelte';
    import { sotdlCharacterActions } from '$lib/stores/characterStoreSotDL';
    import { modalState } from '$lib/stores/characterStore';
    import Modal from '$lib/components/common/Modal.svelte';
    import DiceCounter from '$lib/components/common/DiceCounter.svelte';
    import Tooltip from '$lib/components/common/Tooltip.svelte';
    import { uuidv7 } from 'uuidv7';

    // Constants for SotDL
    const ITEM_TYPES = {
        WEAPON: 'Weapon',
        ARMOR: 'Armor',
        SHIELD: 'Shield',
        OTHER: 'Other'
    };

    const ARMOR_TYPES = {
        CLOTHING: 'Clothing',
        LIGHT: 'Light',
        MEDIUM: 'Medium',
        HEAVY: 'Heavy'
    };

    const WEAPON_HANDS = {
        ONE: 'One-handed',
        TWO: 'Two-handed',
        OFF: 'Off-hand'
    };

    const AVAILABILITY = {
        COMMON: 'Common',
        UNCOMMON: 'Uncommon',
        RARE: 'Rare',
        EXOTIC: 'Exotic'
    };

    const WEAPON_PROPERTIES = [
        'Cumbersome', 'Defensive', 'Finesse', 'Misfire', 'Range', 'Reach', 'Reload', 'Size 1', 'Uses', 'Thrown'
    ];

    let isOpen = $derived($modalState.isOpen && $modalState.type === 'item_sotdl');
    let data = $derived($modalState.data);

    let formData = $state({
        id: undefined as string | undefined,
        name: '',
        type: ITEM_TYPES.OTHER,
        quantity: 1,
        description: '',
        availability: AVAILABILITY.COMMON,
        damage: '0',
        properties: '',
        hands: WEAPON_HANDS.ONE,
        range: 'Melee',
        armorType: ARMOR_TYPES.CLOTHING,
        defenseFixed: 0,
        defenseMod: 0,
        damageMod: 0
    });

    let selectedProps = $state<string[]>([]);
    let showPropModal = $state(false);
    let propSearch = $state('');

    let filteredProps = $derived(
        WEAPON_PROPERTIES.filter(p =>
            !selectedProps.includes(p) &&
            p.toLowerCase().includes(propSearch.toLowerCase())
        )
    );

    // Dice/Damage Steps for SotDL
    const sotdlDamageSteps = ['1', '1d3'];

    $effect(() => {
        if (isOpen && data) {
            formData = { ...data };
            selectedProps = data.properties ? data.properties.split(',').map((p: string) => p.trim()).filter((p: string) => p) : [];
        } else if (isOpen && !data) {
            formData = {
                id: undefined, name: '', type: ITEM_TYPES.OTHER, quantity: 1, description: '',
                availability: AVAILABILITY.COMMON, damage: '0', properties: '',
                hands: WEAPON_HANDS.ONE, range: 'Melee', armorType: ARMOR_TYPES.CLOTHING,
                defenseFixed: 0, defenseMod: 0, damageMod: 0
            };
            selectedProps = [];
        }
    });

    function toggleProp(prop: string) {
        if (selectedProps.includes(prop)) {
            selectedProps = selectedProps.filter(p => p !== prop);
        } else {
            selectedProps = [...selectedProps, prop];
        }
    }

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function saveItem() {
        if (!formData.name?.trim()) return alert($t('character.modals.name_required'));

        const finalProps = selectedProps.join(', ');
        const newItem = {
            ...formData,
            properties: finalProps,
            id: formData.id || uuidv7()
        };

        if (data && data.id) sotdlCharacterActions.updateItem(newItem);
        else sotdlCharacterActions.addItem(newItem);
        onClose();
    }
</script>

<Modal {isOpen} title={$t('character.modals.item_editor')} {onClose}>
    <div class="space-y-4 p-1">
        <div>
            <label for="item-name" class="text-xs font-bold text-slate-400 uppercase block mb-1">
                {$t('character.modals.name')}
            </label>
            <input
                id="item-name"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold"
                placeholder={$t('character.modals.name')}
                bind:value={formData.name}
            />
        </div>

        <div>
            <label for="item-description" class="block text-xs font-bold text-slate-400 uppercase mb-1">
                {$t('character.modals.description')}
            </label>
            <textarea
                id="item-description"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
                placeholder={$t('character.modals.description')}
                bind:value={formData.description}
            ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <label class="block">
                <span class="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{$t('character.modals.type')}</span>
                <select class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" bind:value={formData.type}>
                    {#each Object.values(ITEM_TYPES) as t}<option value={t}>{t}</option>{/each}
                </select>
            </label>
            <label class="block">
                <span class="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Availability</span>
                <select class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" bind:value={formData.availability}>
                    {#each Object.values(AVAILABILITY) as a}<option value={a}>{a}</option>{/each}
                </select>
            </label>
        </div>

        <label class="block">
            <span class="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{$t('character.modals.qty')}</span>
            <input type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={$t('character.modals.qty')} bind:value={formData.quantity} />
        </label>


        {#if formData.type === ITEM_TYPES.WEAPON}
            <div class="bg-indigo-900/10 border border-indigo-900/30 rounded-xl p-4 space-y-4">
                 <!-- Damage Controller -->
                  <div class="grid grid-cols-2 gap-4">
                      <div>
                        <span class="text-[10px] text-indigo-300 uppercase font-bold mb-2 block">Damage</span>
                        <DiceCounter
                            value={
                                formData.damage.endsWith('d6')
                                    ? parseInt(formData.damage)
                                    : (formData.damage === '0' ? 0 : formData.damage)
                            }
                            customSteps={['1', '1d3']}
                            onUpdate={(val) => {
                                if (typeof val === 'number') {
                                    formData.damage = val === 0 ? '0' : `${val}d6`;
                                } else {
                                    formData.damage = val;
                                }
                            }}
                        />
                      </div>
                      <label class="block">
                        <span class="text-[10px] text-indigo-300 uppercase font-bold mb-2 block">Bonus Damage (+X)</span>
                         <input
                            type="number"
                            class="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold"
                            placeholder="0"
                            bind:value={formData.damageMod}
                         />
                      </label>
                  </div>

                <div class="grid grid-cols-2 gap-3">
                    <label class="block">
                         <span class="text-[10px] text-indigo-300 uppercase font-bold mb-1 block">{$t('character.modals.hands')}</span>
                        <select class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm" bind:value={formData.hands}>
                            {#each Object.values(WEAPON_HANDS) as h}<option value={h}>{h}</option>{/each}
                        </select>
                    </label>
                     <label class="block">
                        <span class="text-[10px] text-indigo-300 uppercase font-bold mb-1 block">{$t('character.modals.range')}</span>
                        <select class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm" bind:value={formData.range}>
                            <option value="Melee">Melee</option>
                            <option value="Short">Short</option>
                            <option value="Medium">Medium</option>
                            <option value="Long">Long</option>
                        </select>
                    </label>
                </div>

                <!-- Properties -->
                <div>
                     <span class="text-[10px] text-indigo-300 uppercase font-bold mb-2 block">Properties</span>
                     <div class="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                         {#each selectedProps as prop}
                            <div class="bg-slate-950 border border-slate-700 text-slate-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                {prop}
                                <button onclick={() => toggleProp(prop)} class="text-slate-500 hover:text-red-400"><X size={12}/></button>
                            </div>
                         {/each}
                     </div>
                     <button onclick={() => showPropModal = true} class="w-full py-2 bg-slate-900 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2">
                        <Plus size={16} /> Add Property
                     </button>
                </div>
            </div>
        {/if}

        {#if formData.type === ITEM_TYPES.ARMOR}
              <div class="bg-indigo-900/10 border border-indigo-900/30 rounded-xl p-4 space-y-4">
                  <label class="block">
                        <span class="text-[10px] text-indigo-300 uppercase font-bold mb-1 block">Type</span>
                        <select class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm" bind:value={formData.armorType}>
                            {#each Object.values(ARMOR_TYPES) as t}<option value={t}>{t}</option>{/each}
                        </select>
                    </label>

                  <div class="grid grid-cols-2 gap-3">
                      <label class="block">
                          <span class="text-[10px] text-indigo-300 uppercase font-bold mb-1 block">{$t('character.modals.fixed_def')}</span>
                         <input type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold" placeholder="Ex: 13" bind:value={formData.defenseFixed} />
                      </label>
                      <label class="block">
                          <span class="text-[10px] text-indigo-300 uppercase font-bold mb-1 block">{$t('character.modals.mod_def')} (Agility + X)</span>
                         <input type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold" placeholder="Ex: 2" bind:value={formData.defenseMod} />
                      </label>
                  </div>
              </div>
        {/if}

        {#if formData.type === ITEM_TYPES.SHIELD}
             <div class="bg-indigo-900/10 border border-indigo-900/30 rounded-xl p-4">
                 <label class="block">
                     <span class="text-[10px] text-indigo-300 uppercase font-bold mb-1 block">Defense Bonus (+X)</span>
                     <input type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold" placeholder="Ex: 1" bind:value={formData.defenseMod} />
                 </label>
             </div>
        {/if}

        <div class="flex gap-2 pt-2">
            {#if data}<button onclick={() => { sotdlCharacterActions.deleteItem(data.id); onClose(); }} class="bg-red-900/50 hover:bg-red-900 text-red-200 p-3 rounded-lg transition-colors" title={$t('character.modals.delete')}><Trash2 size={20}/></button>{/if}
            <button onclick={saveItem} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all">{$t('common.buttons.save')}</button>
        </div>
    </div>
</Modal>

{#if showPropModal}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="bg-slate-950 rounded-2xl border border-slate-800 w-full max-w-sm overflow-hidden flex flex-col">
            <div class="p-4 border-b border-slate-800">
                <h3 class="text-lg font-bold text-white mb-2">Select Property</h3>
                 <div class="relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="text" placeholder="Search..." bind:value={propSearch} class="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm outline-none" />
                </div>
            </div>
            <div class="max-h-[300px] overflow-y-auto p-2">
                {#each filteredProps as prop}
                    <button onclick={() => toggleProp(prop)} class="w-full text-left p-3 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-sm transition-colors flex justify-between">
                        {prop}
                        {#if selectedProps.includes(prop)}<div class="w-2 h-2 rounded-full bg-indigo-500"></div>{/if}
                    </button>
                {/each}
            </div>
            <div class="p-4 border-t border-slate-800">
                <button onclick={() => showPropModal = false} class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold">Close</button>
            </div>
        </div>
    </div>
{/if}
