<script>
  // Removida a dependência externa 'lucide-svelte' para evitar erros de importação.
  // Os ícones agora são renderizados via SVG inline definidos abaixo.

  // --- CONSTANTES ---
  const MAGIC_TRADITIONS = [
    "Aeromancy", "Alchemy", "Alteration", "Animism", "Astromancy", "Chaos", 
    "Chronomancy", "Conjuration", "Cryomancy", "Dark Arts", "Destruction", 
    "Divination", "Eldritch", "Enchantment", "Evocation", "Geomancy", 
    "Hydromancy", "Illusion", "Invocation", "Necromancy", "Oneiromancy", 
    "Order", "Primal", "Protection", "Psychomancy", "Pyromancy", 
    "Shadowmancy", "Skullduggery", "Spiritualism", "Symbolism", 
    "Technomancy", "Teleportation", "War"
  ];

  const ITEM_TYPES = {
    WEAPON: 'Weapon',
    ARMOR: 'Armor',
    SHIELD: 'Shield',
    CONSUMABLE: 'Consumable',
    EXPLOSIVE: 'Explosive',
    OTHER: 'Other'
  };

  const GRIPS = { OFF: 'Off', ONE: 'One', TWO: 'Two' };
  const AVAILABILITY = ['Common', 'Uncommon', 'Rare', 'Exotic'];
  const QUALITY = ['Standard', 'Inferior', 'Superior'];

  // Definição dos ícones SVG (substituindo lucide-svelte)
  const icons = {
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />',
    sword: '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" x2="19" y1="19" y2="13" /><line x1="16" x2="20" y1="16" y2="20" /><line x1="19" x2="21" y1="21" y2="19" />',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />',
    backpack: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /><path d="M8 2v4" /><path d="M16 2v4" />',
    plus: '<path d="M5 12h14" /><path d="M12 5v14" />',
    minus: '<path d="M5 12h14" />',
    dices: '<rect width="12" height="12" x="2" y="10" rx="2" ry="2" /><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" /><path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M15 6h.01" /><path d="M18 9h.01" />',
    info: '<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />',
    x: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />',
    trash2: '<path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />',
    edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />',
    skull: '<circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><path d="M8 20v2h8v-2" /><path d="m12.5 17-.5-1-.5 1" /><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />',
    languages: '<path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" />',
    bomb: '<circle cx="11" cy="13" r="9" /><path d="M14.5 7.5 11 13" /><path d="m22 2-3 3" /><path d="m16.25 3.75-1.75 3.75" /><path d="m20.25 7.75-1.75-3.75" />'
  };

  // --- ESTADO ---
  let activeTab = 'acoes';
  let modalState = { type: null, isOpen: false, data: null };
  let formData = {}; // Buffer para edição nos modais
  let healthInputVal = '';

  let character = {
    name: "Alaric, o Errante",
    level: 3,
    ancestry: "Humano",
    paths: { novice: "Mago", expert: "Alquimista", master: "-" },
    attributes: [
      { name: "Força", value: 10, key: "str" },
      { name: "Agilidade", value: 12, key: "agi" },
      { name: "Intelecto", value: 15, key: "int" },
      { name: "Vontade", value: 11, key: "wil" }
    ],
    naturalDefense: 10,
    bonusDamage: 0,
    speed: 10,
    languages: ["Comum", "Élfico"],
    spells: [
      { id: 1, name: "Seta de Energia", tier: "Novice", type: "Ataque", tradition: "Destruction", description: "Causa 1d6 de dano a um alvo em alcance curto.", castings: 3, maxCastings: 3 },
      { id: 2, name: "Escudo Mágico", tier: "Novice", type: "Utilidade", tradition: "Protection", description: "+2 em Defesa por 1 minuto.", castings: 2, maxCastings: 2 }
    ],
    talents: [
      { id: 1, name: "Sentido Arcano", description: "Você detecta magia a curto alcance.", uses: null, maxUses: null },
      { id: 2, name: "Sorte do Principiante", description: "Pode refazer um teste falho.", uses: 1, maxUses: 1 }
    ],
    equipment: [
      { 
        id: 1, name: "Cajado", type: ITEM_TYPES.WEAPON, quantity: 1, price: 5, availability: 'Common', quality: 'Standard',
        grip: GRIPS.TWO, range: 'Melee', damageDice: 1, boonsBanes: 0, traits: "Finesse",
        equippedState: null, equipped: false 
      },
      { 
        id: 2, name: "Poção de Cura", type: ITEM_TYPES.CONSUMABLE, quantity: 3, price: 10, availability: 'Common', quality: 'Standard',
        notes: "Recupera Healing Rate", equippedState: null, equipped: false 
      },
      {
        id: 3, name: "Couro Batido", type: ITEM_TYPES.ARMOR, quantity: 1, price: 20, availability: 'Common', quality: 'Standard',
        defenseType: 'fixed', defenseFixed: 12, armorWeight: 'Light', equipped: false, equippedState: null
      }
    ]
  };

  let normalHealth = 24;
  let damage = 0;
  let healthReduction = 0;

  // --- REATIVIDADE ($: Calculados automaticamente) ---
  
  $: effectiveHealth = Math.max(0, normalHealth - healthReduction);
  $: currentHealth = Math.max(0, effectiveHealth - damage);
  $: healthPerc = normalHealth > 0 ? (currentHealth / normalHealth) * 100 : 0;
  $: reductionPerc = normalHealth > 0 ? (healthReduction / normalHealth) * 100 : 0;
  $: isIncapacitated = damage >= effectiveHealth && effectiveHealth > 0;
  $: isInjured = currentHealth < effectiveHealth / 2 && !isIncapacitated;

  $: totalDefense = (() => {
    let defense = character.naturalDefense;
    let shieldBonus = 0;

    // 1. Processar Armadura
    const equippedArmor = character.equipment.find(i => i.type === ITEM_TYPES.ARMOR && i.equipped);
    if (equippedArmor) {
      const fixedDef = equippedArmor.defenseFixed || 0;
      const modDef = character.naturalDefense + (equippedArmor.defenseMod || 0);
      
      if (equippedArmor.defenseFixed && equippedArmor.defenseMod) {
        defense = Math.max(fixedDef, modDef);
      } else if (equippedArmor.defenseFixed) {
        defense = fixedDef; 
      } else if (equippedArmor.defenseMod) {
        defense = character.naturalDefense + equippedArmor.defenseMod;
      }
    }

    // 2. Processar Escudos
    character.equipment.filter(i => i.type === ITEM_TYPES.SHIELD && i.equippedState).forEach(shield => {
       shieldBonus += (shield.defenseMod || 0);
    });

    return defense + shieldBonus;
  })();

  // --- FUNÇÕES ---

  function openModal(type, data = null) {
    modalState = { type, isOpen: true, data };
    if (type === 'health') {
        healthInputVal = '';
    } else if (data) {
        // Clona para edição
        formData = { ...data };
    } else {
        // Defaults para criação
        if (type === 'item') {
            formData = { 
                name: '', type: ITEM_TYPES.OTHER, quantity: 1, price: 0, availability: 'Common', quality: 'Standard', notes: '',
                grip: GRIPS.ONE, range: 'Melee', damageDice: 1, boonsBanes: 0, traits: '', defenseFixed: '', defenseMod: '', armorWeight: 'Light'
            };
        } else if (type === 'spell') {
            formData = { name: '', tier: 'Novice', type: 'Ataque', tradition: '', description: '', castings: 1, maxCastings: 1 };
        } else if (type === 'talent') {
            formData = { name: '', description: '', uses: '', maxUses: '' };
        }
    }
  }

  function closeModal() {
    modalState = { type: null, isOpen: false, data: null };
    formData = {};
  }

  // --- AÇÕES DE PERSONAGEM ---

  function handleRest() {
    openModal('rest_confirm');
  }

  function confirmRest() {
    character.spells = character.spells.map(s => ({ ...s, castings: s.maxCastings }));
    character.talents = character.talents.map(t => ({ ...t, uses: t.maxUses }));
    damage = 0;
    const healthRecovery = Math.floor(normalHealth / 10);
    healthReduction = Math.max(0, healthReduction - healthRecovery);
    closeModal();
  }

  function applyHealth(type) {
    const v = parseInt(healthInputVal) || 0;
    if (v <= 0) return;
    if (type === 'damage') damage = Math.min(effectiveHealth, damage + v);
    if (type === 'heal') damage = Math.max(0, damage - v);
    if (type === 'reduce') healthReduction = Math.min(normalHealth, healthReduction + v);
    if (type === 'restore') healthReduction = Math.max(0, healthReduction - v);
    closeModal();
  }

  function castSpell(id) {
    character.spells = character.spells.map(s => {
        if (s.id === id && s.castings > 0) return { ...s, castings: s.castings - 1 };
        return s;
    });
  }

  function useTalent(id) {
    character.talents = character.talents.map(t => {
        if (t.id === id && t.uses > 0) return { ...t, uses: t.uses - 1 };
        return t;
    });
  }

  function useConsumable(item) {
    if (item.quantity > 0) {
        item.quantity -= 1;
        character.equipment = [...character.equipment]; // Trigger reactivity
    }
  }

  function equipItem(item, state = null) {
    // Armadura: Só 1 equipada por vez
    if (item.type === ITEM_TYPES.ARMOR) {
        character.equipment = character.equipment.map(i => {
            if (i.id === item.id) return { ...i, equipped: !i.equipped };
            if (i.type === ITEM_TYPES.ARMOR && item.type === ITEM_TYPES.ARMOR && !item.equipped) {
                return { ...i, equipped: false };
            }
            return i;
        });
    } 
    // Armas e Escudos: Gerenciar Grips
    else if (item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.SHIELD) {
        character.equipment = character.equipment.map(i => {
            if (i.id === item.id) return { ...i, equippedState: state };
            return i;
        });
    }
  }

  // --- SALVAMENTO DE FORMULÁRIOS ---

  function saveItem() {
    const payload = {
        ...formData,
        price: parseInt(formData.price) || 0,
        quantity: parseInt(formData.quantity) || 1,
        damageDice: parseInt(formData.damageDice) || 0,
        boonsBanes: parseInt(formData.boonsBanes) || 0,
        defenseFixed: formData.defenseFixed ? parseInt(formData.defenseFixed) : null,
        defenseMod: formData.defenseMod ? parseInt(formData.defenseMod) : null,
    };

    if (modalState.data) {
        // Edit
        character.equipment = character.equipment.map(i => 
            i.id === modalState.data.id ? { ...payload, id: i.id, equippedState: i.equippedState, equipped: i.equipped } : i
        );
    } else {
        // Create
        character.equipment = [...character.equipment, { ...payload, id: Date.now(), equippedState: null, equipped: false }];
    }
    closeModal();
  }

  function saveSpell() {
    if (modalState.data) {
        character.spells = character.spells.map(s => s.id === modalState.data.id ? { ...formData, id: s.id } : s);
    } else {
        character.spells = [...character.spells, { ...formData, id: Date.now(), castings: formData.maxCastings }];
    }
    closeModal();
  }

  function saveTalent() {
    const uses = formData.maxUses ? parseInt(formData.maxUses) : null;
    const newTalent = { ...formData, maxUses: uses, uses: modalState.data ? modalState.data.uses : uses };
    
    if (modalState.data) {
        character.talents = character.talents.map(t => t.id === modalState.data.id ? { ...newTalent, id: t.id } : t);
    } else {
        character.talents = [...character.talents, { ...newTalent, id: Date.now() }];
    }
    closeModal();
  }

  function addLanguage(e) {
      if (e.key === 'Enter' && e.target.value) {
          character.languages = [...character.languages, e.target.value];
          e.target.value = '';
      }
  }
  
  function removeLanguage(idx) {
      character.languages = character.languages.filter((_, i) => i !== idx);
  }

</script>

<div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 relative">

  <!-- MODAL WRAPPER -->
  {#if modalState.isOpen}
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div class="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div class="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
            <h3 class="font-bold text-lg text-white flex items-center gap-2">
                {#if modalState.type === 'health'}Gerenciar Saúde
                {:else if modalState.type === 'item'}Editor de Item
                {:else if modalState.type === 'spell'}Grimório
                {:else if modalState.type === 'talent'}Talento / Habilidade
                {/if}
            </h3>
            <button on:click={closeModal} class="text-slate-400 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.x}</svg>
            </button>
        </div>
        
        <div class="p-6 overflow-y-auto custom-scrollbar">
            
            <!-- HEALTH FORM -->
            {#if modalState.type === 'health'}
                <div class="space-y-6">
                    <input type="number" bind:value={healthInputVal} class="w-full bg-slate-950 border border-slate-600 rounded-lg p-3 text-3xl text-center font-bold text-white" autofocus placeholder="0" />
                    <div class="grid grid-cols-2 gap-4">
                        <button on:click={() => applyHealth('damage')} class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.sword}</svg>Dano</button>
                        <button on:click={() => applyHealth('heal')} class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.plus}</svg>Cura</button>
                        <button on:click={() => applyHealth('reduce')} class="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.skull}</svg>Reduzir</button>
                        <button on:click={() => applyHealth('restore')} class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.shield}</svg>Restaurar</button>
                    </div>
                </div>

            <!-- REST CONFIRM -->
            {:else if modalState.type === 'rest_confirm'}
                <div class="text-center space-y-6">
                    <div class="flex justify-center"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-400">{@html icons.moon}</svg></div>
                    <div>
                        <p class="text-lg text-white font-bold">Realizar um Descanso?</p>
                        <p class="text-sm text-slate-400 mt-2">Isso irá recuperar todas as suas magias e talentos, curar todo o dano e recuperar 1/10 da sua saúde reduzida.</p>
                    </div>
                    <div class="flex gap-4 justify-center">
                        <button on:click={closeModal} class="px-6 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold">Cancelar</button>
                        <button on:click={confirmRest} class="px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Descansar</button>
                    </div>
                </div>

            <!-- ITEM FORM -->
            {:else if modalState.type === 'item'}
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-xs text-slate-400 font-bold uppercase">Nome</label>
                            <input bind:value={formData.name} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label class="text-xs text-slate-400 font-bold uppercase">Tipo</label>
                            <select bind:value={formData.type} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                                {#each Object.values(ITEM_TYPES) as t}
                                    <option value={t}>{t}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    {#if formData.type === ITEM_TYPES.WEAPON}
                        <div class="bg-slate-900/50 p-3 rounded border border-slate-700 space-y-3">
                            <div class="grid grid-cols-3 gap-3">
                                <div>
                                    <label class="text-[10px] text-slate-400 font-bold uppercase">Grip</label>
                                    <select bind:value={formData.grip} class="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm">
                                        {#each Object.values(GRIPS) as g}<option value={g}>{g}</option>{/each}
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] text-slate-400 font-bold uppercase">Alcance</label>
                                    <select bind:value={formData.range} class="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm">
                                        <option value="Melee">Melee</option><option value="Ranged">Ranged</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] text-slate-400 font-bold uppercase">Dano (d6)</label>
                                    <input type="number" bind:value={formData.damageDice} class="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm" />
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[10px] text-slate-400 font-bold uppercase">Boons/Banes</label>
                                    <input type="number" bind:value={formData.boonsBanes} class="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm" />
                                </div>
                                <div>
                                    <label class="text-[10px] text-slate-400 font-bold uppercase">Traits</label>
                                    <input bind:value={formData.traits} placeholder="Finesse, Thrown..." class="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm" />
                                </div>
                            </div>
                        </div>
                    {/if}

                    {#if formData.type === ITEM_TYPES.ARMOR || formData.type === ITEM_TYPES.SHIELD}
                        <div class="bg-slate-900/50 p-3 rounded border border-slate-700 space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[10px] text-slate-400 font-bold uppercase">Defesa Fixa</label>
                                    <input type="number" bind:value={formData.defenseFixed} placeholder="Ex: 12" class="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm" />
                                </div>
                                <div>
                                    <label class="text-[10px] text-slate-400 font-bold uppercase">Defesa Mod</label>
                                    <input type="number" bind:value={formData.defenseMod} placeholder="Ex: 2" class="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm" />
                                </div>
                            </div>
                            {#if formData.type === ITEM_TYPES.ARMOR}
                                <div>
                                    <label class="text-[10px] text-slate-400 font-bold uppercase">Peso</label>
                                    <select bind:value={formData.armorWeight} class="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm">
                                        <option value="Light">Light</option><option value="Medium">Medium</option><option value="Heavy">Heavy</option>
                                    </select>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    <div class="grid grid-cols-3 gap-3">
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold uppercase">Preço</label>
                            <input type="number" bind:value={formData.price} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold uppercase">Disponibilidade</label>
                            <select bind:value={formData.availability} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                                {#each AVAILABILITY as v}<option value={v}>{v}</option>{/each}
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold uppercase">Qualidade</label>
                            <select bind:value={formData.quality} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                                {#each QUALITY as v}<option value={v}>{v}</option>{/each}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-slate-400 font-bold uppercase">Notas / Descrição</label>
                        <textarea bind:value={formData.notes} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"></textarea>
                    </div>

                    <div class="grid grid-cols-4 gap-3">
                        <div class="col-span-1">
                            <label class="text-[10px] text-slate-400 font-bold uppercase">Qtd</label>
                            <input type="number" bind:value={formData.quantity} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <button on:click={saveItem} class="col-span-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded mt-auto">Salvar Item</button>
                    </div>
                </div>

            <!-- SPELL FORM -->
            {:else if modalState.type === 'spell'}
                <div class="space-y-4">
                    <div><label class="text-xs font-bold text-slate-400 uppercase">Nome</label><input bind:value={formData.name} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-xs font-bold text-slate-400 uppercase">Tier</label>
                            <select bind:value={formData.tier} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                                <option value="Novice">Novice</option><option value="Expert">Expert</option><option value="Master">Master</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-slate-400 uppercase">Tradição</label>
                            <input list="traditions" bind:value={formData.tradition} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                            <datalist id="traditions">{#each MAGIC_TRADITIONS as t}<option value={t}>{t}</option>{/each}</datalist>
                        </div>
                    </div>
                    <div><label class="text-xs font-bold text-slate-400 uppercase">Castings</label><input type="number" bind:value={formData.maxCastings} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
                    <div><label class="text-xs font-bold text-slate-400 uppercase">Descrição</label><textarea bind:value={formData.description} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-24"></textarea></div>
                    <button on:click={saveSpell} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                </div>

            <!-- TALENT FORM -->
            {:else if modalState.type === 'talent'}
                <div class="space-y-4">
                    <div><label class="text-xs font-bold text-slate-400 uppercase">Nome</label><input bind:value={formData.name} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
                    <div><label class="text-xs font-bold text-slate-400 uppercase">Usos Diários (Vazio = Passivo)</label><input type="number" bind:value={formData.maxUses} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
                    <div><label class="text-xs font-bold text-slate-400 uppercase">Descrição</label><textarea bind:value={formData.description} class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-24"></textarea></div>
                    <button on:click={saveTalent} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                </div>
            {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- HEADER -->
  <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
    <div class="max-w-6xl mx-auto px-4 py-3">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-indigo-600 rounded-full border border-slate-500 flex items-center justify-center text-xl font-bold">{character.name.charAt(0)}</div>
                <div>
                    <h1 class="text-lg font-bold text-white leading-none">{character.name}</h1>
                    <p class="text-slate-400 text-xs">Lvl {character.level} • {character.paths.novice}</p>
                </div>
            </div>

            <!-- Health Bar -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="flex-1 w-full md:max-w-md cursor-pointer group" on:click={() => openModal('health')} role="button" tabindex="0">
                <div class="flex justify-between text-xs mb-1 px-1">
                    <span class={`font-bold uppercase ${isIncapacitated ? 'text-red-500 animate-pulse' : isInjured ? 'text-yellow-500' : 'text-green-500'}`}>
                       {isIncapacitated ? "Incapacitado" : isInjured ? "Ferido" : "Saudável"}
                    </span>
                    <span class="text-slate-400 font-mono">{currentHealth} / {effectiveHealth} {#if healthReduction > 0}<span class="text-red-500">(-{healthReduction})</span>{/if}</span>
                </div>
                <div class="h-4 w-full bg-slate-950 rounded border border-slate-700 relative overflow-hidden">
                    <div class="absolute top-0 right-0 h-full bg-slate-800 z-20 pointer-events-none" style={`width: ${reductionPerc}%`}></div>
                    <div class="absolute top-0 left-0 h-full bg-red-900/60 z-10" style={`width: ${100 - reductionPerc}%`}></div>
                    <div class={`absolute top-0 left-0 h-full z-20 transition-all duration-500 ${healthPerc > 50 ? 'bg-green-600' : healthPerc > 25 ? 'bg-yellow-600' : 'bg-red-600'}`} style={`width: ${healthPerc}%`}></div>
                </div>
            </div>

            <button on:click={handleRest} class="p-2 bg-slate-800 rounded hover:bg-indigo-900/50 text-indigo-300 transition-colors" title="Descanso"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.moon}</svg></button>
        </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
     
    <!-- SIDEBAR -->
    <aside class="lg:col-span-3 space-y-4">
        <div class="grid grid-cols-2 gap-2">
            {#each character.attributes as attr}
                <div class="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                    <span class="text-[10px] uppercase text-slate-500 font-bold">{attr.name}</span>
                    <div class="text-xl font-bold text-white">{attr.value}</div>
                    <div class="text-xs text-indigo-400 font-mono">+{attr.value - 10}</div>
                </div>
            {/each}
        </div>

        <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-3">
            <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.shield}</svg> Defesa</span>
                <span class="text-xl font-bold text-white cursor-help border-b border-dotted border-slate-600" title={`Natural: ${character.naturalDefense} + Armadura/Escudos`}>{totalDefense}</span>
            </div>
            <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.zap}</svg> Speed</span>
                <span class="text-xl font-bold text-white">{character.speed}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.sword}</svg> Bonus Dmg</span>
                <div class="flex items-center gap-2">
                    <button on:click={() => character.bonusDamage = Math.max(0, character.bonusDamage - 1)} class="text-slate-500 hover:text-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.minus}</svg></button>
                    <span class="text-lg font-bold text-white font-mono">{character.bonusDamage}d6</span>
                    <button on:click={() => character.bonusDamage++} class="text-slate-500 hover:text-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.plus}</svg></button>
                </div>
            </div>
        </div>

        <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.languages}</svg> Idiomas</h4>
            <div class="flex flex-wrap gap-2 mb-2">
                {#each character.languages as lang, idx}
                    <div class="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 group">
                        {lang}
                        <button on:click={() => removeLanguage(idx)} class="text-slate-500 group-hover:text-red-400"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.x}</svg></button>
                    </div>
                {/each}
            </div>
            <input type="text" placeholder="Novo..." class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white" on:keydown={addLanguage} />
        </div>
    </aside>

    <!-- CONTENT -->
    <section class="lg:col-span-9">
        <div class="bg-slate-900 rounded-xl border border-slate-800 min-h-[60vh]">
            <nav class="flex bg-slate-950/50 border-b border-slate-800 overflow-x-auto no-scrollbar">
                <button on:click={() => activeTab = 'acoes'} class={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 ${activeTab === 'acoes' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.sword}</svg> AÇÕES</button>
                <button on:click={() => activeTab = 'magias'} class={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 ${activeTab === 'magias' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.book}</svg> MAGIAS</button>
                <button on:click={() => activeTab = 'talentos'} class={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 ${activeTab === 'talentos' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.zap}</svg> TALENTOS</button>
                <button on:click={() => activeTab = 'equipamento'} class={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 ${activeTab === 'equipamento' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.backpack}</svg> ITENS</button>
            </nav>

            <div class="p-4 md:p-6">
                <!-- AÇÕES -->
                {#if activeTab === 'acoes'}
                    <div class="space-y-4">
                        <h3 class="text-xs font-bold text-slate-500 uppercase">Ataques & Explosivos</h3>
                        {#each character.equipment.filter(i => (i.type === ITEM_TYPES.WEAPON && i.equippedState) || i.type === ITEM_TYPES.EXPLOSIVE) as item (item.id)}
                            {@const gripBanes = item.type === ITEM_TYPES.WEAPON && ((item.grip === GRIPS.ONE && item.equippedState === 'off') ? -1 : (item.grip === GRIPS.TWO && item.equippedState !== 'two') ? -2 : 0)}
                            {@const totalDice = (item.damageDice || 0) + (character.bonusDamage || 0)}
                            
                            <div class="flex flex-col sm:flex-row justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-900 transition-colors gap-4">
                                <div class="flex items-start gap-3">
                                    <div class="bg-slate-800 p-2 rounded text-slate-400 mt-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.sword}</svg></div>
                                    <div>
                                        <p class="font-bold text-white flex items-center gap-2">
                                            {item.name} 
                                            {#if item.equippedState}<span class="text-[10px] bg-indigo-900 text-indigo-200 px-1 rounded uppercase">{item.equippedState}</span>{/if}
                                        </p>
                                        <p class="text-xs text-slate-500">{item.traits} • {item.range}</p>
                                        {#if gripBanes < 0}<p class="text-xs text-red-400 font-bold">Grip Penalty: {gripBanes} Banes</p>{/if}
                                    </div>
                                </div>
                                
                                <div class="flex flex-col items-end gap-2">
                                    <div class="flex items-center gap-4 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                        <div class="text-center px-2">
                                            <span class="block text-[10px] font-bold text-slate-500 uppercase">Dano</span>
                                            <span class="text-xl font-mono text-white font-bold">{totalDice}d6</span>
                                        </div>
                                        {#if (item.boonsBanes || 0) + gripBanes !== 0}
                                            <div class="text-center px-2 border-l border-slate-700">
                                                <span class="block text-[10px] font-bold text-slate-500 uppercase">Mod</span>
                                                <span class={`text-xl font-mono font-bold ${(item.boonsBanes || 0) + gripBanes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {(item.boonsBanes || 0) + gripBanes > 0 ? '+' : ''}{(item.boonsBanes || 0) + gripBanes}
                                                </span>
                                            </div>
                                        {/if}
                                    </div>
                                    {#if item.type === ITEM_TYPES.EXPLOSIVE}
                                        <button on:click={() => useConsumable(item)} class="text-xs bg-red-900/50 text-red-200 px-3 py-1 rounded border border-red-800 hover:bg-red-900 flex items-center gap-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.bomb}</svg> Throw ({item.quantity})
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>

                <!-- MAGIAS -->
                {:else if activeTab === 'magias'}
                    <div class="space-y-6">
                        <div class="flex justify-between items-center"><h3 class="text-xs font-bold text-slate-500 uppercase">Grimório</h3><button on:click={() => openModal('spell')} class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.plus}</svg> Add</button></div>
                        {#each ['Novice', 'Expert', 'Master'] as tier}
                            {#if character.spells.some(s => s.tier === tier)}
                                <div>
                                    <h4 class="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2">{tier} Spells</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {#each character.spells.filter(s => s.tier === tier) as spell}
                                            <div class="p-4 bg-slate-950 rounded-lg border border-slate-800 group hover:border-slate-600">
                                                <div class="flex justify-between mb-2">
                                                    <div class="font-bold text-white">{spell.name} <span class="text-[10px] text-slate-500 font-normal ml-1">({spell.tradition})</span></div>
                                                    <button on:click={() => openModal('spell', spell)} class="text-slate-600 hover:text-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.edit}</svg></button>
                                                </div>
                                                <div class="text-xs text-slate-400 mb-3 line-clamp-2">{spell.description}</div>
                                                <div class="flex items-center justify-between bg-slate-900 p-2 rounded">
                                                    <span class="text-[10px] font-bold text-slate-500 uppercase">Castings</span>
                                                    <div class="flex items-center gap-2">
                                                        <span class={`text-sm font-mono font-bold ${spell.castings === 0 ? 'text-red-500' : 'text-white'}`}>{spell.castings}/{spell.maxCastings}</span>
                                                        <button on:click={() => castSpell(spell.id)} disabled={spell.castings === 0} class="bg-indigo-600 disabled:opacity-50 text-white text-[10px] px-2 py-1 rounded">CAST</button>
                                                    </div>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    </div>

                <!-- TALENTOS -->
                {:else if activeTab === 'talentos'}
                    <div class="space-y-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xs font-bold text-slate-500 uppercase">Talentos & Habilidades</h3>
                            <button on:click={() => openModal('talent')} class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.plus}</svg> Add</button>
                        </div>
                        <div class="grid grid-cols-1 gap-3">
                            {#each character.talents as talent}
                                <div class="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center gap-4 group hover:border-slate-600 transition-colors">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <h4 class="font-bold text-white flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500">{@html icons.zap}</svg> {talent.name}
                                            </h4>
                                            <button on:click={() => openModal('talent', talent)} class="text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.edit}</svg></button>
                                        </div>
                                        <p class="text-sm text-slate-400">{talent.description}</p>
                                    </div>
                                    {#if talent.maxUses}
                                        <div class="shrink-0 flex items-center gap-3 bg-slate-900 p-2 rounded border border-slate-800">
                                            <div class="text-center">
                                                <span class="block text-[10px] text-slate-500 uppercase font-bold">Usos</span>
                                                <span class={`font-mono font-bold ${talent.uses === 0 ? 'text-red-500' : 'text-white'}`}>{talent.uses}/{talent.maxUses}</span>
                                            </div>
                                            <button on:click={() => useTalent(talent.id)} disabled={talent.uses === 0} class="bg-slate-700 disabled:opacity-50 hover:bg-slate-600 text-white p-2 rounded"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.minus}</svg></button>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>

                <!-- ITENS -->
                {:else if activeTab === 'equipamento'}
                    <div class="space-y-4">
                        <div class="flex justify-between items-center"><h3 class="text-xs font-bold text-slate-500 uppercase">Inventário</h3><button on:click={() => openModal('item')} class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.plus}</svg> Novo Item</button></div>
                        <div class="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                           <table class="w-full text-sm text-left">
                              <thead class="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                                 <tr>
                                    <th class="p-3">Item</th>
                                    <th class="p-3">Tipo</th>
                                    <th class="p-3 text-center">Ações / Equipar</th>
                                    <th class="p-3 text-right">Qtd</th>
                                    <th class="p-3 w-8"></th>
                                 </tr>
                              </thead>
                              <tbody class="divide-y divide-slate-800 text-slate-300">
                                 {#each character.equipment as item}
                                    <tr class="hover:bg-slate-900/50">
                                       <td class="p-3">
                                          <div class="font-bold text-white">{item.name}</div>
                                          <div class="text-[10px] text-slate-500">
                                             {item.quality} • {item.availability} • {item.price}gc 
                                             {#if item.notes}<span class="block italic text-slate-400">{item.notes}</span>{/if}
                                             {#if item.type === ITEM_TYPES.ARMOR}<span> • Def {item.defenseFixed ? `Fixed ${item.defenseFixed}` : `+${item.defenseMod}`}</span>{/if}
                                          </div>
                                       </td>
                                       <td class="p-3"><span class="text-[10px] border border-slate-700 px-1 rounded uppercase bg-slate-900">{item.type}</span></td>
                                       <td class="p-3 text-center">
                                          {#if item.type === ITEM_TYPES.CONSUMABLE}
                                             <button on:click={() => useConsumable(item)} disabled={item.quantity <= 0} class="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600">Usar</button>
                                          {:else if item.type === ITEM_TYPES.ARMOR}
                                             <button on:click={() => equipItem(item)} class={`text-xs px-2 py-1 rounded border transition-colors ${item.equipped ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                                                {item.equipped ? 'Equipado' : 'Equipar'}
                                             </button>
                                          {:else if item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.SHIELD}
                                              <div class="flex justify-center gap-1">
                                                 {#if item.grip === GRIPS.TWO}
                                                    <button on:click={() => equipItem(item, item.equippedState ? null : 'two')} class={`text-[10px] px-2 py-1 rounded border ${item.equippedState === 'two' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>2H</button>
                                                 {:else}
                                                    {#if item.grip !== GRIPS.OFF}
                                                        <button on:click={() => equipItem(item, item.equippedState === 'main' ? null : 'main')} class={`text-[10px] px-2 py-1 rounded border ${item.equippedState === 'main' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>Main</button>
                                                    {/if}
                                                    <button on:click={() => equipItem(item, item.equippedState === 'off' ? null : 'off')} class={`text-[10px] px-2 py-1 rounded border ${item.equippedState === 'off' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>Off</button>
                                                 {/if}
                                              </div>
                                          {/if}
                                       </td>
                                       <td class="p-3 text-right font-mono">{item.quantity}</td>
                                       <td class="p-3">
                                          <button on:click={() => openModal('item', item)} class="text-slate-500 hover:text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html icons.edit}</svg></button>
                                       </td>
                                    </tr>
                                 {/each}
                              </tbody>
                           </table>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </section>
  </main>
</div>