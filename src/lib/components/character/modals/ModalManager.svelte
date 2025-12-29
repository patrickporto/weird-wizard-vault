<script>
    import { modalState, characterActions, character, activeEffects, damage, normalHealth, currentHealth } from '$lib/stores/characterStore';
    import { X, Trash2, Plus, Minus, Zap, Wand2, Check } from 'lucide-svelte';
    import { ITEM_TYPES, GRIPS, MAGIC_TRADITIONS, DURATION_TYPES, MOD_TYPES, MOD_TARGETS } from '../../../../routes/sofww';

    // Local state for forms
    let formData = {};
    let formEffectData = {};
    let formModifier = 0;
    let formSelectedEffects = [];

    // Reactive reset on open
    $: if ($modalState.isOpen) {
        const { type, data } = $modalState;
        if (type === 'item') formData = data ? { ...data } : { name: '', type: ITEM_TYPES.OTHER, quantity: 1, price: 0, description: '', availability: 'Common', quality: 'Standard' };
        if (type === 'spell') formData = data ? { ...data } : { name: '', tier: 'Novice', tradition: 'Destruction', type: 'Attack', castings: 1, maxCastings: 1, description: '', effect: null };
        if (type === 'talent') formData = data ? { ...data } : { name: '', description: '', uses: 0, maxUses: 0, isPassive: false, effect: null };
        if (type === 'attribute') formData = { ...data };
        if (type === 'health') formData = { d: $damage, nh: $normalHealth, ch: $currentHealth };
        if (type === 'character_info') formData = { 
            name: $character.name, level: $character.level, ancestry: $character.ancestry,
            novicePath: $character.paths.novice, expertPath: $character.paths.expert, masterPath: $character.paths.master,
            normalHealth: $normalHealth, currentHealth: $currentHealth
        };

        if (type === 'stat') {
            if (data === 'defense') formData = { key: 'naturalDefense', name: 'Defesa Natural', value: $character.naturalDefense };
            else if (data === 'speed') formData = { key: 'speed', name: 'Velocidade', value: $character.speed };
        }
        
        if (type === 'pre_roll') {
            formSelectedEffects = $activeEffects.map(e => e.id);
            formModifier = 0;
        }

        if (type === 'effect') {
            if (data && data.parentType) {
                 // Nested effect editing (Spell/Talent)
                formEffectData = data.parentData.effect || { name: '', description: '', isActive: true, duration: 'ROUNDS', roundsLeft: 1, initialRounds: 1, modifiers: [] };
            } else if (data) {
                formEffectData = { ...data };
                if (!Array.isArray(formEffectData.modifiers)) formEffectData.modifiers = [];
            } else {
                formEffectData = { name: '', description: '', isActive: true, duration: 'ROUNDS', roundsLeft: 1, initialRounds: 1, modifiers: [] };
            }
        }
    }

    function closeModal() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    // Save Handlers
    function saveItem() {
        if (!formData.name?.trim()) return alert("Nome é obrigatório");
        const newItem = { ...formData, id: formData.id || Date.now() };
        if ($modalState.data) characterActions.updateItem(newItem);
        else characterActions.addItem(newItem);
        closeModal();
    }
    
    function saveSpell() {
        if (!formData.name?.trim()) return alert("Nome é obrigatório");
        const newSpell = { ...formData, id: formData.id || Date.now() };
        if ($modalState.data) characterActions.updateSpell(newSpell);
        else characterActions.addSpell(newSpell);
        closeModal();
    }

    function saveTalent() {
        if (!formData.name?.trim()) return alert("Nome é obrigatório");
        const newTalent = { ...formData, id: formData.id || Date.now() };
        if (formData.isPassive) { newTalent.maxUses = 0; newTalent.uses = 0; }
        else if (!$modalState.data && formData.maxUses > 0) newTalent.uses = formData.maxUses;
        
        if ($modalState.data) characterActions.updateTalent(newTalent);
        else characterActions.addTalent(newTalent);
        closeModal();
    }

    function saveEffect() {
        const effectData = formEffectData;
        
        // Validation: Name required unless inherited (parentData exists and we are editing it as sub-effect)
        if (!$modalState.data?.parentType && !effectData.name?.trim()) return alert("Nome do efeito é obrigatório");

        const effectWithInitial = { 
            ...effectData, 
            initialRounds: effectData.duration === 'ROUNDS' ? effectData.roundsLeft : 0 
        };

        if ($modalState.data?.parentType) {
            // Updating parent item effect
            const updatedParent = { ...$modalState.data.parentData, effect: effectWithInitial };
             // Reopen parent modal
            modalState.update(m => ({ ...m, type: $modalState.data.parentType, data: updatedParent }));
            return;
        }

        if (effectData.id && $character.effects.some(e => e.id === effectData.id)) {
            characterActions.updateEffect(effectWithInitial);
        } else {
            characterActions.addEffect({ ...effectWithInitial, id: Date.now(), isActive: true });
        }
        closeModal();
    }

    // ... (rest of saves omitted for brevity if unchanged, but I need to be careful with replace_file_content chunking)
    // Actually I should split this if lines are far apart. 
    // Wait, the block I'm replacing covers saveItem to saveEffect.
    // I need to be careful with context lines.

    function saveAttribute() {
         character.update(c => ({
             ...c,
             attributes: c.attributes.map(a => a.key === formData.key ? { ...a, value: parseInt(formData.value) } : a)
         }));
         closeModal();
    }

    function saveHealth() {
        damage.set(Math.max(0, parseInt(formData.d)));
        normalHealth.set(Math.max(1, parseInt(formData.nh)));
        currentHealth.set(Math.max(0, parseInt(formData.ch)));
        closeModal();
    }
    
    function saveCharacterInfo() {
        character.update(c => ({
            ...c,
            name: formData.name,
            level: parseInt(formData.level) || 0,
            ancestry: formData.ancestry,
            paths: { novice: formData.novicePath, expert: formData.expertPath, master: formData.masterPath }
        }));
        // Normal health updates?
        normalHealth.set(parseInt(formData.normalHealth));
        currentHealth.set(parseInt(formData.currentHealth));
        closeModal();
    }

    function saveStat() {
        character.update(c => ({
            ...c,
            [formData.key]: parseInt(formData.value) || 0
        }));
        closeModal();
    }

</script>

{#if $modalState.isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
        on:click|self={closeModal}
        role="presentation"
    >
      <div 
        class="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div class="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h3 class="font-bold text-lg text-white flex items-center gap-2">
            {#if $modalState.type === 'item'}Editor de Item
            {:else if $modalState.type === 'spell'}Editar Magia
            {:else if $modalState.type === 'talent'}Editar Talento
            {:else if $modalState.type === 'effect'}Gerenciar Efeito
            {:else if $modalState.type === 'pre_roll'}Confirmar Rolagem
            {:else if $modalState.type === 'confirm_spell'}Confirmar Conjuração
            {:else if $modalState.type === 'confirm_talent'}Confirmar Ativação
            {:else if $modalState.type === 'cast_spell'}Grimório
            {:else if $modalState.type === 'select_talent'}Seus Talentos
            {:else if $modalState.type === 'weapon_menu'}Opções de Ataque
            {:else if $modalState.type === 'character_info'}Informações do Personagem
            {:else if $modalState.type === 'health'}Vigor & Dano
            {:else if $modalState.type === 'attribute'}Atributo
            {:else if $modalState.type === 'stat'}{formData.name}
            {:else}Informação
            {/if}
          </h3>
          <button on:click={closeModal} class="text-slate-400 hover:text-white transition-colors" aria-label="Fechar"><X size={20} /></button>
        </div>
        <div class="p-6 overflow-y-auto custom-scrollbar">
            <!-- CONTEÚDO DO MODAL BASEADO NO TIPO -->
            
            {#if $modalState.type === 'item'}
                <div class="space-y-3">
                    <div>
                        <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold mb-1" placeholder="Nome" bind:value={formData.name} />
                        {#if !formData.name}<p class="text-[10px] text-red-500">* Nome obrigatório</p>{/if}
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <select class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" bind:value={formData.type}>
                            {#each Object.values(ITEM_TYPES) as t}<option value={t}>{t}</option>{/each}
                        </select>
                        <input type="number" class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder="Qtd" bind:value={formData.quantity} />
                    </div>
                    {#if formData.type === ITEM_TYPES.WEAPON}
                        <div class="grid grid-cols-3 gap-2">
                            <input type="number" class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder="Dano (d6)" bind:value={formData.damageDice} />
                            <input class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs col-span-2" placeholder="Traits" bind:value={formData.traits} />
                            <select class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" bind:value={formData.grip}>{#each Object.values(GRIPS) as g}<option value={g}>{g}</option>{/each}</select>
                            <input class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs col-span-2" placeholder="Range" bind:value={formData.range} />
                        </div>
                    {/if}
                    {#if formData.type === ITEM_TYPES.ARMOR}
                         <div class="grid grid-cols-2 gap-2">
                             <input type="number" class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder="Fixed Def" bind:value={formData.defenseFixed} />
                             <input type="number" class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder="Mod Def" bind:value={formData.defenseMod} />
                         </div>
                    {/if}
                    <textarea class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" rows={3} placeholder="Descrição" bind:value={formData.description}></textarea>
                    <div class="flex gap-2">
                        {#if $modalState.data}<button on:click={() => characterActions.deleteItem($modalState.data.id) || closeModal()} class="bg-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded"><Trash2 size={18}/></button>{/if}
                        <button on:click={saveItem} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                    </div>
                </div>

            {:else if $modalState.type === 'spell'}
                <div class="space-y-3">
                    <div>
                        <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold mb-1" placeholder="Nome" bind:value={formData.name} />
                        {#if !formData.name}<p class="text-[10px] text-red-500">* Nome obrigatório</p>{/if}
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <select class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" bind:value={formData.tier}>
                             {#each ['Novice', 'Expert', 'Master'] as t}<option value={t}>{t}</option>{/each}
                        </select>
                        <div class="relative">
                            <input list="traditions" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder="Tradição" bind:value={formData.tradition} />
                            <datalist id="traditions">
                                {#each MAGIC_TRADITIONS as t}<option value={t}>{t}</option>{/each}
                            </datalist>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                        <label for="maxCastings" class="text-xs text-slate-400 uppercase">Castings</label>
                        <input id="maxCastings" type="number" class="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-white text-center" bind:value={formData.maxCastings} on:input={() => formData.castings = formData.maxCastings} />
                    </div>
                    <div class="bg-slate-900 p-2 rounded border border-slate-700 flex justify-between items-center">
                         <span class="text-xs text-slate-400 font-bold uppercase">Efeito Associado</span>
                         <button on:click={() => modalState.update(m => ({ ...m, type: 'effect', data: { parentType: 'spell', parentData: formData } }))} class="text-[10px] px-2 py-1 rounded border {formData.effect ? 'bg-indigo-900 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-600 text-slate-500'}">
                             {formData.effect ? 'Configurado' : 'Nenhum'}
                         </button>
                    </div>
                    <textarea class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" rows={4} placeholder="Descrição" bind:value={formData.description}></textarea>
                    <div class="flex gap-2">
                        {#if $modalState.data}<button on:click={() => characterActions.deleteSpell($modalState.data.id) || closeModal()} class="bg-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded"><Trash2 size={18}/></button>{/if}
                        <button on:click={saveSpell} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                    </div>
                </div>

            {:else if $modalState.type === 'talent'}
                <div class="space-y-3">
                    <div>
                        <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold mb-1" placeholder="Nome" bind:value={formData.name} />
                        {#if !formData.name}<p class="text-[10px] text-red-500">* Nome obrigatório</p>{/if}
                    </div>
                    <div class="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                         <input type="checkbox" id="isPassive" bind:checked={formData.isPassive} class="w-4 h-4 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                         <label for="isPassive" class="text-xs text-slate-400 uppercase font-bold flex-1 cursor-pointer">Passivo / Ilimitado</label>
                         {#if !formData.isPassive}
                            <div class="flex items-center gap-2 border-l border-slate-700 pl-2">
                                <label for="maxUses" class="text-xs text-slate-400 uppercase">Max Uses</label>
                                <input id="maxUses" type="number" class="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-white text-center" bind:value={formData.maxUses} />
                            </div>
                         {/if}
                    </div>
                    <div class="bg-slate-900 p-2 rounded border border-slate-700 flex justify-between items-center">
                         <span class="text-xs text-slate-400 font-bold uppercase">Efeito Associado</span>
                         <button on:click={() => modalState.update(m => ({ ...m, type: 'effect', data: { parentType: 'talent', parentData: formData } }))} class="text-[10px] px-2 py-1 rounded border {formData.effect ? 'bg-indigo-900 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-600 text-slate-500'}">
                             {formData.effect ? 'Configurado' : 'Nenhum'}
                         </button>
                    </div>
                    <textarea class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" rows={4} placeholder="Descrição" bind:value={formData.description}></textarea>
                    <div class="flex gap-2">
                        {#if $modalState.data}<button on:click={() => characterActions.deleteTalent($modalState.data.id) || closeModal()} class="bg-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded"><Trash2 size={18}/></button>{/if}
                        <button on:click={saveTalent} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                    </div>
                </div>

            {:else if $modalState.type === 'effect'}
                <div class="space-y-4">
                    {#if !$modalState.data?.parentType}
                        <div>
                            <label for="effectName" class="text-xs font-bold text-slate-400 uppercase">Nome</label>
                            <input id="effectName" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formEffectData.name} />
                            {#if !formEffectData.name}<p class="text-[10px] text-red-500">* Nome obrigatório</p>{/if}
                        </div>
                    {:else}
                         <div class="text-center text-xs text-slate-500 italic mb-2">Nome e Descrição herdados do item pai.</div>
                    {/if}
                    <div><label for="effectDuration" class="text-xs font-bold text-slate-400 uppercase">Duração</label>
                        <div class="grid grid-cols-2 gap-2">
                            <select id="effectDuration" class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" bind:value={formEffectData.duration}>
                                {#each Object.entries(DURATION_TYPES) as [k,v]}<option value={k}>{v}</option>{/each}
                            </select>
                            {#if formEffectData.duration === 'ROUNDS'}
                                <input type="number" class="bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formEffectData.roundsLeft} />
                            {/if}
                        </div>
                    </div>
                    <div class="bg-slate-950 p-3 rounded border border-slate-800">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-bold text-indigo-400 uppercase">Modificadores</span>
                            <button on:click={() => formEffectData = { ...formEffectData, modifiers: [...(formEffectData.modifiers || []), { target: 'str', type: MOD_TYPES.ADD, value: 1 }] }} class="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600 flex items-center gap-1"><Plus size={10}/> Add</button>
                        </div>
                        <div class="space-y-2">
                            {#each formEffectData.modifiers as mod, idx}
                                <div class="flex gap-1 items-center">
                                    <select class="bg-slate-900 border border-slate-700 rounded text-[10px] text-white p-1 w-1/3" bind:value={mod.target}>
                                        {#each Object.entries(MOD_TARGETS) as [k,v]}<option value={k}>{v}</option>{/each}
                                    </select>
                                    <select class="bg-slate-900 border border-slate-700 rounded text-[10px] text-white p-1 w-1/4" bind:value={mod.type}>
                                        <option value={MOD_TYPES.ADD}>Add (+/-)</option><option value={MOD_TYPES.SET}>Set (=)</option><option value={MOD_TYPES.MULT}>Mult (x)</option>
                                    </select>
                                    <input type="number" step={mod.type === MOD_TYPES.MULT ? "0.1" : "1"} class="bg-slate-900 border border-slate-700 rounded text-[10px] text-white p-1 w-1/4 text-center" bind:value={mod.value} />
                                    <button on:click={() => formEffectData = { ...formEffectData, modifiers: formEffectData.modifiers.filter((_, i) => i !== idx) }} class="text-slate-600 hover:text-red-400 p-1"><Trash2 size={12}/></button>
                                </div>
                            {/each}
                        </div>
                    </div>
                    {#if !$modalState.data?.parentType}
                         <div><label class="text-xs font-bold text-slate-400 uppercase">Descrição</label><textarea class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formEffectData.description}></textarea></div>
                    {/if}
                    <button on:click={saveEffect} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar Efeito</button>
                </div>

            {:else if $modalState.type === 'attribute'}
                <div class="space-y-4">
                    <h3 class="text-white font-bold text-lg">{formData.name}</h3>
                    <div><label class="text-xs text-slate-400 uppercase font-bold">Valor Base</label><input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.value} /></div>
                    <button on:click={saveAttribute} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                </div>

            {:else if $modalState.type === 'stat'}
                <div class="space-y-4">
                    <h3 class="text-white font-bold text-lg uppercase">{formData.name}</h3>
                    <div><label class="text-xs text-slate-400 uppercase font-bold">Valor Base</label><input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.value} /></div>
                    <button on:click={saveStat} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                </div>

            {:else if $modalState.type === 'health'}
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-xs text-slate-400 uppercase font-bold">Vida Normal</label><input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.nh} /></div>
                        <div><label class="text-xs text-slate-400 uppercase font-bold">Vida Atual</label><input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.ch} /></div>
                    </div>
                    <div><label class="text-xs text-red-400 uppercase font-bold">Dano</label><input type="number" class="w-full bg-slate-900 border border-red-900/50 rounded p-2 text-white" bind:value={formData.d} /></div>
                    <button on:click={saveHealth} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Atualizar</button>
                </div>

            {:else if $modalState.type === 'character_info'}
                <div class="space-y-4">
                        <div><label class="text-xs font-bold text-slate-400 uppercase">Nome</label><input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.name} /></div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="text-xs font-bold text-slate-400 uppercase">Nível</label><input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.level} /></div>
                            <div><label class="text-xs font-bold text-slate-400 uppercase">Ancestralidade</label><input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.ancestry} /></div>
                        </div>
                        <div class="pt-2 border-t border-slate-700 space-y-3">
                            <div><label class="text-[10px] font-bold text-slate-400 uppercase">Novice</label><input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" bind:value={formData.novicePath} /></div>
                            <div><label class="text-[10px] font-bold text-slate-400 uppercase">Expert</label><input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" bind:value={formData.expertPath} /></div>
                            <div><label class="text-[10px] font-bold text-slate-400 uppercase">Master</label><input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" bind:value={formData.masterPath} /></div>
                        </div>
                        <button on:click={saveCharacterInfo} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded mt-2">Salvar</button>
                </div>

            {:else if $modalState.type === 'confirm_spell' || $modalState.type === 'confirm_talent'}
                <div class="space-y-4">
                    <div class="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <p class="text-indigo-300 font-bold text-2xl mb-1 text-center">{$modalState.data.name}</p>
                        <p class="text-slate-400 text-sm italic mb-4 text-center">{$modalState.data.description}</p>
                        
                        {#if $modalState.data.effect}
                            <div class="mt-4 p-3 bg-green-900/20 border border-green-900/50 rounded-lg">
                                <div class="flex items-center gap-2 mb-1 text-[10px] font-bold text-green-400 uppercase tracking-wider">Efeito Associado</div>
                                <div class="text-xs text-green-200/70">{$modalState.data.effect.name}: {$modalState.data.effect.description}</div>
                            </div>
                        {/if}
                    </div>

                    <div class="flex flex-col gap-2 pt-2">
                        {#if $modalState.data.effect}
                            <button 
                                on:click={() => { 
                                    characterActions.applyEffectToCharacter($modalState.data.effect, $modalState.data); 
                                    if($modalState.type === 'confirm_spell') characterActions.commitSpellCast($modalState.data); 
                                    else characterActions.commitTalentUse($modalState.data); 
                                }} 
                                class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                <Check size={18} /> APLICAR EFEITO E USAR
                            </button>
                            <button 
                                on:click={() => { 
                                    if($modalState.type === 'confirm_spell') characterActions.commitSpellCast($modalState.data); 
                                    else characterActions.commitTalentUse($modalState.data); 
                                }} 
                                class="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 rounded-lg text-sm transition-colors"
                            >
                                USAR SEM APLICAR EFEITO
                            </button>
                        {:else}
                            <button 
                                on:click={() => { 
                                    if($modalState.type === 'confirm_spell') characterActions.commitSpellCast($modalState.data); 
                                    else characterActions.commitTalentUse($modalState.data); 
                                }} 
                                class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                <Zap size={18} /> CONFIRMAR USO
                            </button>
                        {/if}
                        
                        <button 
                            on:click={closeModal} 
                            class="w-full text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest py-2 transition-colors mt-2"
                        >
                            CANCELAR
                        </button>
                    </div>
                </div>

            {:else if $modalState.type === 'rest_confirm'}
                <div class="text-center space-y-6">
                    <div class="flex justify-center"><Trash2 size={48} class="text-indigo-400" /></div>
                    <div><p class="text-lg text-white font-bold">Realizar Descanso?</p></div>
                    <div class="flex gap-4 justify-center"><button on:click={closeModal} class="px-6 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold">Cancelar</button><button on:click={characterActions.confirmRest} class="px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Descansar</button></div>
                </div>

            {:else if $modalState.type === 'pre_roll'}
                <!-- Pre Roll Modal Content -->
                 <div class="space-y-4">
                    <h3 class="text-center font-bold text-white uppercase mb-2">Rolagem</h3>
                    
                    <div class="bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
                        <div class="flex justify-center items-center gap-6 mb-2">
                             <button on:click={() => formModifier--} class="w-12 h-12 rounded-full bg-slate-800 hover:bg-red-900 flex items-center justify-center text-slate-300 hover:text-white border border-slate-700"><Minus size={24}/></button>
                             <span class="text-4xl font-bold {formModifier > 0 ? 'text-green-400' : formModifier < 0 ? 'text-red-400' : 'text-slate-500'}">{formModifier > 0 ? '+' : ''}{formModifier}</span>
                             <button on:click={() => formModifier++} class="w-12 h-12 rounded-full bg-slate-800 hover:bg-green-900 flex items-center justify-center text-slate-300 hover:text-white border border-slate-700"><Plus size={24}/></button>
                        </div>
                        <div class="text-xs text-slate-500">{$modalState.data.type === 'weapon_damage' ? 'Dados Extras' : 'Boons/Banes'}</div>
                    </div>
                    <button on:click={() => characterActions.finalizeRoll($modalState.data, formModifier, $activeEffects.filter(e => formSelectedEffects.includes(e.id)).map(e => e.name))} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">ROLAR</button>
                    <!-- Effect Selection could go here if implemented -->
                </div>
            
            {:else if $modalState.type === 'weapon_menu'}
                <div class="space-y-6 text-center">
                    <div class="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl">
                        <h3 class="text-2xl font-bold text-white mb-1">{$modalState.data.name}</h3>
                        <p class="text-xs text-indigo-300 uppercase tracking-widest font-bold">{$modalState.data.traits || 'Sem Atributos'}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <button 
                            on:click={() => modalState.update(m => ({ ...m, type: 'pre_roll', data: { type: 'weapon_attack', source: $modalState.data } }))} 
                            class="flex flex-col items-center justify-center p-6 bg-slate-900/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 rounded-2xl transition-all group"
                        >
                            <div class="p-3 rounded-full bg-slate-800 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white mb-3 shadow-lg">
                                <Zap size={24} />
                            </div>
                            <span class="font-black text-white tracking-widest uppercase text-sm">Ataque</span>
                        </button>
                        
                        <button 
                            on:click={() => modalState.update(m => ({ ...m, type: 'pre_roll', data: { type: 'weapon_damage', source: $modalState.data } }))} 
                            class="flex flex-col items-center justify-center p-6 bg-slate-900/80 hover:bg-red-600 border border-slate-700 hover:border-red-400 rounded-2xl transition-all group"
                        >
                            <div class="p-3 rounded-full bg-slate-800 text-red-500 group-hover:bg-red-500 group-hover:text-white mb-3 shadow-lg">
                                <Plus size={24} />
                            </div>
                            <span class="font-black text-white tracking-widest uppercase text-sm">Dano</span>
                        </button>
                    </div>
                    
                    <button on:click={closeModal} class="text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em]">Voltar</button>
                </div>

            {:else if $modalState.type === 'select_talent'}
                <div class="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                    {#each $character.talents as talent}
                        <button 
                            on:click={() => modalState.update(m => ({...m, type: 'confirm_talent', data: talent}))} 
                            disabled={!talent.isPassive && talent.maxUses > 0 && talent.uses === 0} 
                            class="w-full text-left p-4 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-yellow-900/20 hover:border-yellow-600/50 flex items-center justify-between transition-all group disabled:opacity-30 disabled:hover:bg-slate-900/50 disabled:hover:border-slate-700 active:scale-[0.99]"
                        >
                            <div class="flex items-center gap-4">
                                <div class="p-2.5 rounded-lg bg-slate-800 text-yellow-500 group-hover:scale-110 transition-transform">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p class="text-white font-bold">{talent.name}</p>
                                    <p class="text-[10px] text-slate-500 italic max-w-xs">{talent.description}</p>
                                </div>
                            </div>
                            
                            <div class="text-right shrink-0">
                                {#if talent.isPassive}
                                    <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest">Passivo</span>
                                {:else}
                                    <span class="block text-[10px] text-slate-500 uppercase font-bold text-center">Cargas</span>
                                    <p class="flex items-center justify-center gap-1">
                                        {#each Array(talent.maxUses) as _, i}
                                            <span class="w-1.5 h-1.5 rounded-full {i < talent.uses ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-slate-700'}"></span>
                                        {/each}
                                    </p>
                                    <span class="font-mono font-bold text-xs {talent.uses > 0 ? 'text-green-400' : 'text-red-400'}">{talent.uses}/{talent.maxUses}</span>
                                {/if}
                            </div>
                        </button>
                    {:else}
                        <div class="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                            <Zap size={32} class="mx-auto text-slate-700 mb-2 opacity-20" />
                            <p class="text-slate-500 italic text-sm">Nenhum talento disponível.</p>
                        </div>
                    {/each}
                </div>
            
             {:else if $modalState.type === 'cast_spell'}
                <div class="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                    {#each $character.spells as spell}
                        <button 
                            on:click={() => modalState.update(m => ({...m, type: 'confirm_spell', data: spell}))} 
                            disabled={spell.castings === 0} 
                            class="w-full text-left p-4 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-indigo-900/20 hover:border-indigo-600 text-indigo-400/0 hover:text-indigo-400 flex items-center justify-between transition-all group disabled:opacity-30 active:scale-[0.99]"
                        >
                            <div class="flex items-center gap-4">
                                <div class="p-2.5 rounded-lg bg-slate-800 text-indigo-400 group-hover:scale-110 transition-all border border-transparent group-hover:border-indigo-500/30">
                                    <Wand2 size={20} />
                                </div>
                                <div>
                                    <p class="text-white font-bold group-hover:text-indigo-300 transition-colors">{spell.name}</p>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{spell.tradition} • {spell.tier}</p>
                                </div>
                            </div>
                            <div class="text-right shrink-0">
                                <span class="block text-[10px] text-slate-500 uppercase font-bold text-center mb-1">Casts</span>
                                <div class="flex gap-0.5">
                                    {#each Array(spell.maxCastings) as _, i}
                                        <div class="w-3 h-1 rounded-full {i < spell.castings ? 'bg-indigo-500' : 'bg-slate-700'}"></div>
                                    {/each}
                                </div>
                            </div>
                        </button>
                    {:else}
                        <div class="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                            <Wand2 size={32} class="mx-auto text-slate-700 mb-2 opacity-20" />
                            <p class="text-slate-500 italic text-sm">Grimório vazio.</p>
                        </div>
                    {/each}
                </div>

            {/if}
        </div>
      </div>
    </div>
{/if}
