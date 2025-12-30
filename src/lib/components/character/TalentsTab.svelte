<script lang="ts">
    import { t } from 'svelte-i18n';
    import { character, modalState, characterActions } from '$lib/stores/characterStore';
    import { Plus, Edit, Zap, Infinity as InfinityIcon } from 'lucide-svelte';

    const { recoverTalent } = characterActions;

    function openModal(type: string, data: any = null) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }
</script>

<div class="space-y-6">
    <div class="flex justify-between items-center mb-2">
        <div>
            <h3 class="text-lg font-bold text-white tracking-tight">{$t('character.talents.title')}</h3>
            <p class="text-xs text-slate-500">{$t('character.talents.subtitle')}</p>
        </div>
        <button 
            onclick={() => openModal('talent')} 
            class="text-xs bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
            aria-label={$t('character.talents.add')}
        >
            <Plus size={16} /> {$t('character.talents.new')}
        </button>
    </div>
    
    <div class="grid grid-cols-1 gap-4">
        {#each $character.talents as talent}
            <div class="p-5 bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center gap-6 group hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 rounded-lg bg-slate-800 text-yellow-500 group-hover:scale-110 transition-transform shadow-inner">
                            <Zap size={18} />
                        </div>
                        <h4 class="font-bold text-white text-lg tracking-tight uppercase tracking-tight">{talent.name}</h4>
                        <button 
                            onclick={() => openModal('talent', talent)} 
                            class="text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                            aria-label="Editar {talent.name}"
                        >
                            <Edit size={14}/>
                        </button>
                    </div>
                    <p class="text-sm text-slate-400 leading-relaxed max-w-2xl">{talent.description}</p>
                </div>
                
                <div class="shrink-0 flex items-center gap-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800 shadow-inner">
                   <div class="text-center px-2 border-r border-slate-800 pr-4 min-w-[80px]">
                      {#if talent.isPassive}
                          <span class="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{$t('character.talents.type')}</span>
                          <span class="font-bold text-slate-300 text-xs flex items-center justify-center gap-1.5 bg-slate-800 px-2 py-1 rounded-md">
                              <InfinityIcon size={12} class="text-indigo-400"/> {$t('character.talents.passive')}
                          </span>
                      {:else}
                          <span class="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{$t('character.talents.uses')}</span>
                          <span class="font-mono font-bold text-lg {talent.uses === 0 ? 'text-red-400' : 'text-white'}">
                              {talent.uses}<span class="text-slate-600 text-sm">/{talent.maxUses}</span>
                          </span>
                      {/if}
                   </div>
                   
                   {#if !talent.isPassive}
                       <div class="flex gap-2">
                           <button 
                                onclick={() => recoverTalent(talent.id)} 
                                disabled={talent.uses >= talent.maxUses} 
                                title={$t('character.talents.recover')}
                                class="bg-slate-800 disabled:opacity-20 hover:bg-green-600/20 text-green-400 p-2 rounded-lg transition-all hover:scale-110 active:scale-90 border border-slate-700 hover:border-green-500/50"
                                aria-label="Recuperar uso de {talent.name}"
                           >
                                <Plus size={18} />
                           </button>
                           <button 
                                onclick={() => openModal('confirm_talent', talent)} 
                                disabled={talent.uses === 0} 
                                title={$t('character.talents.use')}
                                class="bg-slate-800 disabled:opacity-20 hover:bg-indigo-600/20 text-white p-2 rounded-lg transition-all hover:scale-110 active:scale-90 border border-slate-700 hover:border-indigo-500/50"
                                aria-label="Usar {talent.name}"
                           >
                                <Zap size={18} />
                           </button>
                       </div>
                   {/if}
                </div>
            </div>
        {/each}
        {#if $character.talents.length === 0}
            <div class="text-center py-12 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-2xl">
                <Zap size={48} class="mx-auto text-slate-800 mb-3" />
                <p class="text-slate-500 font-medium">{$t('character.talents.empty')}</p>
                <button 
                    onclick={() => openModal('talent')} 
                    class="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-1 mx-auto"
                >
                    <Plus size={14}/> {$t('character.talents.add_first')}
                </button>
            </div>
        {/if}
    </div>
</div>
