<script>
    import { liveEnemies, liveEncounters } from '$lib/stores/live';
    import { Ghost, Layers, Plus, Edit, Trash2, GripVertical, Play } from 'lucide-svelte';
    import { enemiesMap, encountersMap, campaignsMap } from '$lib/db';
    import { uuidv7 } from 'uuidv7';
    import EnemyModal from './EnemyModal.svelte';
    import EncounterModal from './EncounterModal.svelte';
    import { page } from '$app/stores'; // To get campaign ID for running encounter

    let isEnemyModalOpen = false;
    let editingEnemyId = null;
    let enemyFormStr = "{}";

    let isEncounterModalOpen = false;
    let editingEncounterId = null;
    let encounterFormStr = "{}";

    // ... enemy functions ...
    function openEnemyModal(enemy = null) {
        editingEnemyId = enemy ? enemy.id : null;
        enemyFormStr = JSON.stringify(enemy || {});
        isEnemyModalOpen = true;
    }

    function saveEnemy(data) {
        const id = editingEnemyId || uuidv7();
        enemiesMap.set(id, { ...data, id });
        isEnemyModalOpen = false;
    }
    
    function deleteEnemy(id) {
        if(confirm('Apagar inimigo?')) enemiesMap.delete(id);
    }

    // Encounter functions
    function openEncounterModal(enc = null) {
        editingEncounterId = enc ? enc.id : null;
        encounterFormStr = JSON.stringify(enc || { name: '', enemies: [] });
        isEncounterModalOpen = true;
    }

    function saveEncounter(data) {
        const id = editingEncounterId || uuidv7();
        encountersMap.set(id, { ...data, id });
        isEncounterModalOpen = false;
    }

    function deleteEncounter(id) {
        if(confirm('Apagar encontro?')) encountersMap.delete(id);
    }

    function runEncounter(enc) {
        // Add enemies to the current campaign's combat
        // We need updates to campaign instance.
        // We can do it by updating campaignsMap manually here
        const campId = $page.params.id;
        if (!campId || !campaignsMap.has(campId)) return;
        
        const latestCamp = campaignsMap.get(campId);
        const activeEnemies = latestCamp.activeEnemies || [];
        
        let newEnemies = [];
        enc.enemies.forEach(item => {
             const template = $liveEnemies.find(e => e.id === item.enemyId);
             if (template) {
                for(let i=0; i<item.count; i++) {
                    newEnemies.push({
                        ...template,
                        instanceId: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        damage: 0, 
                        currentHealth: template.health,
                        afflictions: [],
                        acted: false,
                        initiative: false
                    });
                }
             }
        });
        
        campaignsMap.set(campId, { ...latestCamp, activeEnemies: [...activeEnemies, ...newEnemies] });
        alert('Inimigos adicionados ao Combate!'); // Simple feedback
    }

    // Drag and Drop Logic
    function handleDragStart(e, enemy) {
        e.dataTransfer.setData('text/plain', enemy.id);
        e.dataTransfer.effectAllowed = 'copy';
    }

    function handleDragOver(e) {
        e.preventDefault();
        return false;
    }

    function handleDrop(e, enc) {
        e.preventDefault();
        const enemyId = e.dataTransfer.getData('text/plain');
        if (!enemyId) return;
        
        const currentEnemies = enc.enemies || [];
        const existing = currentEnemies.find(x => x.enemyId === enemyId);
        
        let newEnemies;
        if (existing) {
            newEnemies = currentEnemies.map(x => x.enemyId === enemyId ? { ...x, count: x.count + 1 } : x);
        } else {
            newEnemies = [...currentEnemies, { enemyId, count: 1 }];
        }
        
        encountersMap.set(enc.id, { ...enc, enemies: newEnemies });
    }
</script>

<div>
    <div class="mb-8 border-b border-slate-800 pb-8">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-bold text-slate-500 uppercase flex items-center gap-2"><Layers size={14}/> Encontros Prontos</h3>
            <button on:click={() => openEncounterModal()} class="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors"><Plus size={14}/> Novo Encontro</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {#each $liveEncounters as enc (enc.id)}
                 <!-- svelte-ignore a11y-no-static-element-interactions -->
                 <div 
                    class="bg-slate-900 border border-slate-800 rounded-xl p-4 transition-all hover:border-indigo-500/30"
                    on:dragover={handleDragOver}
                    on:drop={(e) => handleDrop(e, enc)}
                 >
                     <div class="flex justify-between items-center mb-2">
                        <div>
                            <div class="font-bold text-white text-lg mb-1">{enc.name}</div>
                            <div class="space-y-1">
                                {#each enc.enemies || [] as item}
                                    {@const enemy = $liveEnemies.find(e => e.id === item.enemyId)}
                                    <div class="text-xs text-slate-400 flex items-center gap-2">
                                        <span class="bg-slate-800 px-1.5 rounded text-white font-mono">{item.count}x</span>
                                        <span>{enemy ? enemy.name : 'Desconhecido'}</span>
                                    </div>
                                {/each}
                                {#if !enc.enemies?.length}<div class="text-xs text-slate-600 italic">Vazio</div>{/if}
                            </div>
                        </div>
                        <div class="flex gap-2">
                             <button on:click={() => runEncounter(enc)} class="bg-indigo-900/50 hover:bg-indigo-600 text-indigo-200 hover:text-white p-2 rounded transition-colors" title="Rodar Encontro"><Play size={16}/></button>
                             <button on:click={() => openEncounterModal(enc)} class="text-slate-600 hover:text-white p-2" title="Editar"><Edit size={16}/></button>
                             <button on:click={() => deleteEncounter(enc.id)} class="text-slate-600 hover:text-red-400 p-2"><Trash2 size={16}/></button>
                        </div>
                    </div>
                 </div>
             {/each}
             {#if $liveEncounters.length === 0}
                 <div class="text-slate-500 text-sm italic col-span-3">Nenhum encontro salvo.</div>
             {/if}
        </div>
    </div>
    
    <div class="flex justify-between items-center mb-6">
        <h3 class="text-sm font-bold text-slate-500 uppercase flex items-center gap-2"><Ghost size={14}/> Lista de Inimigos</h3>
        <!-- <h2 class="text-xl font-bold text-white flex items-center gap-2"><Ghost size={20} class="text-indigo-500"/> Bestiário</h2> replaced by subheader -->
        <div class="flex gap-2">
            <button on:click={() => openEnemyModal()} class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Novo Inimigo</button>
        </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each $liveEnemies as enemy (enemy.id)}
             <!-- svelte-ignore a11y-no-static-element-interactions -->
             <div 
                class="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/30 transition-all relative group cursor-move hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95"
                draggable="true"
                on:dragstart={(e) => handleDragStart(e, enemy)}
             >
                  <div class="flex justify-between items-start mb-2">
                      <h3 class="font-bold text-lg text-white flex items-center gap-2">{enemy.name}</h3>
                      <span class="text-xs font-bold bg-slate-800 px-2 py-1 rounded text-slate-400">Dif {enemy.difficulty}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 mb-4 text-center">
                      <div class="bg-slate-950 p-1 rounded border border-slate-800"><div class="text-[10px] text-slate-500 uppercase font-bold">Defesa</div><div class="font-mono text-white">{enemy.defense}</div></div>
                      <div class="bg-slate-950 p-1 rounded border border-slate-800"><div class="text-[10px] text-slate-500 uppercase font-bold">Vida</div><div class="font-mono text-white">{enemy.health}</div></div>
                  </div>
                  <div class="mt-4 flex gap-2">
                      <button on:click={() => openEnemyModal(enemy)} class="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-1.5 rounded text-xs font-bold">Editar</button>
                      <button on:click={() => deleteEnemy(enemy.id)} class="bg-slate-800 hover:bg-red-900/50 text-red-400 hover:text-red-200 px-3 rounded"><Trash2 size={14}/></button>
                  </div>
             </div>
        {/each}
        {#if $liveEnemies.length === 0}
            <div class="text-center text-slate-500 italic col-span-3">Nenhum inimigo cadastrado.</div>
        {/if}
    </div>

    <EnemyModal isOpen={isEnemyModalOpen} initialData={enemyFormStr} onClose={() => isEnemyModalOpen = false} onSave={saveEnemy} />
    <EncounterModal isOpen={isEncounterModalOpen} initialData={encounterFormStr} onClose={() => isEncounterModalOpen = false} onSave={saveEncounter} />

</div>
