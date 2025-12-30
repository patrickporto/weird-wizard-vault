<script lang="ts">
    import { t } from 'svelte-i18n';
    import { character, modalState, characterActions } from '$lib/stores/characterStore';
    import { Plus, Edit } from 'lucide-svelte';
    import { ITEM_TYPES, GRIPS } from '../../../routes/sofww';
    import CurrencySection from './CurrencySection.svelte';

    const { useConsumable, equipItem } = characterActions;

    function openModal(type: string, data: any = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }
</script>

<div class="space-y-4">
    <!-- Currency inline for mobile only (shown in sidebar on desktop) -->
    <div class="lg:hidden">
        <CurrencySection />
    </div>
    
    <div class="flex justify-between items-center">
        <h3 class="text-xs font-bold text-slate-500 uppercase">{$t('character.inventory.title')}</h3>
        <button 
            onclick={() => openModal('item')} 
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
             {#each $character.equipment as item}
                <tr class="hover:bg-slate-900/50">
                   <td class="p-3">
                       <div class="font-bold text-white">{item.name}</div>
                       <div class="text-[10px] text-slate-500">
                           {item.quality} • {item.availability} • {item.price}gp 
                           {#if item.notes}<span class="block italic text-slate-400">{item.notes}</span>{/if}
                           {#if item.type === ITEM_TYPES.ARMOR}
                               • Def {#if item.defenseFixed}Fixed {item.defenseFixed}{:else}+{item.defenseMod}{/if}
                           {/if}
                       </div>
                   </td>
                   <td class="p-3"><span class="text-[10px] border border-slate-700 px-1 rounded uppercase bg-slate-900">{item.type}</span></td>
                   <td class="p-3 text-center">
                      {#if item.type === ITEM_TYPES.CONSUMABLE}
                          <button 
                              onclick={() => useConsumable(item)} 
                              disabled={item.quantity <= 0} 
                              class="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600"
                              aria-label="Usar {item.name}"
                          >
                              {$t('character.inventory.use')}
                          </button>
                      {:else if item.type === ITEM_TYPES.ARMOR}
                          <button 
                              onclick={() => equipItem(item)} 
                              class="text-xs px-2 py-1 rounded border transition-colors {item.equipped ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}"
                              aria-label={item.equipped ? 'Desequipar armadura' : 'Equipar armadura'}
                          >
                              {item.equipped ? $t('character.inventory.equipped') : $t('character.inventory.equip')}
                          </button>
                      {:else if item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.SHIELD}
                          <div class="flex justify-center gap-1">
                              {#if item.grip === GRIPS.TWO}
                                  <button 
                                      onclick={() => equipItem(item, item.equippedState ? null : 'two')} 
                                      class="text-[10px] px-2 py-1 rounded border {item.equippedState === 'two' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}"
                                      aria-label={item.equippedState === 'two' ? 'Desequipar 2H' : 'Equipar 2H'}
                                  >
                                      2H
                                  </button>
                              {:else}
                                  {#if item.grip !== GRIPS.OFF}
                                      <button 
                                          onclick={() => equipItem(item, item.equippedState === 'main' ? null : 'main')} 
                                          class="text-[10px] px-2 py-1 rounded border {item.equippedState === 'main' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}"
                                          aria-label={item.equippedState === 'main' ? 'Desequipar Main Hand' : 'Equipar Main Hand'}
                                      >
                                          Main
                                      </button>
                                  {/if}
                                  <button 
                                      onclick={() => equipItem(item, item.equippedState === 'off' ? null : 'off')} 
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
                           onclick={() => openModal('item', item)} 
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
