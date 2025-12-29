<script lang="ts">
    import { liveCharacters, liveCampaigns } from '$lib/stores/live';
    import { uuidv7 } from 'uuidv7';
    import { charactersMap, campaignsMap } from '$lib/db';
    import { goto } from '$app/navigation';
    import { Skull, Users, Scroll, Plus, Edit, Play, Trash2 } from 'lucide-svelte';
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
    const defaultCampForm = { name: '', description: '', gm: '', isPrivate: false };

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
            gm: formData.gm,
            isPrivate: formData.isPrivate,
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

<div class="animate-in fade-in p-4 md:p-8 max-w-7xl mx-auto">
   <header class="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
      <div>
        <h1 class="text-3xl font-bold text-white flex items-center gap-2 text-gradient">
          <Skull class="text-indigo-500" /> Weird Wizard Vault
        </h1>
        <p class="text-slate-400 mt-1">Gestor de Personagens e Campanhas</p>
      </div>
      <div class="flex bg-slate-900 p-1 rounded-xl border border-slate-800 glass">
        <button 
            onclick={() => activeTab = 'characters'} 
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 {activeTab === 'characters' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
            aria-pressed={activeTab === 'characters'}
        >
            <Users size={16}/> Personagens
        </button>
        <button 
            onclick={() => activeTab = 'campaigns'} 
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 {activeTab === 'campaigns' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
            aria-pressed={activeTab === 'campaigns'}
        >
            <Scroll size={16}/> Campanhas
        </button>
      </div>
   </header>

   {#if activeTab === 'characters'}
     <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button 
            onclick={() => openCharModal()} 
            class="h-full min-h-[160px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all hover:bg-indigo-500/5 gap-2 group"
            aria-label="Criar Novo Personagem"
        >
            <Plus size={32} class="group-hover:scale-110 transition-transform"/>
            <span class="font-bold">Novo Personagem</span>
        </button>
        
        {#each $liveCharacters as char (char.id)}
           <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all relative group flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10">
              <div class="flex justify-between items-start">
                 <!-- svelte-ignore a11y_click_events_have_key_events -->
                 <!-- svelte-ignore a11y_no_static_element_interactions -->
                 <div 
                    onclick={() => goto(`/character/${char.id}`)} 
                    class="cursor-pointer flex-1"
                    role="link"
                    tabindex="0"
                    aria-label="Abrir ficha de {char.name}"
                 >
                    <h3 class="font-bold text-xl text-white mb-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{char.name}</h3>
                    <p class="text-sm text-indigo-400 font-bold uppercase tracking-wider">{char.ancestry || 'Ancestralidade'} • Nível {char.level === 0 ? '0' : (char.level || 0)}</p>
                    <p class="text-xs text-slate-500 font-medium mt-2 max-w-[240px] truncate">{char.paths?.novice || "-"}</p>
                 </div>
                 <div class="flex gap-1">
                     <button 
                        onclick={() => deleteCharacter(char.id)} 
                        class="text-slate-600 hover:text-red-400 p-2 rounded hover:bg-slate-800 transition-colors"
                        aria-label="Excluir personagem {char.name}"
                    >
                        <Trash2 size={16}/>
                    </button>
                 </div>
              </div>
           </div>
        {/each}
     </div>
   {:else if activeTab === 'campaigns'}
     <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         <button 
            onclick={() => openCampModal()} 
            class="h-full min-h-[160px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all hover:bg-indigo-500/5 gap-2 group"
            aria-label="Criar Nova Campanha"
        >
            <Plus size={32} class="group-hover:scale-110 transition-transform"/>
            <span class="font-bold">Nova Campanha</span>
        </button>
         {#each $liveCampaigns as camp (camp.id)}
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group relative flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10">
               <div>
                  <h3 class="font-bold text-2xl text-white mb-2 group-hover:text-indigo-400 transition-colors flex justify-between uppercase tracking-tight">
                      {camp.name}
                      {#if camp.isPrivate}
                          <span class="text-[10px] bg-red-900/40 text-red-400 px-2 py-1 rounded border border-red-900/50 uppercase tracking-wider">Privada</span>
                      {:else}
                          <span class="text-[10px] bg-green-900/40 text-green-400 px-2 py-1 rounded border border-green-900/50 uppercase tracking-wider">Pública</span>
                      {/if}
                  </h3>
                  <p class="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">{camp.description || 'Sem descrição.'}</p>
               </div>
               <div class="flex gap-3 mt-4">
                 <button 
                    onclick={() => goto(`/campaign/${camp.id}`)} 
                    class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-indigo-400/20 shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98]"
                >
                    <Play size={18} fill="currentColor"/> Gerir Campanha
                </button>
                  <button 
                    onclick={() => openCampModal(camp)} 
                    class="p-3 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-all" 
                    title="Editar"
                    aria-label="Editar campanha {camp.name}"
                >
                    <Edit size={18}/>
                </button>
                   <button 
                    onclick={() => deleteCampaign(camp.id)} 
                    class="p-3 text-slate-400 hover:text-red-400 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-red-900/30 transition-all" 
                    title="Excluir"
                    aria-label="Excluir campanha {camp.name}"
                >
                    <Trash2 size={18}/>
                </button>
               </div>
            </div>
         {/each}
     </div>
   {/if}

   <CharacterModal isOpen={isCharModalOpen} initialData={charFormStr} onClose={() => isCharModalOpen = false} onSave={saveCharacter} />
   <CampaignModal isOpen={isCampModalOpen} initialData={campFormStr} onClose={() => isCampModalOpen = false} onSave={saveCampaign} />
   <ConfirmationModal isOpen={isConfirmOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onCancel={() => isConfirmOpen = false} />

</div>
