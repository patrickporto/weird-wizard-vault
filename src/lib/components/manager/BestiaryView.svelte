<script lang="ts">
    import { t } from 'svelte-i18n';
    import { liveEnemies, liveEncounters } from '$lib/stores/live';
    import { Ghost, Layers, Plus, Edit, Trash2, GripVertical, Play, Globe } from 'lucide-svelte';
    import { enemiesMap, encountersMap, campaignsMap } from '$lib/db';
    import { uuidv7 } from 'uuidv7';
    import EnemyModalSotDL from './EnemyModalSotDL.svelte';
    import EnemyModal from './EnemyModal.svelte';
    import EncounterModal from './EncounterModal.svelte';
    import ConfirmationModal from './ConfirmationModal.svelte';
    import { page } from '$app/stores'; // To get campaign ID for running encounter

    let isEnemyModalOpen = $state(false);
    let editingEnemyId = $state<string | null>(null);
    let enemyFormStr = $state("{}");

    let isEncounterModalOpen = $state(false);
    let editingEncounterId = $state<string | null>(null);
    let encounterFormStr = $state("{}");

    let confirmState = $state({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    interface Props {
        campId: string;
    }

    let { campId }: Props = $props();

    function createDefaultEnemy() {
        return {
            name: '', difficulty: 1, defense: 10, health: 10, damage: 0, size: 1, speed: 10,
            description: '', senses: '', languages: '', immune: '',
            stats: { str: 10, agi: 10, int: 10, wil: 10 },
            traits: [], actions: [], reactions: [], endOfRound: []
        };
    }

    function openEnemyModal(enemy: any = null) {
        editingEnemyId = enemy ? enemy.id : null;
        if (enemy) {
            enemyFormStr = JSON.stringify(enemy);
        } else {
            // If it's a new enemy (enemy is null)
            if (currentSystem === 'sofdl') {
                // For SotDL, pass empty object so the component uses its own internal default
                enemyFormStr = "{}";
            } else {
                // For WW, preserve existing behavior
                enemyFormStr = JSON.stringify(createDefaultEnemy());
            }
        }
        isEnemyModalOpen = true;
    }

    let expandedEnemyIds = $state(new Set<string>());
    function toggleExpandEnemy(id: string) {
        if (expandedEnemyIds.has(id)) {
            expandedEnemyIds.delete(id);
        } else {
            expandedEnemyIds.add(id);
        }
    }

    function saveEnemy(data: any) {
        const id = editingEnemyId || uuidv7();
        const campaign = campaignsMap.get(campId);
        enemiesMap.set(id, {
            ...data,
            id,
            campaignId: campId,
            system: campaign?.system || 'sofww'
        });
        isEnemyModalOpen = false;
    }

    function deleteEnemy(id: string) {
        const enemy = $liveEnemies.find(e => e.id === id);
        confirmState = {
            isOpen: true,
            title: 'Excluir Inimigo',
            message: `Tem certeza que deseja excluir permanentemente o inimigo "${enemy?.name || 'este inimigo'}"?`,
            onConfirm: () => {
                enemiesMap.delete(id);
                confirmState.isOpen = false;
            }
        };
    }

    // Encounter functions
    function openEncounterModal(enc: any = null) {
        editingEncounterId = enc ? enc.id : null;
        encounterFormStr = JSON.stringify(enc || { name: '', enemies: [] });
        isEncounterModalOpen = true;
    }

    function saveEncounter(data: any) {
        const id = editingEncounterId || uuidv7();
        encountersMap.set(id, { ...data, id, system: currentSystem });
        isEncounterModalOpen = false;
    }

    function deleteEncounter(id: string) {
        const enc = $liveEncounters.find(e => e.id === id);
        confirmState = {
            isOpen: true,
            title: 'Excluir Encontro',
            message: `Tem certeza que deseja excluir permanentemente o encontro "${enc?.name || 'este encontro'}"?`,
            onConfirm: () => {
                encountersMap.delete(id);
                confirmState.isOpen = false;
            }
        };
    }

    function runEncounter(enc: any) {
        const latestCamp = campaignsMap.get(campId);
        if (!latestCamp) return;

        const activeEnemies = latestCamp.activeEnemies || [];

        let newEnemies: any[] = [];
        enc.enemies.forEach((item: any) => {
             const template = $liveEnemies.find(e => e.id === item.enemyId);
             if (template) {
                for(let i=0; i<item.count; i++) {
                    newEnemies.push({
                        ...template,
                        instanceId: uuidv7(),
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

    let currentSystem = $derived(campaignsMap.get(campId)?.system || 'sofww');
    let filteredEnemies = $derived($liveEnemies.filter(e => {
        const enemySystem = e.system || 'sofww'; // Default legacy to sofww
        return enemySystem === currentSystem;
    }));

    let filteredEncounters = $derived($liveEncounters.filter(e => {
        // Encounters usually don't have system explicitly, but we can infer from their enemies or just show all for now?
        // Ideally encounters should also have system. For now let's assume if it contains enemies of that system it's relevant,
        // or just rely on manual management.
        // Let's add system to encounters when saving.
        const encSystem = e.system || 'sofww';
        return encSystem === currentSystem;
    }));
</script>

<div>
    <div class="mb-12">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={16}/> {$t('session.bestiary.encounters_title')}
            </h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <!-- Placeholder Card: Novo Encontro -->
             <button
                onclick={() => openEncounterModal()}
                class="min-h-[120px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-all hover:bg-indigo-500/5 gap-2 group"
             >
                <Plus size={28} class="group-hover:scale-110 transition-transform"/>
                <span class="font-bold text-sm">{$t('session.bestiary.new_encounter')}</span>
             </button>

             {#each filteredEncounters as enc (enc.id)}
                 <!-- svelte-ignore a11y_no_static_element_interactions -->
                 <div
                    class="bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all hover:border-indigo-500/30 group relative flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10"
                    ondragover={handleDragOver}
                    ondrop={(e) => handleDrop(e, enc)}
                    role="region"
                    aria-label="Encontro {enc.name}"
                 >
                     <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                             <div class="font-bold text-white text-base group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate">{enc.name}</div>
                             {#if enc.global}
                                <Globe size={12} class="text-indigo-400" />
                             {/if}
                        </div>
                        <div class="flex flex-wrap gap-1">
                            {#each enc.enemies || [] as item}
                                {@const enemy = $liveEnemies.find(e => e.id === item.enemyId)}
                                <div class="text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-950 p-1 px-1.5 rounded-lg border border-slate-800/50">
                                    <span class="text-indigo-400 font-black">{item.count}x</span>
                                    <span class="font-medium truncate max-w-[80px]">{enemy ? enemy.name : '...'}</span>
                                </div>
                            {/each}
                            {#if !enc.enemies?.length}<div class="text-[10px] text-slate-600 italic">{$t('session.bestiary.empty_encounter')}</div>{/if}
                        </div>
                    </div>
                    <div class="flex gap-2 mt-3 pt-3 border-t border-slate-800/50">
                        <button onclick={() => runEncounter(enc)} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-900/20"><Play size={12} fill="currentColor"/> {$t('session.bestiary.start')}</button>
                        <button onclick={() => openEncounterModal(enc)} class="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg border border-slate-800 transition-all" title="Editar"><Edit size={14}/></button>
                        <button onclick={() => deleteEncounter(enc.id)} class="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800/50 rounded-lg border border-slate-800 hover:border-red-900/30 transition-all"><Trash2 size={14}/></button>
                    </div>
                 </div>
             {/each}
        </div>
    </div>

    <div class="mb-6">
        <h3 class="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Ghost size={16}/> {$t('session.bestiary.title')}
        </h3>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Placeholder Card: Novo Inimigo -->
        <button
            onclick={() => openEnemyModal()}
            class="min-h-[180px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-all hover:bg-indigo-500/5 gap-2 group"
        >
            <Plus size={32} class="group-hover:scale-110 transition-transform"/>
            <span class="font-bold text-sm">{$t('session.bestiary.new_enemy')}</span>
        </button>

        {#each filteredEnemies as enemy (enemy.id)}
             <!-- svelte-ignore a11y_no_static_element_interactions -->
             <div
                class="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-all relative group cursor-move hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] flex flex-col"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, enemy)}
                role="listitem"
             >
                   <div class="flex justify-between items-start mb-3">
                       <div class="flex items-center gap-2">
                            <h3 class="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{enemy.name}</h3>
                            {#if enemy.global}
                                <Globe size={14} class="text-indigo-400" />
                            {/if}
                       </div>
                      <span class="text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 px-2 py-1 rounded-lg uppercase">{$t('session.bestiary.level')} {enemy.difficulty}</span>
                  </div>

                  {#if enemy.description}
                    <div class="mb-4 flex-1">
                        <p class="text-xs text-slate-400 leading-relaxed {expandedEnemyIds.has(enemy.id) ? '' : 'line-clamp-3'}">
                            {enemy.description}
                        </p>
                        {#if enemy.description.length > 120}
                            <button
                                onclick={() => toggleExpandEnemy(enemy.id)}
                                class="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 mt-1 uppercase tracking-wider"
                            >
                                {expandedEnemyIds.has(enemy.id) ? $t('session.bestiary.see_less') : $t('session.bestiary.see_more')}
                            </button>
                        {/if}
                    </div>
                  {:else}
                    <div class="mb-4 flex-1 text-[10px] text-slate-600 italic">{$t('session.bestiary.no_description')}</div>
                  {/if}

                  <div class="mt-auto flex gap-2 pt-4 border-t border-slate-800/50">
                      <button onclick={() => openEnemyModal(enemy)} class="flex-1 bg-slate-800/50 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold border border-slate-800 transition-all">{$t('common.buttons.edit')}</button>
                      <button onclick={() => deleteEnemy(enemy.id)} class="bg-slate-800/50 hover:bg-red-900/20 text-slate-500 hover:text-red-400 px-3 rounded-xl border border-slate-800 hover:border-red-900/30 transition-all"><Trash2 size={14}/></button>
                  </div>
             </div>
        {/each}
        {#if filteredEnemies.length === 0}
            <div class="text-center text-slate-500 italic col-span-3">{$t('session.bestiary.no_enemies')}</div>
        {/if}
    </div>

    {#if currentSystem === 'sofdl'}
        <EnemyModalSotDL isOpen={isEnemyModalOpen} initialData={enemyFormStr} onClose={() => isEnemyModalOpen = false} onSave={saveEnemy} />
    {:else}
        <EnemyModal isOpen={isEnemyModalOpen} initialData={enemyFormStr} onClose={() => isEnemyModalOpen = false} onSave={saveEnemy} />
    {/if}
    <EncounterModal isOpen={isEncounterModalOpen} initialData={encounterFormStr} onClose={() => isEncounterModalOpen = false} onSave={saveEncounter} />

    <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => confirmState.isOpen = false}
    />
</div>
