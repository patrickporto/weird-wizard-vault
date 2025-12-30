<script lang="ts">
    import { t } from 'svelte-i18n';
    import { X, Plus, Trash2, Save, Eye, Camera } from 'lucide-svelte';
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
            name: '', difficulty: 1, defense: 10, health: 10, damage: 0, size: 1, speed: 10, 
            description: '', senses: '', languages: '', immune: '', imageUrl: '',
            stats: { str: 10, agi: 10, int: 10, wil: 10 },
            traits: [] as {name: string, desc: string}[], 
            actions: [] as {name: string, desc: string}[], 
            reactions: [] as {name: string, desc: string}[], 
            endOfRound: [] as {name: string, desc: string}[]
        };
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
            } catch(e) {
                form = createDefaultForm();
            }
        }
    });

    function addAbility(key: 'traits' | 'actions' | 'reactions' | 'endOfRound') {
        form[key] = [...form[key], { name: '', desc: '' }];
    }
    
    function removeAbility(key: 'traits' | 'actions' | 'reactions' | 'endOfRound', index: number) {
        form[key] = form[key].filter((_, i) => i !== index);
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onclick={handleBackdropClick} role="button" aria-label={$t('session.enemy_modal.close')} tabindex="-1">
    <div class="bg-slate-800 rounded-xl w-full max-w-6xl h-[90vh] border border-slate-700 shadow-2xl overflow-hidden flex flex-col lg:flex-row" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          
          <!-- Editor Column -->
          <div class="w-full lg:w-1/2 flex flex-col h-full border-r border-slate-700">
                <div class="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                    <h3 id="modal-title" class="font-bold text-white text-lg">{$t('session.enemy_modal.title')}</h3>
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
                             <div class="grid grid-cols-2 gap-4">
                                 <div><label for="enemy-diff" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.difficulty')}</label><input id="enemy-diff" type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={form.difficulty} /></div>
                                 <div><label for="enemy-size" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.size')}</label><input id="enemy-size" type="number" step="0.5" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={form.size} /></div>
                             </div>
                             <div>
                                 <label for="enemy-desc" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.description')}</label>
                                 <textarea 
                                     id="enemy-desc"
                                     class="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm min-h-[100px] resize-none focus:border-indigo-500 focus:outline-none transition-colors" 
                                     placeholder={$t('session.enemy_modal.description_placeholder')}
                                     bind:value={form.description}
                                 ></textarea>
                             </div>
                             <div class="grid grid-cols-1">
                                 <div><label for="enemy-speed" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.speed')}</label><input id="enemy-speed" type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={form.speed} /></div>
                             </div>
                        </div>
                    {:else if tab === 'attributes'}
                        <div class="space-y-6">
                            <div>
                                <h4 class="text-indigo-400 font-bold text-sm uppercase mb-3">{$t('session.enemy_modal.main_attributes')}</h4>
                                <div class="grid grid-cols-4 gap-3">
                                    {#each ['str', 'agi', 'int', 'wil'] as attr}
                                        <div class="bg-slate-900 p-2 rounded border border-slate-700 text-center">
                                            <label for="attr-{attr}" class="text-[10px] text-slate-500 uppercase font-bold block mb-1">{attr}</label>
                                            <input id="attr-{attr}" type="number" class="w-full bg-transparent text-center font-bold text-white text-xl focus:outline-none mb-1" bind:value={form.stats[attr as 'str' | 'agi' | 'int' | 'wil']} />
                                            <div class="text-xs font-bold {(form.stats[attr as 'str' | 'agi' | 'int' | 'wil'] - 10) >= 0 ? 'text-green-500' : 'text-red-500'}">{(form.stats[attr as 'str' | 'agi' | 'int' | 'wil'] - 10) >= 0 ? '+' : ''}{form.stats[attr as 'str' | 'agi' | 'int' | 'wil'] - 10}</div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                            <div class="space-y-3">
                                <div><label for="enemy-senses" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.senses')}</label><input id="enemy-senses" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder={$t('session.enemy_modal.senses_placeholder')} bind:value={form.senses} /></div>
                                <div><label for="enemy-langs" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.languages')}</label><input id="enemy-langs" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder={$t('session.enemy_modal.languages_placeholder')} bind:value={form.languages} /></div>
                                <div><label for="enemy-immune" class="text-xs text-slate-500 uppercase font-bold block mb-1">{$t('session.enemy_modal.immunities')}</label><input id="enemy-immune" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder={$t('session.enemy_modal.immunities_placeholder')} bind:value={form.immune} /></div>
                            </div>
                        </div>
                    {:else if tab === 'abilities'}
                         <div class="space-y-6">
                            {#each [
                                { key: 'traits' as const, title: 'Traços (Traits)', color: 'text-indigo-400', border: 'border-indigo-500/30' },
                                { key: 'actions' as const, title: 'Ações', color: 'text-red-400', border: 'border-red-500/30' },
                                { key: 'reactions' as const, title: 'Reações', color: 'text-orange-400', border: 'border-orange-500/30' },
                                { key: 'endOfRound' as const, title: 'Fim da Rodada', color: 'text-yellow-400', border: 'border-yellow-500/30' }
                            ] as section}
                                <div class="p-4 bg-slate-900 rounded border {section.border}">
                                    <div class="flex justify-between items-center mb-3">
                                        <h4 class="font-bold text-sm uppercase {section.color}">{section.title}</h4>
                                        <button onclick={() => addAbility(section.key)} class="text-xs bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 text-white flex items-center gap-1 border border-slate-700"><Plus size={12}/> {$t('session.enemy_modal.add')}</button>
                                    </div>
                                    <div class="space-y-3">
                                        {#each form[section.key] as item, idx}
                                            <div class="flex gap-2 items-start animate-in fade-in slide-in-from-left-2">
                                                <div class="flex-1 space-y-1">
                                                    <input class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm font-bold placeholder-slate-600 focus:border-indigo-500 focus:outline-none" placeholder="Nome" bind:value={item.name} />
                                                    <textarea class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm placeholder-slate-600 resize-none focus:border-indigo-500 focus:outline-none" rows="2" placeholder="Descrição..." bind:value={item.desc}></textarea>
                                                </div>
                                                <button onclick={() => removeAbility(section.key, idx)} class="mt-1 text-slate-600 hover:text-red-400 p-2 hover:bg-slate-800 rounded"><Trash2 size={16}/></button>
                                            </div>
                                        {/each}
                                        {#if form[section.key].length === 0}
                                            <div class="text-xs text-slate-600 italic text-center py-4 border-2 border-dashed border-slate-800 rounded">{$t('session.enemy_modal.empty')}</div>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
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
                <div class="flex-1 p-8 overflow-y-auto flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                     <!-- Card Preview -->
                     <div class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl relative">
                         <div class="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-red-400">{$t('session.enemy_modal.difficulty')} {form.difficulty}</div>
                         
                         <div class="flex items-center gap-3 mb-4">
                            {#if form.imageUrl}
                            <div class="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shadow-lg flex-shrink-0">
                                <Avatar hash={form.imageUrl} alt={form.name} size="custom" />
                            </div>
                            {/if}
                            <div class="flex-1 min-w-0">
                                <h2 class="text-2xl font-bold text-white mb-1 font-serif tracking-wide truncate">{form.name || $t('session.enemy_modal.enemy_default')}</h2>
                                <div class="h-1 w-20 bg-red-600 rounded-full"></div>
                            </div>
                         </div>
                         
                         <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                             <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-500 uppercase font-bold text-[10px]">{$t('session.enemy_modal.defense')}</span> <span class="text-white font-mono font-bold text-lg">{form.defense}</span></div>
                             <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-500 uppercase font-bold text-[10px]">{$t('session.enemy_modal.health')}</span> <span class="text-white font-mono font-bold text-lg">{form.health}</span></div>
                             <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-500 uppercase font-bold text-[10px]">{$t('session.enemy_modal.size')}</span> <span class="text-white font-mono font-bold">{form.size}</span></div>
                             <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-500 uppercase font-bold text-[10px]">{$t('session.enemy_modal.speed')}</span> <span class="text-white font-mono font-bold">{form.speed}</span></div>
                         </div>
                         
                         <!-- Stats -->
                         <div class="grid grid-cols-4 gap-2 mb-6 text-center font-mono text-slate-300">
                             {#each ['str', 'agi', 'int', 'wil'] as attr}
                                 <div class="bg-slate-950 p-2 rounded border border-slate-800">
                                     <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">{attr}</div>
                                     <div class="text-white font-bold">{form.stats[attr as 'str' | 'agi' | 'int' | 'wil']} <span class="text-xs {(form.stats[attr as 'str' | 'agi' | 'int' | 'wil'] - 10) >= 0 ? 'text-green-500' : 'text-red-500'}">({(form.stats[attr as 'str' | 'agi' | 'int' | 'wil'] - 10) >= 0 ? '+' : ''}{form.stats[attr as 'str' | 'agi' | 'int' | 'wil'] - 10})</span></div>
                                 </div>
                             {/each}
                         </div>
                         
                         <!-- Resistances/Senses -->
                         <div class="mb-6 space-y-2 text-xs">
                            {#if form.senses}
                                <div class="flex gap-2"><span class="font-bold text-slate-500 uppercase">{$t('session.enemy_modal.senses')}:</span> <span class="text-white">{form.senses}</span></div>
                            {/if}
                            {#if form.languages}
                                <div class="flex gap-2"><span class="font-bold text-slate-500 uppercase">{$t('session.enemy_modal.languages')}:</span> <span class="text-white">{form.languages}</span></div>
                            {/if}
                            {#if form.immune}
                                <div class="flex gap-2"><span class="font-bold text-slate-500 uppercase">{$t('session.enemy_modal.immunities')}:</span> <span class="text-white">{form.immune}</span></div>
                            {/if}
                         </div>
                         
                         <div class="space-y-5 text-sm">
                              {#if form.traits.length > 0}
                                  <div><h4 class="font-bold text-indigo-400 uppercase text-xs mb-2 tracking-wider">{$t('session.enemy_modal.traits')}</h4>
                                  {#each form.traits as t}
                                     <div class="mb-2 pl-3 border-l-2 border-indigo-900"><span class="font-bold text-white">{t.name}:</span> <span class="text-slate-300">{t.desc}</span></div>
                                  {/each}</div>
                              {/if}
                              {#if form.actions.length > 0}
                                  <div><h4 class="font-bold text-red-500 uppercase text-xs mb-2 tracking-wider">{$t('session.enemy_modal.actions')}</h4>
                                  {#each form.actions as t}
                                     <div class="mb-2 pl-3 border-l-2 border-red-900/50"><span class="font-bold text-white">{t.name}:</span> <span class="text-slate-300">{t.desc}</span></div>
                                  {/each}</div>
                              {/if}
                               
                              {#if form.reactions.length > 0}
                                  <div><h4 class="font-bold text-orange-400 uppercase text-xs mb-2 tracking-wider">{$t('session.enemy_modal.reactions')}</h4>
                                  {#each form.reactions as t}
                                     <div class="mb-2 pl-3 border-l-2 border-orange-900/50"><span class="font-bold text-white">{t.name}:</span> <span class="text-slate-300">{t.desc}</span></div>
                                  {/each}</div>
                              {/if}

                              {#if form.endOfRound.length > 0}
                                  <div><h4 class="font-bold text-yellow-500 uppercase text-xs mb-2 tracking-wider">{$t('session.enemy_modal.end_of_round')}</h4>
                                  {#each form.endOfRound as t}
                                     <div class="mb-2 pl-3 border-l-2 border-yellow-900/50"><span class="font-bold text-white">{t.name}:</span> <span class="text-slate-300">{t.desc}</span></div>
                                  {/each}</div>
                              {/if}
                         </div>
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
