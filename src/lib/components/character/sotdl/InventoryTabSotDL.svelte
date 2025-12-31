<script lang="ts">
    import { t } from 'svelte-i18n';
    import { sotdlCharacter, sotdlCharacterActions } from '$lib/stores/characterStoreSotDL';
    import { modalState } from '$lib/stores/characterStore';
    import { Plus, Edit } from 'lucide-svelte';
    import CurrencySectionSotDL from './CurrencySectionSotDL.svelte';

    const { useConsumable, updateItem } = sotdlCharacterActions;

    // Constants for SotDL Types matching what we used in ItemEditorSotDL
    const ITEM_TYPES = {
        WEAPON: 'Weapon',
        ARMOR: 'Armor',
        SHIELD: 'Shield',
        CONSUMABLE: 'Consumable',
        OTHER: 'Other'
    };

    function openModal(type: string, data: any = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data, system: 'sofdl' }));
    }

    function equipItem(item: any, state: string | null) {
        if (!state) {
             // Unequip
             updateItem({ ...item, equippedState: '' });
        } else {
            // Check conflicts? For now just set state.
            // In a real app we might want to unequip other main hand items if equipping main hand.
            // But for simple "exact copy" of visual behavior:
            updateItem({ ...item, equippedState: state });
        }
    }

    // Toggle for simple armor
    function toggleEquipArmor(item: any) {
        equipItem(item, item.equippedState ? '' : 'equipped');
    }

</script>

<div class="space-y-4">
    <!-- Currency inline for mobile only (shown in sidebar on desktop) -->
    <div class="lg:hidden">
        <CurrencySectionSotDL />
    </div>

    <div class="flex justify-between items-center">
        <h3 class="text-xs font-bold text-slate-500 uppercase">{$t('character.inventory.title')}</h3>
        <button
            onclick={() => openModal('item_sotdl')}
            class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold flex items-center gap-1"
        >
            <Plus size={14} /> {$t('character.inventory.new_item')}
        </button>
    </div>
    <div class="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
       <table class="w-full text-sm text-left">
          <thead class="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                  <th class="p-3">{$t('character.inventory.item')}</th>
                  <th class="p-3">{$t('character.inventory.type')}</th>
                  <th class="p-3 text-center">{$t('character.inventory.actions_equip')}</th>
                  <th class="p-3 text-right">{$t('character.inventory.qty')}</th>
                  <th class="p-3 w-8"></th>
              </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-slate-300">
             {#each $sotdlCharacter.equipment as item}
                <tr class="hover:bg-slate-900/50">
                   <td class="p-3">
                       <div class="font-bold text-white">{item.name}</div>
                       <div class="text-[10px] text-slate-500">
                           {item.availability || 'Common'}
                           {#if item.properties} • {item.properties}{/if}
                           {#if item.type === ITEM_TYPES.ARMOR}
                               • Def {#if item.defenseFixed}Fixed {item.defenseFixed}{:else}+{item.defenseMod}{/if}
                           {/if}
                           {#if item.type === ITEM_TYPES.WEAPON}
                               • {item.damage || '0 dmg'}
                               {#if item.damageMod} <span class="text-green-400">+{item.damageMod}</span>{/if}
                           {/if}
                       </div>
                   </td>
                   <td class="p-3"><span class="text-[10px] border border-slate-700 px-1 rounded uppercase bg-slate-900">{item.type}</span></td>
                   <td class="p-3 text-center">
                      {#if item.type === ITEM_TYPES.CONSUMABLE || item.type === 'Explosive'} <!-- Handling Explosive as consumable-like if needed -->
                          <button
                              onclick={() => useConsumable(item)}
                              disabled={item.quantity <= 0}
                              class="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600"
                              aria-label="{$t('character.inventory.use')} {item.name}"
                          >
                              {$t('character.inventory.use')}
                          </button>
                      {:else if item.type === ITEM_TYPES.ARMOR}
                          <button
                              onclick={() => toggleEquipArmor(item)}
                              class="text-xs px-2 py-1 rounded border transition-colors {item.equippedState === 'equipped' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}"
                              aria-label={item.equippedState === 'equipped' ? 'Desequipar armadura' : 'Equipar armadura'}
                          >
                              {item.equippedState === 'equipped' ? $t('character.inventory.equipped') : $t('character.inventory.equip')}
                          </button>
                      {:else if item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.SHIELD}
                          <div class="flex justify-center gap-1">
                              {#if item.hands === 'Two-handed'}
                                  <button
                                      onclick={() => equipItem(item, item.equippedState === 'two' ? '' : 'two')}
                                      class="text-[10px] px-2 py-1 rounded border {item.equippedState === 'two' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}"
                                      aria-label={item.equippedState === 'two' ? 'Desequipar 2H' : 'Equipar 2H'}
                                  >
                                      2H
                                  </button>
                              {:else}
                                  <!-- For One-handed, Light, or unspecified -->
                                  {#if item.hands !== 'Off-hand'}
                                      <button
                                          onclick={() => equipItem(item, item.equippedState === 'main' ? '' : 'main')}
                                          class="text-[10px] px-2 py-1 rounded border {item.equippedState === 'main' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}"
                                          aria-label={item.equippedState === 'main' ? 'Desequipar Main Hand' : 'Equipar Main Hand'}
                                      >
                                          Main
                                      </button>
                                  {/if}
                                  <button
                                      onclick={() => equipItem(item, item.equippedState === 'off' ? '' : 'off')}
                                      class="text-[10px] px-2 py-1 rounded border {item.equippedState === 'off' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}"
                                      aria-label={item.equippedState === 'off' ? 'Desequipar Off Hand' : 'Equipar Off Hand'}
                                  >
                                      Off
                                  </button>
                              {/if}
                          </div>
                      {/if}
                   </td>
                   <td class="p-3 text-right font-mono">{item.quantity}</td>
                   <td class="p-3 text-right">
                       <button
                           onclick={() => openModal('item_sotdl', item)}
                           class="text-slate-500 hover:text-white"
                           aria-label="Editar {item.name}"
                       >
                           <Edit size={14}/>
                       </button>
                   </td>
                </tr>
             {/each}
          </tbody>
       </table>
    </div>
 </div>
