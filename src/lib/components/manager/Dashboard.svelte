<script lang="ts">
    import { liveCharacters, liveCampaigns } from '$lib/stores/live';
    import { uuidv7 } from 'uuidv7';
    import { charactersMap, campaignsMap } from '$lib/db';
    import { goto } from '$app/navigation';
    import { Skull, Users, Scroll, Plus, Edit, Play, Trash2, Globe, Wifi, Shield } from 'lucide-svelte';
    import { publicCampaigns } from '$lib/logic/sync';
    import ConfirmationModal from './ConfirmationModal.svelte';
    import CampaignModal from './CampaignModal.svelte';
    import CharacterModal from './CharacterModal.svelte';

    let activeTab = $state('characters');
    
    // Character Modal
    let isCharModalOpen = $state(false);
    let editingCharId = $state<string | null>(null);
    let charFormStr = $state("{}");
    
    const defaultCharForm = { name: '', ancestry: 'Humano', novicePath: '', level: 0, defense: 8, health: 5 };

    function openCharModal(char: any = null) {
        editingCharId = char ? char.id : null;
        charFormStr = JSON.stringify(char || defaultCharForm);
        isCharModalOpen = true;
    }

    function saveCharacter(formData: any) {
        const id = editingCharId || uuidv7();
        const base = editingCharId ? (charactersMap.get(id) as any) : {};
        
        const newChar: any = {
             ...base,
            id,
            name: formData.name,
            ancestry: formData.ancestry,
            level: formData.level,
            defense: formData.defense,
            paths: { 
                novice: formData.novicePath || (base.paths?.novice || '-'),
                expert: base.paths?.expert || '-',
                master: base.paths?.master || '-'
            },
            attributes: base.attributes || [
                { name: "Força", value: 10, key: "str" },
                { name: "Agilidade", value: 10, key: "agi" },
                { name: "Intelecto", value: 10, key: "int" },
                { name: "Vontade", value: 10, key: "wil" }
            ],
            speed: base.speed || 5,
            health: formData.health,
            currentHealth: editingCharId ? (base.currentHealth || formData.health) : formData.health
        };

        if (!editingCharId) {
             newChar.spells = [];
             newChar.talents = [];
             newChar.equipment = [];
             newChar.afflictions = [];
             newChar.effects = [];
             newChar.currency = { gp: 0, sp: 0, cp: 0 };
             newChar.languages = ['Comum'];
        }

        charactersMap.set(id, newChar);
        isCharModalOpen = false;
        
        if (!editingCharId) {
             goto(`/character/${id}`);
        }
    }

    // Campaign Modal
    let isCampModalOpen = $state(false);
    let editingCampId = $state<string | null>(null);
    let campFormStr = $state("{}");
    const defaultCampForm = { name: '', description: '', gmName: '' };

    function openCampModal(camp: any = null) {
        editingCampId = camp ? camp.id : null;
        campFormStr = JSON.stringify(camp || defaultCampForm);
        isCampModalOpen = true;
    }
    
    function saveCampaign(formData: any) {
        const id = editingCampId || uuidv7();
        const current = editingCampId ? (campaignsMap.get(id) as any) : {};
        
        const newCamp = {
            ...current,
            id,
            name: formData.name,
            description: formData.description,
            gmName: formData.gmName,
            players: current.players || []
        };
        campaignsMap.set(id, newCamp);
        isCampModalOpen = false;
    }
    
    // Confirm Dialog State
    let isConfirmOpen = $state(false);
    let confirmConfig = $state({ title: '', message: '', onConfirm: () => {} });

    function deleteCampaign(id: string) {
        confirmConfig = {
            title: 'Excluir Campanha',
            message: 'Tem certeza que deseja apagar esta campanha permanentemente?',
            onConfirm: () => {
                campaignsMap.delete(id);
                isConfirmOpen = false;
            }
        };
        isConfirmOpen = true;
    }
    
    function deleteCharacter(id: string) {
        confirmConfig = {
            title: 'Excluir Personagem',
            message: 'Tem certeza que deseja apagar este personagem permanentemente?',
            onConfirm: () => {
                charactersMap.delete(id);
                isConfirmOpen = false;
            }
        };
        isConfirmOpen = true;
    }
</script>

<div class="animate-in fade-in p-4 md:p-8 max-w-7xl mx-auto pb-20">
   <header class="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
      <div>
        <h1 class="text-3xl font-bold text-white flex items-center gap-2 text-gradient">
          <Skull class="text-indigo-500" /> Weird Wizard Vault
        </h1>
        <p class="text-slate-400 mt-1">Gestor de Personagens e Campanhas</p>
      </div>
      <div class="flex bg-slate-900 p-1 rounded-xl border border-slate-800 glass shadow-xl">
        <button 
            onclick={() => activeTab = 'characters'} 
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 {activeTab === 'characters' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
        >
            <Users size={16}/> Personagens
        </button>
        <button 
            onclick={() => activeTab = 'campaigns'} 
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 {activeTab === 'campaigns' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
        >
            <Scroll size={16}/> Campanhas
        </button>
        <button 
            onclick={() => activeTab = 'discovery'} 
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 {activeTab === 'discovery' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
        >
            <Globe size={16}/> Públicas
        </button>
      </div>
   </header>

   <div class="min-h-[500px]">
       {#if activeTab === 'characters'}
         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
                onclick={() => openCharModal()} 
                class="h-full min-h-[160px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all hover:bg-indigo-500/5 gap-2 group shadow-sm bg-slate-900/20"
            >
                <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:scale-110 transition-all">
                    <Plus size={32} />
                </div>
                <span class="font-bold">Novo Personagem</span>
            </button>
            
            {#each $liveCharacters as char (char.id)}
               <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/40 transition-all relative group flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10 border-t-white/5">
                  <div class="flex justify-between items-start mb-4">
                     <div class="flex-1">
                        <h3 class="font-black text-xl text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate pr-8">{char.name}</h3>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] bg-indigo-500/10 text-indigo-400 font-black px-2 py-0.5 rounded uppercase tracking-wider">{char.ancestry || 'Humano'}</span>
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nível {char.level}</span>
                        </div>
                     </div>
                     <button 
                        onclick={() => deleteCharacter(char.id)} 
                        class="text-slate-700 hover:text-red-400 p-2 rounded-xl hover:bg-red-400/5 transition-all opacity-40 group-hover:opacity-100"
                    >
                        <Trash2 size={16}/>
                    </button>
                  </div>

                  <div class="space-y-3 mb-6">
                      <div class="flex items-center justify-between text-xs text-slate-400">
                          <span class="flex items-center gap-1.5 opacity-60"><Scroll size={12}/> Trilhas</span>
                          <span class="font-bold text-slate-300 truncate max-w-[150px]">{char.paths?.novice || "-"}</span>
                      </div>
                  </div>

                  <button 
                    onclick={() => goto(`/character/${char.id}`)}
                    class="w-full bg-slate-800 hover:bg-indigo-600 text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] border border-slate-700 hover:border-indigo-400/30 flex items-center justify-center gap-2"
                  >
                    Abrir Ficha <Play size={14} fill="currentColor" />
                  </button>
               </div>
            {/each}
         </div>

       {:else if activeTab === 'campaigns'}
         <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <button 
                onclick={() => openCampModal()} 
                class="h-full min-h-[160px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all hover:bg-indigo-500/5 gap-2 group shadow-sm bg-slate-900/20"
            >
                <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:scale-110 transition-all">
                    <Plus size={32} />
                </div>
                <span class="font-bold">Nova Campanha</span>
            </button>
             
             {#each $liveCampaigns as camp (camp.id)}
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/40 transition-all group relative flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10 border-t-white/5">
                   <div class="mb-4">
                      <div class="flex justify-between items-start mb-1">
                          <h3 class="font-black text-2xl text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{camp.name}</h3>
                          {#if camp.isPublished}
                              <span class="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest flex items-center gap-1">
                                  <Globe size={10}/> Publicada
                              </span>
                          {/if}
                      </div>
                       <p class="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{camp.gmName || 'Mestre'}</p>
                       <p class="text-sm text-slate-400 line-clamp-2 leading-relaxed h-10">{camp.description || 'Uma jornada sem descrição ainda.'}</p>
                   </div>
                   
                   <div class="flex gap-3 mt-4">
                     <button 
                        onclick={() => goto(`/campaign/${camp.id}`)} 
                        class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border border-indigo-400/20 shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98]"
                    >
                        <Play size={18} fill="currentColor"/> Gerir Sessão
                    </button>
                    <div class="flex gap-2">
                        <button 
                            onclick={() => openCampModal(camp)} 
                            class="p-3 text-slate-400 hover:text-white bg-slate-800/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all" 
                            title="Editar"
                        >
                            <Edit size={20}/>
                        </button>
                        <button 
                            onclick={() => deleteCampaign(camp.id)} 
                            class="p-3 text-slate-400 hover:text-red-400 bg-slate-800/50 rounded-2xl border border-slate-800 hover:border-red-900/30 transition-all" 
                            title="Excluir"
                        >
                            <Trash2 size={20}/>
                        </button>
                    </div>
                   </div>
                </div>
             {/each}
         </div>

       {:else if activeTab === 'discovery'}
         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {#each $publicCampaigns as camp (camp.id)}
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 transition-all group relative flex flex-col justify-between shadow-xl border-t-white/5">
                   <div>
                      <h3 class="font-black text-2xl text-white group-hover:text-emerald-400 mb-2 uppercase tracking-tight">{camp.name}</h3>
                      <div class="flex items-center gap-2 mb-4">
                           <div class="px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 font-black uppercase tracking-widest">{camp.gmName || 'Mestre'}</div>
                           <div class="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded text-[9px] text-emerald-400 font-black uppercase tracking-wider">
                                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                Online
                           </div>
                      </div>
                      <p class="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-6 h-15">{camp.description || 'Uma jornada por terras desconhecidas aguarada heróis.'}</p>
                   </div>
                   <button 
                        onclick={() => goto(`/campaign/${camp.id}/invite`)} 
                        class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-black uppercase text-xs tracking-[0.1em] flex items-center justify-center gap-2 border border-emerald-400/20 transition-all active:scale-[0.98] group"
                    >
                        Participar da Aventura <Plus size={18} class="group-hover:rotate-90 transition-transform"/>
                    </button>
                </div>
             {/each}
             
             {#if $publicCampaigns.length === 0}
                <div class="col-span-full py-24 flex flex-col items-center text-center opacity-40">
                     <div class="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600 mb-4 border border-slate-700 border-dashed">
                          <Globe size={40} />
                     </div>
                     <h3 class="text-2xl font-black uppercase tracking-widest text-slate-500">Nenhuma Campanha Online</h3>
                     <p class="text-slate-600 max-w-sm mt-3 font-medium">Os Mestres precisam publicar suas sessões e estarem ativos para que apareçam aqui.</p>
                </div>
             {/if}
         </div>
       {/if}
   </div>

   <CharacterModal isOpen={isCharModalOpen} initialData={charFormStr} onClose={() => isCharModalOpen = false} onSave={saveCharacter} />
   <CampaignModal isOpen={isCampModalOpen} initialData={campFormStr} onClose={() => isCampModalOpen = false} onSave={saveCampaign} />
   <ConfirmationModal isOpen={isConfirmOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onCancel={() => isConfirmOpen = false} />

</div>
