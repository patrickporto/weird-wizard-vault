<script>
  import { onMount } from 'svelte';
  import { 
    Shield, Zap, Sword, Book, Backpack, Plus, Minus, Info, X, Moon, 
    Trash2, Edit, Skull, Languages, Bomb, Dices, Settings, History, 
    ChevronRight, ChevronLeft, Wand2, Calculator, Heart, Activity, 
    AlertTriangle, Flame, EyeOff, FileText, RotateCcw, Crosshair, 
    Coins, Clover, Clock, Play, Pause, FastForward, Rewind, 
    CheckSquare, Square, ChevronsRight, Eraser, Sparkles, Infinity as InfinityIcon 
  } from 'lucide-svelte';

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

  const DURATION_TYPES = {
      NEXT_ROLL: 'Próxima Rolagem',
      ROUNDS: 'Rodadas',
      MINUTES: 'Minutos',
      HOURS: 'Horas',
      DAYS: 'Dias',
      LUCK_ENDS: 'Sorte Encerra',
      PERMANENT: 'Indeterminado'
  };

  const ITEM_TYPES = {
    WEAPON: 'Weapon',
    ARMOR: 'Armor',
    SHIELD: 'Shield',
    CONSUMABLE: 'Consumable',
    EXPLOSIVE: 'Explosive',
    OTHER: 'Other'
  };

  const MOD_TYPES = {
      ADD: 'ADD',
      SET: 'SET',
      MULT: 'MULT'
  };

  const MOD_TARGETS = {
      str: 'Força',
      agi: 'Agilidade',
      int: 'Intelecto',
      wil: 'Vontade',
      defense: 'Defesa',
      speed: 'Deslocamento',
      health: 'Vida',
      damage: 'Dano (Dados)',
      boons: 'Boons/Banes'
  };

  const AFFLICTIONS_DATA = {
    "Blinded": { effect: "Make rolls with 3 banes. No sight reactions. Speed halved.", speedMult: 0.5, rollMod: -3 },
    "Confused": { effect: "No reactions. Intellect and Will rolls with 1 bane.", rollMod: -1, attributes: ['int', 'wil'] },
    "Controlled": { effect: "Controller decides your turn. Regard source as ally." },
    "Cursed": { effect: "Luck rolls with 1 bane." },
    "Deafened": { effect: "No hearing reactions. Immune to hearing effects." },
    "Frightened": { effect: "Attribute rolls with 1 bane (while in LOS). Grant 1 boon on rolls against you.", rollMod: -1 },
    "Held": { effect: "Speed 0. Cannot increase Speed. Auto-fail Agility defense rolls.", speedFixed: 0 },
    "Impaired": { effect: "Roll with 1 bane for specified attribute. Grant 1 boon against that attribute.", rollMod: -1 },
    "Incapacitated": { effect: "Damage equals or exceeds Health. You cannot use actions or reactions. Speed 0.", speedFixed: 0 },
    "On Fire": { effect: "Take 1d6 damage at end of round. Action/Luck roll to extinguish." },
    "Poisoned": { effect: "Attribute rolls with 1 bane. Grant 1 boon against you. Lose 1d6 Health end of round.", rollMod: -1 },
    "Prone": { effect: "No reactions. Grant 1 boon to melee vs you, impose 1 bane to ranged vs you." },
    "Slowed": { effect: "Speed drops to 2 (if higher). Cannot benefit from Speed increases.", speedCap: 2 },
    "Stunned": { effect: "No actions/reactions. Speed 0. Grant 2 boons against you. Attribute rolls with 2 banes.", speedFixed: 0, rollMod: -2 },
    "Unconscious": { effect: "No actions/reactions. Speed 0. Grant 3 boons against you. Auto-fail attribute rolls.", speedFixed: 0, autoFail: true },
    "Vulnerable": { effect: "Grant 1 boon on attacks/rolls against you." },
    "Weakened": { effect: "Strength/Agility rolls with 1 bane. Grant 1 boon vs Str/Agi. Speed halved.", speedMult: 0.5, attributes: ['str', 'agi'], rollMod: -1 }
  };

  const GRIPS = { OFF: 'Off', ONE: 'One', TWO: 'Two' };
  const AVAILABILITY = ['Common', 'Uncommon', 'Rare', 'Exotic'];
  const QUALITY = ['Standard', 'Inferior', 'Superior'];

  // --- ESTADO PRINCIPAL ---
  let activeTab = 'acoes';
  let modalState = { type: null, isOpen: false, data: null };
  let isHistoryOpen = false;
  let rollHistory = [];

  // Variáveis para formulários temporários (binds)
  let formData = {}; 
  let formEffectData = {};
  let formModifier = 0;
  let formSelectedEffects = [];

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
    currency: { gp: 0, sp: 0, cp: 0 },
    naturalDefense: 10,
    bonusDamage: 0,
    speed: 10,
    currentRound: 1,
    languages: ["Comum", "Élfico"],
    afflictions: [], 
    effects: [],
    notes: "", 
    spells: [
      { id: 1, name: "Seta de Energia", tier: "Novice", type: "Ataque", tradition: "Destruction", description: "Causa 1d6 de dano a um alvo em alcance curto.", castings: 3, maxCastings: 3, effect: null },
      { id: 2, name: "Escudo Mágico", tier: "Novice", type: "Utilidade", tradition: "Protection", description: "+2 em Defesa por 1 minuto.", castings: 2, maxCastings: 2, effect: {
          id: 999, name: "Escudo Mágico", duration: "MINUTES", roundsLeft: 10, initialRounds: 10, description: "+2 Defesa", isActive: true, 
          modifiers: [{ target: 'defense', type: MOD_TYPES.ADD, value: 2 }]
      }}
    ],
    talents: [
      { id: 1, name: "Sentido Arcano", description: "Você detecta magia a curto alcance.", uses: 0, maxUses: 0, isPassive: true, effect: null },
      { id: 2, name: "Sorte do Principiante", description: "Pode refazer um teste falho.", uses: 1, maxUses: 1, isPassive: false, effect: null }
    ],
    equipment: [
      { 
        id: 1, name: "Cajado", type: ITEM_TYPES.WEAPON, quantity: 1, price: 5, availability: 'Common', quality: 'Standard',
        grip: GRIPS.TWO, range: 'Melee', damageDice: 1, boonsBanes: 0, traits: "Finesse, Versatile",
        equippedState: null, equipped: false 
      },
      { 
        id: 2, name: "Poção de Cura", type: ITEM_TYPES.CONSUMABLE, quantity: 3, price: 10, availability: 'Common', quality: 'Standard',
        notes: "Recupera Healing Rate", equippedState: null, equipped: false 
      },
      { 
        id: 3, name: "Granada Alquímica", type: ITEM_TYPES.EXPLOSIVE, quantity: 2, price: 15, availability: 'Uncommon', quality: 'Standard',
        damageDice: 2, range: 'Short', traits: 'Blast', description: "Explode em área curta causando 2d6 de dano.", equippedState: null, equipped: false 
      },
      {
        id: 4, name: "Couro Batido", type: ITEM_TYPES.ARMOR, quantity: 1, price: 20, availability: 'Common', quality: 'Standard',
        defenseType: 'fixed', defenseFixed: 12, armorWeight: 'Light', equipped: false, equippedState: null
      }
    ]
  };

  let normalHealth = 24;
  let currentHealth = 24;
  let damage = 0;

  // --- REATIVIDADE E CÁLCULOS ---

  // Efeitos Ativos
  $: activeEffects = character.effects.filter(e => e.isActive);

  // Helper para stats derivados (equivalente ao getDerivedStat)
  function getDerivedStat(key, baseValue) {
      // Reage automaticamente a activeEffects devido ao sistema do Svelte
      let value = baseValue;
      const allMods = activeEffects.flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : []);

      // 1. SET
      const sets = allMods.filter(m => m.target === key && m.type === MOD_TYPES.SET);
      if (sets.length > 0) value = sets[sets.length - 1].value;

      // 2. ADD
      const adds = allMods.filter(m => m.target === key && m.type === MOD_TYPES.ADD);
      adds.forEach(m => { value += m.value; });

      // 3. MULT
      const mults = allMods.filter(m => m.target === key && m.type === MOD_TYPES.MULT);
      mults.forEach(m => { value *= m.value; });

      return Math.floor(value);
  }

  function getDamageBonus() {
      const allMods = activeEffects.flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : []);
      return allMods.filter(m => m.target === 'damage' && m.type === MOD_TYPES.ADD).reduce((acc, m) => acc + m.value, 0);
  }

  // Cálculos de Vida
  $: effectiveMaxHealth = getDerivedStat('health', currentHealth);
  $: tempHealth = Math.max(0, effectiveMaxHealth - normalHealth);
  $: damagePercentage = effectiveMaxHealth > 0 ? Math.min(100, (damage / effectiveMaxHealth) * 100) : 100;
  $: isIncapacitated = damage >= effectiveMaxHealth;
  $: isInjured = damage >= (effectiveMaxHealth / 2) && !isIncapacitated;

  // Lógica Automática de Aflição (Incapacitated)
  $: {
    const shouldBeIncapacitated = damage >= effectiveMaxHealth;
    const hasIncapTag = character.afflictions.includes("Incapacitated");

    if (shouldBeIncapacitated && !hasIncapTag) {
        character.afflictions = [...character.afflictions, "Incapacitated"];
    } else if (!shouldBeIncapacitated && hasIncapTag) {
        character.afflictions = character.afflictions.filter(a => a !== "Incapacitated");
    }
  }

  // Cálculos de Speed e Defesa
  $: effectiveSpeed = (() => {
    let s = getDerivedStat('speed', character.speed);
    const affs = character.afflictions;
    if (affs.includes("Held") || affs.includes("Stunned") || affs.includes("Unconscious") || affs.includes("Incapacitated")) return 0;
    if (affs.includes("Blinded") || affs.includes("Weakened")) s = Math.floor(s / 2);
    if (affs.includes("Slowed")) s = Math.min(s, 2);
    return Math.max(0, s);
  })();

  $: totalDefense = (() => {
    let defense = character.naturalDefense;
    let shieldBonus = 0;
    const equippedArmor = character.equipment.find(i => i.type === ITEM_TYPES.ARMOR && i.equipped);
    
    if (equippedArmor) {
      const fixedDef = equippedArmor.defenseFixed || 0;
      const modDef = character.naturalDefense + (equippedArmor.defenseMod || 0);
      if (equippedArmor.defenseFixed && equippedArmor.defenseMod) defense = Math.max(fixedDef, modDef);
      else if (equippedArmor.defenseFixed) defense = fixedDef; 
      else if (equippedArmor.defenseMod) defense = character.naturalDefense + equippedArmor.defenseMod;
    }

    character.equipment.filter(i => i.type === ITEM_TYPES.SHIELD && i.equippedState).forEach(shield => {
       shieldBonus += (shield.defenseMod || 0);
    });
    return getDerivedStat('defense', defense + shieldBonus);
  })();

  // --- FUNÇÕES DE AÇÃO ---

  function updateCurrency(type, amount) {
      let totalCp = (character.currency.gp * 100) + (character.currency.sp * 10) + character.currency.cp;
      let addCp = 0;
      if (type === 'gp') addCp = amount * 100;
      if (type === 'sp') addCp = amount * 10;
      if (type === 'cp') addCp = amount;
      totalCp += addCp;
      if (totalCp < 0) totalCp = 0; 
      
      character.currency.gp = Math.floor(totalCp / 100);
      const remainderGp = totalCp % 100;
      character.currency.sp = Math.floor(remainderGp / 10);
      character.currency.cp = remainderGp % 10;
  }

  function advanceRound(direction) {
      if (direction === 'next') {
          character.currentRound += 1;
          character.effects = character.effects.map(eff => {
              if (eff.isActive && eff.duration === 'ROUNDS' && eff.roundsLeft > 0) {
                  const remaining = eff.roundsLeft - 1;
                  return remaining <= 0 ? { ...eff, roundsLeft: 0, isActive: false } : { ...eff, roundsLeft: remaining };
              }
              return eff;
          });
      } else {
         character.currentRound = Math.max(1, character.currentRound - 1);
      }
  }

  function addToHistory(rollData) {
     const newRoll = {
        id: Date.now(),
        timestamp: new Date(),
        charName: character.name,
        ...rollData
     };
     rollHistory = [newRoll, ...rollHistory];
     isHistoryOpen = true;
  }

  function finalizeRoll(data, modifier, activeEffectsNames = []) {
      closeModal();
      
      const isAttack = data.type === 'weapon_attack';
      const isLuck = data.type === 'luck';
      const isDamage = data.type === 'weapon_damage';
      const sourceName = data.source.name || 'Ação';
      
      if (!isDamage) {
          const d20 = Math.floor(Math.random() * 20) + 1;
          let attrMod = 0;
          if (data.type === 'attribute') {
             const baseVal = getDerivedStat(data.source.key, data.source.value);
             attrMod = baseVal - 10;
          }
          
          let boonBaneTotal = 0;
          let boonBaneStr = '';
          
          if (modifier !== 0) {
              const numDice = Math.abs(modifier);
              let rolls = [];
              for(let i=0; i<numDice; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
              const highest = Math.max(...rolls);
              
              if (modifier > 0) {
                  boonBaneTotal = highest;
                  boonBaneStr = ` + ${highest}[Boon]`;
              } else {
                  boonBaneTotal = -highest;
                  boonBaneStr = ` - ${highest}[Bane]`;
              }
          }

          const total = d20 + attrMod + boonBaneTotal;
          let description = isAttack ? `Ataque (${modifier} boons/banes)` : isLuck ? `Teste de Sorte` : `Teste de ${sourceName}`;

          const hasTrait = (item, trait) => item.traits && item.traits.toLowerCase().includes(trait.toLowerCase());
          
          if (isAttack && d20 === 20) {
              const item = data.source;
              let critEffects = [];
              if (hasTrait(item, 'Bludgeoning')) critEffects.push("Vuln");
              if (hasTrait(item, 'Piercing')) critEffects.push("Weakened");
              if (hasTrait(item, 'Slashing')) critEffects.push("+1d6 Dmg");
              if (critEffects.length > 0) description += `\nCRÍTICO! ${critEffects.join(" ")}`;
          }

          addToHistory({
              source: isAttack ? 'Ataque' : isLuck ? 'Sorte' : 'Atributo',
              name: sourceName,
              description: description,
              formula: `d20(${d20})${attrMod !== 0 ? (attrMod > 0 ? '+' : '')+attrMod : ''}${boonBaneStr}`,
              total: total,
              crit: d20 === 20,
              effectsApplied: activeEffectsNames
          });

          // Consumir 'NEXT_ROLL' effects
          character.effects = character.effects.map(e => (e.isActive && e.duration === 'NEXT_ROLL') ? { ...e, isActive: false } : e);
      } 
      else {
          // Dano
          const item = data.source;
          const hasTrait = (i, t) => i.traits && i.traits.toLowerCase().includes(t.toLowerCase());
          let baseDice = (item.damageDice || 0);
          if (hasTrait(item, 'Versatile') && item.equippedState === 'two') baseDice += 1;
          let bonusDmg = (character.bonusDamage || 0);
          if (hasTrait(item, 'Light') && bonusDmg > 0) bonusDmg -= 1;
          bonusDmg += getDamageBonus();

          const totalDice = Math.max(0, baseDice + bonusDmg + modifier);
          let results = [];
          let sum = 0;
          for(let i=0; i<totalDice; i++) {
              let r = Math.floor(Math.random() * 6) + 1;
              if (r === 1 && hasTrait(item, 'Brutal')) r = Math.floor(Math.random() * 6) + 1;
              results.push(r);
              sum += r;
          }

          addToHistory({
              source: `Dano`,
              name: item.name,
              description: `Dano: ${totalDice}d6`,
              formula: `${totalDice}d6[${results.join(',')}]`,
              total: sum,
              effectsApplied: activeEffectsNames
          });
          
          if (item.type === ITEM_TYPES.EXPLOSIVE) useConsumable(item, true);
      }
  }

  // --- CRUD e AUXILIARES ---

  function openModal(type, data = null) {
      modalState = { type, isOpen: true, data };
      
      // Setup inicial de formulários baseado no tipo
      if (type === 'item') formData = data ? { ...data } : { name: '', type: ITEM_TYPES.OTHER, quantity: 1, price: 0, description: '', availability: 'Common', quality: 'Standard' };
      if (type === 'spell') formData = data ? { ...data } : { name: '', tier: 'Novice', tradition: 'Destruction', type: 'Attack', castings: 1, maxCastings: 1, description: '', effect: null };
      if (type === 'talent') formData = data ? { ...data } : { name: '', description: '', uses: 0, maxUses: 0, isPassive: false, effect: null };
      if (type === 'attribute') formData = { ...data }; // data é o atributo
      if (type === 'stat') formData = { val: data === 'speed' ? character.speed : character.naturalDefense, type: data };
      if (type === 'health') formData = { d: damage, nh: normalHealth, ch: currentHealth };
      if (type === 'character_info') formData = { 
          name: character.name, level: character.level, ancestry: character.ancestry,
          novicePath: character.paths.novice, expertPath: character.paths.expert, masterPath: character.paths.master,
          normalHealth: normalHealth, currentHealth: currentHealth
      };
      
      // Setup para Rolar Dados
      if (type === 'pre_roll') {
          formSelectedEffects = activeEffects.map(e => e.id);
          formModifier = 0; // Calculado reativamente no template ou função helper se necessário, simplificado aqui
      }

      // Setup para Efeitos
      if (type === 'effect') {
          if (data && data.parentType) {
              formEffectData = data.parentData.effect || { name: '', description: '', isActive: true, duration: 'ROUNDS', roundsLeft: 1, initialRounds: 1, modifiers: [] };
          } else if (data) {
              formEffectData = { ...data };
              // Migração simples de modifiers se não for array
              if (!Array.isArray(formEffectData.modifiers)) formEffectData.modifiers = [];
          } else {
              formEffectData = { name: '', description: '', isActive: true, duration: 'ROUNDS', roundsLeft: 1, initialRounds: 1, modifiers: [] };
          }
      }
  }

  function closeModal() {
      modalState = { type: null, isOpen: false, data: null };
      formData = {};
  }

  function saveItem() {
      const newItem = { ...formData, id: formData.id || Date.now() };
      if (modalState.data) {
          character.equipment = character.equipment.map(i => i.id === formData.id ? newItem : i);
      } else {
          character.equipment = [...character.equipment, newItem];
      }
      closeModal();
  }

  function deleteItem() {
      character.equipment = character.equipment.filter(i => i.id !== formData.id);
      closeModal();
  }

  function saveSpell() {
      const newSpell = { ...formData, id: formData.id || Date.now() };
      if (modalState.data) {
          character.spells = character.spells.map(s => s.id === formData.id ? newSpell : s);
      } else {
          character.spells = [...character.spells, newSpell];
      }
      closeModal();
  }

  function deleteSpell() {
      character.spells = character.spells.filter(s => s.id !== formData.id);
      closeModal();
  }

  function saveTalent() {
      const newTalent = { ...formData, id: formData.id || Date.now() };
      if (formData.isPassive) {
          newTalent.maxUses = 0;
          newTalent.uses = 0;
      } else if (!modalState.data && formData.maxUses > 0) {
          newTalent.uses = formData.maxUses;
      }
      
      if (modalState.data) {
          character.talents = character.talents.map(t => t.id === formData.id ? newTalent : t);
      } else {
          character.talents = [...character.talents, newTalent];
      }
      closeModal();
  }

  function deleteTalent() {
      character.talents = character.talents.filter(t => t.id !== formData.id);
      closeModal();
  }

  function saveEffect() {
      const effectData = formEffectData;
      const effectWithInitial = { 
        ...effectData, 
        initialRounds: effectData.duration === 'ROUNDS' ? effectData.roundsLeft : 0 
      };

      // Se estamos editando um efeito dentro de outro item (Magia/Talento)
      if (modalState.data?.parentType) {
          const updatedParent = { ...modalState.data.parentData, effect: effectWithInitial };
          // Reabre o modal pai
          openModal(modalState.data.parentType, updatedParent);
          return;
      }

      const newEffects = effectData.id && character.effects.some(e => e.id === effectData.id)
             ? character.effects.map(e => e.id === effectData.id ? effectWithInitial : e)
             : [...character.effects, { ...effectWithInitial, id: Date.now(), isActive: true }];
      character.effects = newEffects;
      closeModal();
  }

  function deleteEffect(id) {
      character.effects = character.effects.filter(e => e.id !== id);
  }

  function applyEffectToCharacter(effect, parentItem) {
      const effectName = effect.name || (parentItem ? parentItem.name : "Efeito sem nome");
      const effectDesc = effect.description || (parentItem ? parentItem.description : "");
      
      const newEffect = { 
          ...effect, 
          id: Date.now(), 
          isActive: true,
          name: effectName,
          description: effectDesc 
      };
      
      if (newEffect.duration === 'ROUNDS' && !newEffect.initialRounds) {
          newEffect.initialRounds = newEffect.roundsLeft;
      }

      character.effects = [...character.effects, newEffect];
  }

  // --- INTERAÇÕES ---

  function useConsumable(item, silent = false) {
      if (item.quantity > 0) {
          character.equipment = character.equipment.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i);
          if (!silent) addToHistory({ source: 'Consumível', name: item.name, description: `Usou ${item.name}` });
      }
  }

  function equipItem(item, state = null) {
      let newEquip = [...character.equipment];
      if (item.type === ITEM_TYPES.ARMOR) {
        newEquip = newEquip.map(i => {
          if (i.id === item.id) return { ...i, equipped: !i.equipped };
          if (i.type === ITEM_TYPES.ARMOR && item.type === ITEM_TYPES.ARMOR && !item.equipped) return { ...i, equipped: false };
          return i;
        });
      } else if (item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.SHIELD) {
        newEquip = newEquip.map(i => {
          if (i.id === item.id) return { ...i, equippedState: state };
          return i;
        });
      }
      character.equipment = newEquip;
  }

  function toggleAffliction(aff) {
      if (character.afflictions.includes(aff)) {
          character.afflictions = character.afflictions.filter(a => a !== aff);
      } else {
          character.afflictions = [...character.afflictions, aff];
      }
  }

  function addLanguage(e) {
      if (e.key === 'Enter' && e.target.value.trim() !== "") {
          character.languages = [...character.languages, e.target.value.trim()];
          e.target.value = '';
      }
  }

  function removeLanguage(index) {
      character.languages = character.languages.filter((_, i) => i !== index);
  }

  function confirmRest() {
      character.spells = character.spells.map(s => ({ ...s, castings: s.maxCastings }));
      character.talents = character.talents.map(t => ({ ...t, uses: t.maxUses }));
      damage = 0;
      currentHealth = normalHealth;
      closeModal();
  }

  function commitSpellCast(spell) {
      if (spell.castings > 0) {
          character.spells = character.spells.map(s => s.id === spell.id ? { ...s, castings: s.castings - 1 } : s);
          addToHistory({ source: 'Magia', name: spell.name, description: spell.description });
          closeModal();
      }
  }

  function commitTalentUse(talent) {
      if (talent.maxUses) {
          character.talents = character.talents.map(t => t.id === talent.id ? { ...t, uses: t.uses - 1 } : t);
      }
      addToHistory({ source: 'Talento', name: talent.name, description: talent.description });
      closeModal();
  }

  function recoverTalent(id) {
      character.talents = character.talents.map(t => t.id === id && t.uses < t.maxUses ? { ...t, uses: t.uses + 1 } : t);
  }

  function checkLuckEnds(effId) {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const success = d20 >= 10;
      addToHistory({ source: 'Sorte', name: 'Check Fim Efeito', description: `Rolou ${d20}. ${success ? 'Sucesso (Encerra)' : 'Falha'}` });
      if (success) {
          character.effects = character.effects.map(e => e.id === effId ? { ...e, isActive: false } : e);
      }
  }

  function saveAttribute() {
      character.attributes = character.attributes.map(a => a.key === formData.key ? { ...a, value: parseInt(formData.value) } : a);
      closeModal();
  }

  function saveHealth() {
      damage = Math.max(0, parseInt(formData.d));
      normalHealth = Math.max(1, parseInt(formData.nh));
      currentHealth = Math.max(0, parseInt(formData.ch));
      closeModal();
  }
  
  function saveCharacterInfo() {
      character.name = formData.name;
      character.level = parseInt(formData.level) || 0;
      character.ancestry = formData.ancestry;
      character.paths = { novice: formData.novicePath, expert: formData.expertPath, master: formData.masterPath };
      normalHealth = parseInt(formData.normalHealth);
      currentHealth = parseInt(formData.currentHealth);
      closeModal();
  }

</script>

<div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 relative overflow-x-hidden">
  
  <!-- HISTORY SIDEBAR -->
  {#if isHistoryOpen}
    <div class="fixed inset-0 bg-black/50 z-[90] lg:hidden backdrop-blur-sm" on:click={() => isHistoryOpen = false}></div>
  {/if}
  
  <aside class="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 z-[100] transition-transform duration-300 shadow-2xl flex flex-col {isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}">
    <div class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
      <h3 class="font-bold text-white flex items-center gap-2"><History size={18}/> Histórico</h3>
      <button on:click={() => isHistoryOpen = false} class="text-slate-400 hover:text-white"><X size={20}/></button>
    </div>
    <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
      {#if rollHistory.length === 0}
        <div class="text-center text-slate-500 text-sm mt-10 italic">Nenhuma rolagem.</div>
      {/if}
      {#each rollHistory as roll (roll.id)}
        <div class="bg-slate-800 rounded-lg border border-slate-700 p-3 shadow-sm animate-in slide-in-from-right-4">
           <div class="flex justify-between items-start mb-1">
              <span class="text-[10px] text-slate-400 uppercase font-bold">{roll.source}</span>
              <span class="text-[10px] text-slate-500">{new Date(roll.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
           </div>
           <div class="font-bold text-white mb-1">{roll.name}</div>
           {#if roll.description}<div class="text-xs text-slate-400 italic mb-2 whitespace-pre-wrap">{roll.description}</div>{/if}
           {#if roll.effectsApplied?.length > 0}
               <div class="flex flex-wrap gap-1 mb-2">
                   {#each roll.effectsApplied as eff}
                       <span class="text-[9px] bg-indigo-900/50 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-800/50">{eff}</span>
                   {/each}
               </div>
           {/if}
           {#if roll.formula || roll.total !== undefined}
               <div class="bg-slate-900 rounded p-2 flex justify-between items-center">
                  <div class="text-xs font-mono text-slate-400">{roll.formula}</div>
                  <div class="text-xl font-bold font-mono {roll.crit ? 'text-yellow-400' : 'text-white'}">{roll.total}</div>
               </div>
           {/if}
        </div>
      {/each}
    </div>
    <div class="p-4 border-t border-slate-700 bg-slate-950">
       <button on:click={() => rollHistory = []} class="w-full py-2 text-xs font-bold text-red-400 hover:text-red-300 border border-red-900/50 rounded hover:bg-red-900/20 flex items-center justify-center gap-2"><Trash2 size={14}/> Limpar</button>
    </div>
  </aside>

  <!-- MODAL GERAL -->
  {#if modalState.isOpen}
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div class="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div class="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h3 class="font-bold text-lg text-white flex items-center gap-2">
            {#if modalState.type === 'item'}Editor de Item
            {:else if modalState.type === 'spell'}Grimório
            {:else if modalState.type === 'talent'}Talento
            {:else if modalState.type === 'effect'}Gerenciar Efeito
            {:else if modalState.type === 'pre_roll'}Confirmar Rolagem
            {:else}Info
            {/if}
          </h3>
          <button on:click={closeModal} class="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div class="p-6 overflow-y-auto custom-scrollbar">
            <!-- CONTEÚDO DO MODAL BASEADO NO TIPO -->
            
            {#if modalState.type === 'item'}
                <div class="space-y-3">
                    <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold" placeholder="Nome" bind:value={formData.name} />
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
                        {#if modalState.data}<button on:click={deleteItem} class="bg-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded"><Trash2 size={18}/></button>{/if}
                        <button on:click={saveItem} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                    </div>
                </div>

            {:else if modalState.type === 'spell'}
                <div class="space-y-3">
                    <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold" placeholder="Nome" bind:value={formData.name} />
                    <div class="grid grid-cols-2 gap-2">
                        <select class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" bind:value={formData.tier}>
                             {#each ['Novice', 'Expert', 'Master'] as t}<option value={t}>{t}</option>{/each}
                        </select>
                        <select class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" bind:value={formData.tradition}>
                             {#each MAGIC_TRADITIONS as t}<option value={t}>{t}</option>{/each}
                        </select>
                    </div>
                    <div class="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                        <label class="text-xs text-slate-400 uppercase">Castings</label>
                        <input type="number" class="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-white text-center" bind:value={formData.maxCastings} on:input={() => formData.castings = formData.maxCastings} />
                    </div>
                    <div class="bg-slate-900 p-2 rounded border border-slate-700 flex justify-between items-center">
                         <span class="text-xs text-slate-400 font-bold uppercase">Efeito Associado</span>
                         <button on:click={() => openModal('effect', { parentType: 'spell', parentData: formData })} class="text-[10px] px-2 py-1 rounded border {formData.effect ? 'bg-indigo-900 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-600 text-slate-500'}">
                             {formData.effect ? 'Configurado' : 'Nenhum'}
                         </button>
                    </div>
                    <textarea class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" rows={4} placeholder="Descrição" bind:value={formData.description}></textarea>
                    <div class="flex gap-2">
                        {#if modalState.data}<button on:click={deleteSpell} class="bg-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded"><Trash2 size={18}/></button>{/if}
                        <button on:click={saveSpell} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                    </div>
                </div>

            {:else if modalState.type === 'talent'}
                <div class="space-y-3">
                    <input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold" placeholder="Nome" bind:value={formData.name} />
                    <div class="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                         <input type="checkbox" id="isPassive" bind:checked={formData.isPassive} class="w-4 h-4 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                         <label for="isPassive" class="text-xs text-slate-400 uppercase font-bold flex-1 cursor-pointer">Passivo / Ilimitado</label>
                         {#if !formData.isPassive}
                            <div class="flex items-center gap-2 border-l border-slate-700 pl-2">
                                <label class="text-xs text-slate-400 uppercase">Max Uses</label>
                                <input type="number" class="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-white text-center" bind:value={formData.maxUses} />
                            </div>
                         {/if}
                    </div>
                    <div class="bg-slate-900 p-2 rounded border border-slate-700 flex justify-between items-center">
                         <span class="text-xs text-slate-400 font-bold uppercase">Efeito Associado</span>
                         <button on:click={() => openModal('effect', { parentType: 'talent', parentData: formData })} class="text-[10px] px-2 py-1 rounded border {formData.effect ? 'bg-indigo-900 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-600 text-slate-500'}">
                             {formData.effect ? 'Configurado' : 'Nenhum'}
                         </button>
                    </div>
                    <textarea class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" rows={4} placeholder="Descrição" bind:value={formData.description}></textarea>
                    <div class="flex gap-2">
                        {#if modalState.data}<button on:click={deleteTalent} class="bg-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded"><Trash2 size={18}/></button>{/if}
                        <button on:click={saveTalent} class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                    </div>
                </div>

            {:else if modalState.type === 'effect'}
                <div class="space-y-4">
                    {#if !modalState.data?.parentType}
                        <div><label class="text-xs font-bold text-slate-400 uppercase">Nome</label><input class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formEffectData.name} /></div>
                    {:else}
                         <div class="text-center text-xs text-slate-500 italic mb-2">Nome e Descrição herdados do item pai.</div>
                    {/if}
                    <div><label class="text-xs font-bold text-slate-400 uppercase">Duração</label>
                        <div class="grid grid-cols-2 gap-2">
                            <select class="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" bind:value={formEffectData.duration}>
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
                            <button on:click={() => formEffectData.modifiers = [...formEffectData.modifiers, { target: 'str', type: MOD_TYPES.ADD, value: 1 }]} class="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600 flex items-center gap-1"><Plus size={10}/> Add</button>
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
                                    <button on:click={() => formEffectData.modifiers = formEffectData.modifiers.filter((_, i) => i !== idx)} class="text-slate-600 hover:text-red-400 p-1"><Trash2 size={12}/></button>
                                </div>
                            {/each}
                        </div>
                    </div>
                    {#if !modalState.data?.parentType}
                         <div><label class="text-xs font-bold text-slate-400 uppercase">Descrição</label><textarea class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formEffectData.description}></textarea></div>
                    {/if}
                    <button on:click={saveEffect} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar Efeito</button>
                </div>

            {:else if modalState.type === 'attribute'}
                <div class="space-y-4">
                    <h3 class="text-white font-bold text-lg">{formData.name}</h3>
                    <div><label class="text-xs text-slate-400 uppercase font-bold">Valor Base</label><input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.value} /></div>
                    <button on:click={saveAttribute} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Salvar</button>
                </div>

            {:else if modalState.type === 'health'}
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-xs text-slate-400 uppercase font-bold">Vida Normal</label><input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.nh} /></div>
                        <div><label class="text-xs text-slate-400 uppercase font-bold">Vida Atual</label><input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.ch} /></div>
                    </div>
                    <div><label class="text-xs text-red-400 uppercase font-bold">Dano</label><input type="number" class="w-full bg-slate-900 border border-red-900/50 rounded p-2 text-white" bind:value={formData.d} /></div>
                    <button on:click={saveHealth} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Atualizar</button>
                </div>

            {:else if modalState.type === 'pre_roll'}
                <div class="space-y-4">
                    <h3 class="text-center font-bold text-white uppercase mb-2">Rolagem</h3>
                    <!-- Selectable effects -->
                    {#if activeEffects.length > 0 || character.afflictions.length > 0}
                        <div class="bg-slate-900 p-2 rounded border border-slate-700 max-h-40 overflow-y-auto">
                             {#each character.afflictions as aff}
                                 <div class="flex items-center gap-2 text-xs text-red-300"><AlertTriangle size={10}/> {aff}</div>
                             {/each}
                             {#each activeEffects as eff}
                                 <button class="flex items-center gap-2 text-xs p-1 w-full text-left {formSelectedEffects.includes(eff.id) ? 'bg-indigo-900/50 text-white' : 'text-slate-500'}" on:click={() => formSelectedEffects.includes(eff.id) ? formSelectedEffects = formSelectedEffects.filter(id => id !== eff.id) : formSelectedEffects = [...formSelectedEffects, eff.id]}>
                                     {#if formSelectedEffects.includes(eff.id)}
                                         <CheckSquare size={12}/>
                                     {:else}
                                         <Square size={12}/>
                                     {/if}
                                     {eff.name}
                                 </button>
                             {/each}
                        </div>
                    {/if}
                    <div class="bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
                        <div class="flex justify-center items-center gap-6 mb-2">
                             <button on:click={() => formModifier--} class="w-12 h-12 rounded-full bg-slate-800 hover:bg-red-900 flex items-center justify-center text-slate-300 hover:text-white border border-slate-700"><Minus size={24}/></button>
                             <span class="text-4xl font-bold {formModifier > 0 ? 'text-green-400' : formModifier < 0 ? 'text-red-400' : 'text-slate-500'}">{formModifier > 0 ? '+' : ''}{formModifier}</span>
                             <button on:click={() => formModifier++} class="w-12 h-12 rounded-full bg-slate-800 hover:bg-green-900 flex items-center justify-center text-slate-300 hover:text-white border border-slate-700"><Plus size={24}/></button>
                        </div>
                        <div class="text-xs text-slate-500">{modalState.data.type === 'weapon_damage' ? 'Dados Extras' : 'Boons/Banes'}</div>
                    </div>
                    <button on:click={() => finalizeRoll(modalState.data, formModifier, activeEffects.filter(e => formSelectedEffects.includes(e.id)).map(e => e.name))} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Dices size={24} /> ROLAR</button>
                </div>

            {:else if modalState.type === 'weapon_menu'}
                <div class="space-y-4 text-center">
                    <h3 class="text-xl font-bold text-white mb-2">{modalState.data.name}</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <button on:click={() => openModal('pre_roll', { type: 'weapon_attack', source: modalState.data })} class="flex flex-col items-center justify-center p-6 bg-slate-700 hover:bg-indigo-600 rounded-xl border border-slate-600 transition-colors"><Crosshair size={32} class="mb-2 text-indigo-300"/><span class="font-bold text-white">ATAQUE</span></button>
                        <button on:click={() => openModal('pre_roll', { type: 'weapon_damage', source: modalState.data })} class="flex flex-col items-center justify-center p-6 bg-slate-700 hover:bg-red-600 rounded-xl border border-slate-600 transition-colors"><Sword size={32} class="mb-2 text-red-300"/><span class="font-bold text-white">DANO</span></button>
                    </div>
                </div>

            {:else if modalState.type === 'character_info'}
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

            {:else if modalState.type === 'confirm_spell' || modalState.type === 'confirm_talent'}
                <div class="space-y-4 text-center">
                    <h3 class="text-white font-bold text-lg">Confirmar Uso</h3>
                    <div class="bg-slate-900 p-3 rounded border border-slate-700 text-left">
                        <p class="text-indigo-300 font-bold text-xl mb-1 text-center">{modalState.data.name}</p>
                        <p class="text-slate-400 text-sm italic mb-2 text-center">{modalState.data.description}</p>
                        {#if modalState.data.effect}
                            <div class="mt-4 border-t border-slate-700 pt-3">
                                <div class="flex items-center gap-2 mb-2 text-xs font-bold text-green-400 uppercase"><Sparkles size={12}/> Efeito Associado</div>
                                <button on:click={() => { applyEffectToCharacter(modalState.data.effect, modalState.data); if(modalState.type === 'confirm_spell') commitSpellCast(modalState.data); else commitTalentUse(modalState.data); }} class="w-full bg-green-900/50 hover:bg-green-800 text-green-200 border border-green-700 p-2 rounded text-xs font-bold flex items-center justify-center gap-2">APLICAR EFEITO E CONFIRMAR</button>
                            </div>
                        {/if}
                    </div>
                    <div class="flex gap-4 justify-center">
                         <button on:click={closeModal} class="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white">Cancelar</button>
                         <button on:click={() => modalState.type === 'confirm_spell' ? commitSpellCast(modalState.data) : commitTalentUse(modalState.data)} class="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Confirmar</button>
                    </div>
                </div>

            {:else if modalState.type === 'affliction'}
                <div class="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                    {#each Object.keys(AFFLICTIONS_DATA).sort() as aff}
                        <button on:click={() => toggleAffliction(aff)} class="p-2 rounded border text-xs text-left transition-colors {character.afflictions.includes(aff) ? 'bg-red-900 border-red-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}">
                            <div class="font-bold mb-1">{aff}</div>
                            <div class="text-[9px] opacity-70 line-clamp-2">{AFFLICTIONS_DATA[aff].effect}</div>
                        </button>
                    {/each}
                </div>

            {:else if modalState.type === 'rest_confirm'}
                <div class="text-center space-y-6">
                    <div class="flex justify-center"><Moon size={48} class="text-indigo-400" /></div>
                    <div><p class="text-lg text-white font-bold">Realizar Descanso?</p></div>
                    <div class="flex gap-4 justify-center"><button on:click={closeModal} class="px-6 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold">Cancelar</button><button on:click={confirmRest} class="px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Descansar</button></div>
                </div>

            {:else if modalState.type === 'cast_spell'}
                 <div class="space-y-2 max-h-60 overflow-y-auto">
                     {#each character.spells as spell}
                         <button on:click={() => openModal('confirm_spell', spell)} disabled={spell.castings === 0} class="w-full text-left p-2 bg-slate-900 border border-slate-700 rounded hover:bg-indigo-900/30 flex justify-between disabled:opacity-50">
                             <span class="text-white font-bold">{spell.name}</span>
                             <span class="text-xs font-mono {spell.castings > 0 ? 'text-green-400' : 'text-red-400'}">{spell.castings}/{spell.maxCastings}</span>
                         </button>
                     {/each}
                 </div>

            {:else if modalState.type === 'select_talent'}
                 <div class="space-y-2 max-h-60 overflow-y-auto">
                     {#each character.talents as talent}
                         <button on:click={() => openModal('confirm_talent', talent)} disabled={!talent.isPassive && talent.maxUses > 0 && talent.uses === 0} class="w-full text-left p-2 bg-slate-900 border border-slate-700 rounded hover:bg-yellow-900/30 flex justify-between disabled:opacity-50">
                             <span class="text-white font-bold">{talent.name}</span>
                             {#if talent.isPassive}<span class="text-xs text-slate-500 flex items-center gap-1"><InfinityIcon size={12}/> Passivo</span>
                             {:else}<span class="text-xs font-mono {talent.uses > 0 ? 'text-green-400' : 'text-red-400'}">{talent.uses}/{talent.maxUses}</span>{/if}
                         </button>
                     {/each}
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
          <div class="flex items-center gap-3 group relative">
             <div class="w-12 h-12 bg-indigo-600 rounded-full border border-slate-500 flex items-center justify-center text-xl font-bold">{character.name.charAt(0)}</div>
             <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-lg font-bold text-white leading-none">{character.name}</h1>
                    <button on:click={() => openModal('character_info')} class="text-slate-500 hover:text-white transition-colors"><Settings size={14}/></button>
                </div>
                <p class="text-slate-400 text-xs">Lvl {character.level} • {character.paths.novice} {character.paths.expert && `• ${character.paths.expert}`}</p>
             </div>
          </div>

          <!-- Health Bar -->
          <div class="flex-1 w-full md:max-w-md cursor-pointer group" on:click={() => openModal('health')} role="button" tabindex="0">
             <div class="flex justify-between text-xs mb-1 px-1">
                <span class="font-bold uppercase {isIncapacitated ? 'text-red-500 animate-pulse' : isInjured ? 'text-yellow-500' : 'text-green-500'}">
                   {isIncapacitated ? "Incapacitado" : isInjured ? "Ferido" : tempHealth > 0 ? "Vigoroso" : "Saudável"}
                </span>
                <span class="text-slate-400 font-mono flex items-center gap-1">
                  <span class="text-red-400">{damage} Dano</span> / <span class="text-white">{effectiveMaxHealth} Vida</span>
                  {#if tempHealth > 0}<span class="text-[10px] text-cyan-400">(+{tempHealth} Temp)</span>{/if}
                </span>
             </div>
             <div class="h-4 w-full bg-slate-950 rounded border border-slate-700 relative overflow-hidden {tempHealth > 0 ? 'shadow-[0_0_8px_rgba(34,211,238,0.3)] border-cyan-500/30' : ''}">
                <div class="absolute top-0 left-0 h-full w-full bg-green-900/30"></div>
                <div class="absolute top-0 left-0 h-full bg-red-600 transition-all duration-500 z-10" style="width: {damagePercentage}%"></div>
                {#if tempHealth > 0}<div class="absolute top-0 left-0 w-full h-full z-20 bg-cyan-400/10 pointer-events-none animate-pulse"></div>{/if}
             </div>
          </div>

          <div class="flex gap-2">
             <button on:click={() => openModal('rest_confirm')} class="p-2 bg-slate-800 rounded hover:bg-indigo-900/50 text-indigo-300 transition-colors" title="Descanso"><Moon size={18}/></button>
             <button on:click={() => isHistoryOpen = !isHistoryOpen} class="p-2 bg-slate-800 rounded hover:bg-indigo-900/50 text-indigo-300 transition-colors relative" title="Histórico">
                <Dices size={18}/>
                {#if rollHistory.length > 0}<span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>{/if}
             </button>
          </div>
       </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
     
     <!-- SIDEBAR ESQUERDA -->
     <aside class="lg:col-span-3 space-y-4">
        <div class="grid grid-cols-2 gap-2">
           {#each character.attributes as attr}
              <div on:click={() => openModal('pre_roll', {type:'attribute', source: attr})} class="bg-slate-900 p-2 rounded border border-slate-800 text-center cursor-pointer hover:bg-slate-800 transition-colors group relative">
                 <span class="text-[10px] uppercase text-slate-500 font-bold group-hover:text-indigo-400 transition-colors">{attr.name}</span>
                 <div class="text-xl font-bold text-white flex justify-center items-center gap-1">
                     {getDerivedStat(attr.key, attr.value)}
                     {#if getDerivedStat(attr.key, attr.value) !== attr.value}
                         <span class="text-[10px] ml-1 {getDerivedStat(attr.key, attr.value) > attr.value ? 'text-green-400' : 'text-red-400'}">
                             ({getDerivedStat(attr.key, attr.value) > attr.value ? '+' : ''}{getDerivedStat(attr.key, attr.value) - attr.value})
                         </span>
                     {/if}
                 </div>
                 <div class="text-xs text-indigo-400 font-mono">+{ getDerivedStat(attr.key, attr.value) - 10}</div>
                 <button on:click|stopPropagation={() => openModal('attribute', attr)} class="absolute top-1 right-1 text-slate-600 hover:text-white"><Edit size={10} /></button>
              </div>
           {/each}
        </div>

        <button on:click={() => openModal('pre_roll', {type:'luck', source: {name:'Sorte'}})} class="w-full bg-slate-900 hover:bg-slate-800 p-3 rounded-xl border border-slate-800 flex items-center justify-between group transition-colors">
            <div class="flex items-center gap-2 font-bold text-slate-400 group-hover:text-green-400 uppercase text-xs"><Clover size={14}/> Teste de Sorte</div><ChevronRight size={14} class="text-slate-600"/>
        </button>

        <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-3">
           <div on:click={() => openModal('stat', 'defense')} class="flex justify-between items-center border-b border-slate-800 pb-2 cursor-pointer hover:bg-slate-800/50 rounded px-1 -mx-1 transition-colors">
              <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Shield size={14}/> Defesa</span>
              <span class="text-xl font-bold text-white cursor-help border-b border-dotted border-slate-600" title={`Natural + Armadura + Escudos + Efeitos`}>{totalDefense}</span>
           </div>
           <div on:click={() => openModal('stat', 'speed')} class="flex justify-between items-center border-b border-slate-800 pb-2 cursor-pointer hover:bg-slate-800/50 rounded px-1 -mx-1 transition-colors">
              <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Zap size={14}/> Speed</span>
              <div class="flex flex-col items-end">
                 <span class="text-xl font-bold {effectiveSpeed < character.speed ? 'text-red-400' : 'text-white'}">{effectiveSpeed}</span>
                 {#if effectiveSpeed < character.speed}<span class="text-[10px] text-red-500 leading-none">Reduzido</span>{/if}
              </div>
           </div>
           <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Sword size={14}/> Bonus Dmg</span>
              <div class="flex items-center gap-2">
                 <button on:click={() => character.bonusDamage = Math.max(0, character.bonusDamage - 1)} class="text-slate-500 hover:text-white"><Minus size={12}/></button>
                 <span class="text-lg font-bold text-white font-mono">{character.bonusDamage}d6</span>
                 <button on:click={() => character.bonusDamage += 1} class="text-slate-500 hover:text-white"><Plus size={12}/></button>
              </div>
           </div>
        </div>

        <!-- CURRENCY -->
        <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
           <div class="flex justify-between items-center mb-2"><h4 class="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Coins size={12}/> Moedas</h4></div>
           <div class="grid grid-cols-3 gap-2 text-center">
               <div class="bg-slate-950 rounded p-1 border border-slate-800"><div class="text-[9px] text-yellow-500 font-bold uppercase">GP</div><div class="flex items-center justify-between px-1"><button on:click={()=>updateCurrency('gp',-1)} class="text-slate-600 hover:text-red-400"><Minus size={10}/></button><span class="text-white font-mono text-sm">{character.currency.gp}</span><button on:click={()=>updateCurrency('gp',1)} class="text-slate-600 hover:text-green-400"><Plus size={10}/></button></div></div>
               <div class="bg-slate-950 rounded p-1 border border-slate-800"><div class="text-[9px] text-slate-300 font-bold uppercase">SP</div><div class="flex items-center justify-between px-1"><button on:click={()=>updateCurrency('sp',-1)} class="text-slate-600 hover:text-red-400"><Minus size={10}/></button><span class="text-white font-mono text-sm">{character.currency.sp}</span><button on:click={()=>updateCurrency('sp',1)} class="text-slate-600 hover:text-green-400"><Plus size={10}/></button></div></div>
               <div class="bg-slate-950 rounded p-1 border border-slate-800"><div class="text-[9px] text-orange-700 font-bold uppercase">CP</div><div class="flex items-center justify-between px-1"><button on:click={()=>updateCurrency('cp',-1)} class="text-slate-600 hover:text-red-400"><Minus size={10}/></button><span class="text-white font-mono text-sm">{character.currency.cp}</span><button on:click={()=>updateCurrency('cp',1)} class="text-slate-600 hover:text-green-400"><Plus size={10}/></button></div></div>
           </div>
        </div>

        <!-- LANGUAGES -->
        <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div class="flex justify-between items-center mb-2"><h4 class="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Languages size={12}/> Idiomas</h4></div>
            <div class="flex flex-wrap gap-1 mb-2">
                {#each character.languages as lang, idx}
                    <span class="bg-slate-950 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 group cursor-default">
                        {lang}
                        <button on:click={() => removeLanguage(idx)} class="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                    </span>
                {/each}
            </div>
            <div class="relative">
                <input type="text" placeholder="Novo..." class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-indigo-500" on:keydown={addLanguage} />
                <Plus size={12} class="absolute right-2 top-1.5 text-slate-600 pointer-events-none"/>
            </div>
        </div>

        <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
           <div class="flex justify-between items-center mb-2">
              <h4 class="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Activity size={12}/> Aflições</h4>
              <button on:click={() => openModal('affliction')} class="text-slate-500 hover:text-white"><Plus size={14}/></button>
           </div>
           <div class="flex flex-wrap gap-2">
              {#if character.afflictions.length === 0}<span class="text-xs text-slate-500 italic">Nenhuma aflição ativa.</span>{/if}
              {#each character.afflictions as aff}
                  <div class="group relative">
                       <div class="text-xs bg-red-900/30 border border-red-700 text-red-200 px-2 py-1 rounded flex items-center gap-1 cursor-help">
                          {aff}<button on:click|stopPropagation={() => toggleAffliction(aff)} class="ml-1 text-red-400 hover:text-white"><X size={10}/></button>
                       </div>
                  </div>
              {/each}
           </div>
        </div>
     </aside>

     <!-- MAIN CONTENT -->
     <section class="lg:col-span-9">
        <div class="bg-slate-900 rounded-xl border border-slate-800 min-h-[60vh]">
           <nav class="flex bg-slate-950/50 border-b border-slate-800 overflow-x-auto no-scrollbar">
              <button on:click={() => activeTab = 'acoes'} class="px-4 lg:px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 {activeTab === 'acoes' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}"><Sword size={16} /> AÇÕES</button>
              <button on:click={() => activeTab = 'magias'} class="px-4 lg:px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 {activeTab === 'magias' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}"><Book size={16} /> MAGIAS</button>
              <button on:click={() => activeTab = 'efeitos'} class="px-4 lg:px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 {activeTab === 'efeitos' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}"><Activity size={16} /> EFEITOS</button>
              <button on:click={() => activeTab = 'talentos'} class="px-4 lg:px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 {activeTab === 'talentos' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}"><Zap size={16} /> TALENTOS</button>
              <button on:click={() => activeTab = 'equipamento'} class="px-4 lg:px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 {activeTab === 'equipamento' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}"><Backpack size={16} /> ITENS</button>
              <button on:click={() => activeTab = 'notas'} class="px-4 lg:px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap border-b-2 {activeTab === 'notas' ? 'text-indigo-400 border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}"><FileText size={16} /> NOTAS</button>
           </nav>

           <div class="p-4 md:p-6">
              {#if activeTab === 'acoes'}
                 <div class="space-y-4">
                    {#each character.equipment.filter(i => (i.type === ITEM_TYPES.WEAPON && i.equippedState) || i.type === ITEM_TYPES.EXPLOSIVE) as item}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div on:click={() => openModal('weapon_menu', item)} class="flex flex-col sm:flex-row justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-900 cursor-pointer transition-colors gap-4 active:scale-[0.99]">
                            <div class="flex items-start gap-3">
                                <div class="bg-slate-800 p-2 rounded text-slate-400 mt-1"><Sword size={20}/></div>
                                <div><p class="font-bold text-white flex items-center gap-2">{item.name} {#if item.equippedState}<span class="text-[10px] bg-indigo-900 text-indigo-200 px-1 rounded uppercase">{item.equippedState}</span>{/if}</p><p class="text-xs text-slate-500">{item.traits || '-'} • {item.range || '-'}</p></div>
                            </div>
                            <div class="flex flex-col items-end gap-2">
                                <div class="flex items-center gap-4 bg-slate-900 p-2 rounded-lg border border-slate-800"><div class="text-center px-2"><span class="block text-[10px] font-bold text-slate-500 uppercase">Dano</span><span class="text-xl font-mono text-white font-bold">{item.damageDice || 0}d6</span></div></div>
                                {#if item.type === ITEM_TYPES.EXPLOSIVE}<button on:click|stopPropagation={() => useConsumable(item)} class="text-xs bg-red-900/50 text-red-200 px-3 py-1 rounded border border-red-800 hover:bg-red-900 flex items-center gap-1"><Bomb size={12}/> Throw ({item.quantity})</button>{/if}
                            </div>
                        </div>
                    {/each}
                    {#if character.spells.length > 0}
                        <div on:click={() => openModal('cast_spell')} class="flex flex-col sm:flex-row items-center p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-500 cursor-pointer transition-colors gap-4 group">
                            <div class="flex items-start gap-3 w-full"><div class="bg-indigo-900/50 p-2 rounded text-indigo-300 mt-1"><Wand2 size={20}/></div><div><p class="font-bold text-white flex items-center gap-2 group-hover:text-indigo-300 transition-colors">Conjurar Magia</p><p class="text-xs text-slate-500">Selecione uma magia do grimório para lançar.</p></div></div>
                            <div class="ml-auto"><div class="bg-slate-900 px-3 py-1 rounded text-xs font-bold text-indigo-400 uppercase tracking-wider border border-slate-800">Selecionar</div></div>
                        </div>
                    {/if}
                    {#if character.talents.length > 0}
                        <div on:click={() => openModal('select_talent')} class="flex flex-col sm:flex-row items-center p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-yellow-600 cursor-pointer transition-colors gap-4 group">
                            <div class="flex items-start gap-3 w-full"><div class="bg-yellow-900/30 p-2 rounded text-yellow-300 mt-1"><Zap size={20}/></div><div><p class="font-bold text-white flex items-center gap-2 group-hover:text-yellow-300 transition-colors">Usar Talento</p><p class="text-xs text-slate-500">Ative uma habilidade ou talento especial.</p></div></div>
                            <div class="ml-auto"><div class="bg-slate-900 px-3 py-1 rounded text-xs font-bold text-yellow-500 uppercase tracking-wider border border-slate-800">Selecionar</div></div>
                        </div>
                    {/if}
                 </div>
              {/if}

              {#if activeTab === 'efeitos'}
                  <div class="space-y-4">
                      <div class="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <div class="flex items-center gap-4">
                              <button on:click={() => advanceRound('prev')} class="p-2 hover:bg-slate-700 rounded text-slate-400"><Rewind size={20}/></button>
                              <div class="text-center">
                                  <div class="text-[10px] text-slate-500 font-bold uppercase">Rodada Atual</div>
                                  <div class="text-2xl font-mono font-bold text-white">{character.currentRound}</div>
                              </div>
                              <button on:click={() => advanceRound('next')} class="p-2 hover:bg-slate-700 rounded text-white"><FastForward size={20}/></button>
                          </div>
                          <div class="flex gap-2">
                              <button on:click={() => character.effects = character.effects.filter(e => e.isActive)} class="bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 border border-slate-700"><Eraser size={14}/> Limpar Inativos</button>
                              <button on:click={() => openModal('effect')} class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Plus size={14}/> Novo Efeito</button>
                          </div>
                      </div>
                      <div class="space-y-2">
                          {#if character.effects.length === 0}<div class="text-center text-slate-500 italic py-4">Nenhum efeito ativo.</div>{/if}
                          {#each character.effects as eff}
                              <div class="p-3 rounded border flex flex-col gap-2 transition-all {eff.isActive ? 'bg-slate-900 border-indigo-900' : 'bg-slate-950 border-slate-800 opacity-60'}">
                                  <div class="flex justify-between items-start">
                                      <div class="flex items-center gap-2">
                                          <button on:click={() => eff.isActive = !eff.isActive} class="w-8 h-4 rounded-full relative transition-colors {eff.isActive ? 'bg-green-500' : 'bg-slate-600'}">
                                              <div class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all {eff.isActive ? 'left-4.5' : 'left-0.5'}"></div>
                                          </button>
                                          <span class="font-bold text-white">{eff.name}</span>
                                      </div>
                                      <div class="flex gap-2">
                                          <button on:click={() => openModal('effect', eff)} class="text-slate-500 hover:text-white"><Edit size={14}/></button>
                                          <button on:click={() => deleteEffect(eff.id)} class="text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                                  <div class="text-xs text-slate-400">{eff.description}</div>
                                  {#if eff.isActive && Array.isArray(eff.modifiers)}
                                      <div class="flex flex-wrap gap-1 mt-1">
                                          {#each eff.modifiers as mod}
                                              <span class="text-[9px] px-1 rounded border {mod.type === MOD_TYPES.SET ? 'bg-yellow-900/30 text-yellow-200 border-yellow-800' : 'bg-slate-800 text-slate-300 border-slate-700'}">
                                                  {MOD_TARGETS[mod.target] || mod.target}: {mod.type === MOD_TYPES.SET ? '=' : mod.type === MOD_TYPES.MULT ? 'x' : (mod.value > 0 ? '+' : '')}{mod.value}
                                              </span>
                                          {/each}
                                      </div>
                                  {/if}
                                  <div class="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 border-t border-slate-800 pt-2">
                                      <span class="flex items-center gap-1"><Clock size={10}/> {DURATION_TYPES[eff.duration]} {eff.duration === 'ROUNDS' ? `(${eff.roundsLeft})` : ''}</span>
                                      {#if eff.duration === 'LUCK_ENDS' && eff.isActive}
                                          <button on:click={() => checkLuckEnds(eff.id)} class="bg-yellow-900/40 hover:bg-yellow-800/40 text-yellow-500 border border-yellow-800 px-2 py-0.5 rounded flex items-center gap-1"><Clover size={10}/> Sorte Encerra</button>
                                      {/if}
                                  </div>
                              </div>
                          {/each}
                      </div>
                  </div>
              {/if}

              {#if activeTab === 'magias'}
                 <div class="space-y-6">
                    <div class="flex justify-between items-center"><h3 class="text-xs font-bold text-slate-500 uppercase">Grimório</h3><button on:click={() => openModal('spell')} class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold flex items-center gap-1"><Plus size={14} /> Add</button></div>
                    {#each ['Novice', 'Expert', 'Master'] as tier}
                        {#if character.spells.some(s => s.tier === tier)}
                            <div>
                                <h4 class="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2">{tier} Spells</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {#each character.spells.filter(s => s.tier === tier) as spell}
                                        <div class="p-4 bg-slate-950 rounded-lg border border-slate-800 group hover:border-slate-600">
                                            <div class="flex justify-between mb-2"><div class="font-bold text-white">{spell.name} <span class="text-[10px] text-slate-500 font-normal ml-1">({spell.tradition} • {spell.tier})</span></div><button on:click={() => openModal('spell', spell)} class="text-slate-600 hover:text-white"><Edit size={12}/></button></div>
                                            <div class="text-xs text-slate-400 mb-3 line-clamp-2">{spell.description}</div>
                                            <div class="flex items-center justify-between bg-slate-900 p-2 rounded"><span class="text-[10px] font-bold text-slate-500 uppercase">Castings</span><div class="flex items-center gap-2"><span class="text-sm font-mono font-bold {spell.castings === 0 ? 'text-red-500' : 'text-white'}">{spell.castings}/{spell.maxCastings}</span><button on:click={() => openModal('confirm_spell', spell)} disabled={spell.castings === 0} class="bg-indigo-600 disabled:opacity-50 text-white text-[10px] px-2 py-1 rounded">CAST</button></div></div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    {/each}
                 </div>
              {/if}

              {#if activeTab === 'talentos'}
                 <div class="space-y-4">
                    <div class="flex justify-between items-center mb-4"><h3 class="text-xs font-bold text-slate-500 uppercase">Talentos & Habilidades</h3><button on:click={() => openModal('talent')} class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold flex items-center gap-1"><Plus size={14} /> Add</button></div>
                    <div class="grid grid-cols-1 gap-3">
                        {#each character.talents as talent}
                            <div class="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center gap-4 group hover:border-slate-600 transition-colors">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1"><h4 class="font-bold text-white flex items-center gap-2"><Zap size={14} class="text-yellow-500" /> {talent.name}</h4><button on:click={() => openModal('talent', talent)} class="text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={12}/></button></div>
                                    <p class="text-sm text-slate-400">{talent.description}</p>
                                </div>
                                <div class="shrink-0 flex items-center gap-3 bg-slate-900 p-2 rounded border border-slate-800">
                                   <div class="text-center">
                                      {#if talent.isPassive}
                                          <span class="block text-[10px] text-slate-500 uppercase font-bold">Tipo</span>
                                          <span class="font-bold text-white text-xs flex items-center justify-center gap-1"><InfinityIcon size={12}/> Passivo</span>
                                      {:else}
                                          <span class="block text-[10px] text-slate-500 uppercase font-bold">Usos</span>
                                          <span class="font-mono font-bold {talent.uses === 0 ? 'text-red-500' : 'text-white'}">{talent.uses}/{talent.maxUses}</span>
                                      {/if}
                                   </div>
                                   {#if !talent.isPassive}
                                       <div class="flex flex-col gap-1"><button on:click={() => recoverTalent(talent.id)} disabled={talent.uses >= talent.maxUses} class="bg-slate-700 disabled:opacity-30 hover:bg-slate-600 text-green-400 p-1 rounded h-6 w-6 flex items-center justify-center"><Plus size={12} /></button><button on:click={() => openModal('confirm_talent', talent)} disabled={talent.uses === 0} class="bg-slate-700 disabled:opacity-30 hover:bg-slate-600 text-white p-1 rounded h-6 w-6 flex items-center justify-center"><Minus size={12} /></button></div>
                                   {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                 </div>
              {/if}

              {#if activeTab === 'equipamento'}
                 <div class="space-y-4">
                    <div class="flex justify-between items-center"><h3 class="text-xs font-bold text-slate-500 uppercase">Inventário</h3><button on:click={() => openModal('item')} class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold flex items-center gap-1"><Plus size={14} /> Novo Item</button></div>
                    <div class="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                       <table class="w-full text-sm text-left">
                          <thead class="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]"><tr><th class="p-3">Item</th><th class="p-3">Tipo</th><th class="p-3 text-center">Ações / Equipar</th><th class="p-3 text-right">Qtd</th><th class="p-3 w-8"></th></tr></thead>
                          <tbody class="divide-y divide-slate-800 text-slate-300">
                             {#each character.equipment as item}
                                <tr class="hover:bg-slate-900/50">
                                   <td class="p-3"><div class="font-bold text-white">{item.name}</div><div class="text-[10px] text-slate-500">{item.quality} • {item.availability} • {item.price}gp {#if item.notes}<span class="block italic text-slate-400">{item.notes}</span>{/if}{#if item.type === ITEM_TYPES.ARMOR} • Def {#if item.defenseFixed}Fixed {item.defenseFixed}{:else}+{item.defenseMod}{/if}{/if}</div></td>
                                   <td class="p-3"><span class="text-[10px] border border-slate-700 px-1 rounded uppercase bg-slate-900">{item.type}</span></td>
                                   <td class="p-3 text-center">
                                      {#if item.type === ITEM_TYPES.CONSUMABLE}
                                          <button on:click={() => useConsumable(item)} disabled={item.quantity <= 0} class="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600">Usar</button>
                                      {:else if item.type === ITEM_TYPES.ARMOR}
                                          <button on:click={() => equipItem(item)} class="text-xs px-2 py-1 rounded border transition-colors {item.equipped ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}">{item.equipped ? 'Equipado' : 'Equipar'}</button>
                                      {:else if item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.SHIELD}
                                          <div class="flex justify-center gap-1">
                                              {#if item.grip === GRIPS.TWO}
                                                  <button on:click={() => equipItem(item, item.equippedState ? null : 'two')} class="text-[10px] px-2 py-1 rounded border {item.equippedState === 'two' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}">2H</button>
                                              {:else}
                                                  {#if item.grip !== GRIPS.OFF}
                                                      <button on:click={() => equipItem(item, item.equippedState === 'main' ? null : 'main')} class="text-[10px] px-2 py-1 rounded border {item.equippedState === 'main' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}">Main</button>
                                                  {/if}
                                                  <button on:click={() => equipItem(item, item.equippedState === 'off' ? null : 'off')} class="text-[10px] px-2 py-1 rounded border {item.equippedState === 'off' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-500'}">Off</button>
                                              {/if}
                                          </div>
                                      {/if}
                                   </td>
                                   <td class="p-3 text-right font-mono">{item.quantity}</td>
                                   <td class="p-3"><button on:click={() => openModal('item', item)} class="text-slate-500 hover:text-white"><Edit size={14}/></button></td>
                                </tr>
                             {/each}
                          </tbody>
                       </table>
                    </div>
                 </div>
              {/if}

              {#if activeTab === 'notas'}
                 <div class="space-y-4">
                    <div class="flex justify-between items-center mb-2"><h3 class="text-xs font-bold text-slate-500 uppercase">Anotações do Personagem</h3><span class="text-[10px] text-slate-600 italic">Salvo automaticamente</span></div>
                    <textarea class="w-full h-[60vh] bg-slate-950 border border-slate-800 rounded p-4 text-white resize-none focus:border-indigo-500 focus:outline-none custom-scrollbar leading-relaxed font-mono text-sm" bind:value={character.notes} placeholder="Escreva aqui a história, anotações de campanha, NPCs importantes, segredos..."></textarea>
                 </div>
              {/if}
           </div>
        </div>
     </section>
  </main>
</div>