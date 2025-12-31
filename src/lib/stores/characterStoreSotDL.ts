import { writable, derived, get } from 'svelte/store';
import { uuidv7 } from 'uuidv7';
// Use the global rollHistory from characterStore for now to have a unified history
// We import as type any or handle the JS import properly
// @ts-ignore
import { rollHistory, appSettings, isHistoryOpen, hasUnreadRolls, modalState } from './characterStore';

export interface SotDLSpell {
  id: string;
  name: string;
  tradition: string;
  rank: number; // 0-10
  type: string; // Attack, Utility, etc.
  target: string;
  area: string;
  duration: string;
  description: string;
  castingsUsed: number; // Track how many times cast this session
  effect?: any;
}

export type TalentOrigin = 'ancestry' | 'novice' | 'expert' | 'master';

export interface SotDLTalent {
  id: string;
  name: string;
  description: string;
  origin: TalentOrigin;
  isPassive: boolean;
  uses: number;
  maxUses: number;
  effect?: any;
}

export interface SotDLCurrency {
  gc: number;
  ss: number;
  cp: number;
  bits: number;
}

export interface SotDLEquipment {
  id: string;
  name: string;
  description: string;
  type: string;
  quantity: number;
  hands?: string;
  properties?: string;
  damage?: string; // e.g., "1d3", "1d6+1"
  damageDice?: string; // Legacy support or just alias
  range?: string;
  maxUses?: number; // Consumables
  damageMod?: number; // Integer modifier for damage

  // State
  equippedState?: 'equipped' | 'off' | 'main' | 'two' | '';
  isLoaded?: boolean;
  traits?: string;

  armorType?: string;
  defenseFixed?: number;
  defenseMod?: number;
  availability?: string;
  value?: number;
}

export interface SotDLCharacter {
  id: string;
  system: 'sofdl';
  name: string;
  level: number;
  ancestry: string;
  paths: {
    novice: string;
    expert: string;
    master: string;
  };
  imageUrl?: string;

  // Attributes
  attributes: {
    strength: number;
    agility: number;
    intellect: number;
    will: number;
  };

  // Stats
  perception: number;
  defense: number;
  health: number; // Max Health
  healingRate: number;
  size: number;
  speed: number;
  power: number;

  // Status
  damage: number;
  insanity: number;
  corruption: number;

  // Details
  description: string;
  notes: string;
  professions: string[]; // No specific list, just strings
  languages: string[];
  senses: string[];
  afflictions: string[];

  // Collections
  talents: SotDLTalent[];
  spells: SotDLSpell[];
  equipment: SotDLEquipment[];
  currency: SotDLCurrency;
  effects: any[];

  // Campaign
  campaignId: string | null;
  campaignName: string | null;
  gmName: string | null;
  campaignApproval: 'pending' | 'approved' | 'rejected' | null;

  // Combat
  combatActive: boolean;
  currentRound: number;
  initiative: boolean;
  acted: boolean;
  magicSystem: 'standard' | 'forbidden_rules' | 'uncanny_arcana';
}

export const defaultSotDLCharacter: SotDLCharacter = {
  id: '',
  system: 'sofdl',
  name: 'Novo Personagem',
  ancestry: 'Humano',
  level: 0,
  paths: {
    novice: '',
    expert: '',
    master: ''
  },
  imageUrl: '',
  attributes: {
    strength: 10,
    agility: 10,
    intellect: 10,
    will: 10
  },
  perception: 10,
  defense: 10,
  health: 10,
  healingRate: 2,
  size: 1,
  speed: 10,
  power: 0,
  damage: 0,
  insanity: 0,
  corruption: 0,
  description: '',
  notes: '',
  professions: [],
  languages: ['Comum'],
  senses: [],
  afflictions: [],
  talents: [],
  spells: [],
  equipment: [],
  currency: { gc: 0, ss: 0, cp: 0, bits: 0 },
  effects: [],
  campaignId: null,
  campaignName: null,
  gmName: null,
  campaignApproval: null,
  combatActive: false,
  currentRound: 1,
  initiative: false,
  acted: false,
  magicSystem: 'standard'
};

// Store Definition
export const sotdlCharacter = writable<SotDLCharacter>(JSON.parse(JSON.stringify(defaultSotDLCharacter)));

// Derived Stats
export const sotdlAttributes = derived(sotdlCharacter, $c => $c.attributes);
export const sotdlModifiers = derived(sotdlAttributes, $a => ({
  strength: $a.strength - 10,
  agility: $a.agility - 10,
  intellect: $a.intellect - 10,
  will: $a.will - 10
}));

export const sotdlCurrentHealth = derived(sotdlCharacter, $c => $c.health - $c.damage);
export const sotdlIsInjured = derived(sotdlCharacter, $c => $c.damage >= $c.health / 2);
export const sotdlIsIncapacitated = derived(sotdlCharacter, $c => $c.damage >= $c.health);
export const sotdlActiveEffects = derived(sotdlCharacter, $c => $c.effects.filter(e => e.isActive));

export const sotdlTotalHealingRate = derived([sotdlCharacter, sotdlActiveEffects], ([$c, $effects]) => {
  let base = $c.healingRate;
  // Apply additions
  $effects.forEach(e => {
    if (e.modifiers) {
      e.modifiers.forEach((m: any) => {
        if (m.target === 'healing_rate' && m.type === 'ADD') {
          base += Number(m.value);
        }
      });
    }
  });
  return Math.max(0, base);
});

export const sotdlCharacterActions = {
  set: (data: Partial<SotDLCharacter>) => {
    sotdlCharacter.update(c => {
      const newState = { ...c, ...data };
      // If health changed, update base healing rate automatically if not explicitly provided
      if (data.health !== undefined && data.healingRate === undefined) {
        newState.healingRate = Math.floor(newState.health / 4);
      }
      return newState;
    });
  },
  updateAttribute: (attr: keyof SotDLCharacter['attributes'], value: number) => {
    sotdlCharacter.update(c => ({
      ...c,
      attributes: { ...c.attributes, [attr]: value }
    }));
  },
  takeDamage: (amount: number) => {
    sotdlCharacter.update(c => {
      const newDamage = Math.max(0, Math.min(c.health, c.damage + amount));
      return { ...c, damage: newDamage };
    });
  },
  heal: (amount: number) => {
    sotdlCharacter.update(c => {
      const newDamage = Math.max(0, c.damage - amount);
      return { ...c, damage: newDamage };
    });
  },
  updateStat: (stat: 'insanity' | 'corruption', value: number) => {
    sotdlCharacter.update(c => ({ ...c, [stat]: Math.max(0, value) }));
  },
  // Effects Actions
  toggleEffect: (id: string) => {
    sotdlCharacter.update(c => ({
      ...c,
      effects: c.effects.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e)
    }));
  },
  deleteEffect: (id: string) => {
    sotdlCharacter.update(c => ({
      ...c,
      effects: c.effects.filter(e => e.id !== id)
    }));
  },
  cleanInactiveEffects: () => {
    sotdlCharacter.update(c => ({
      ...c,
      effects: c.effects.filter(e => e.isActive)
    }));
  },
  advanceRound: (direction: 'next' | 'prev') => {
    sotdlCharacter.update(c => {
      if (direction === 'next') {
        // Auto-deactivate END_OF_ROUND effects
        const newEffects = c.effects.map(e =>
          e.isActive && e.duration === 'END_OF_ROUND'
            ? { ...e, isActive: false }
            : e
        );
        return { ...c, currentRound: c.currentRound + 1, effects: newEffects };
      }
      return { ...c, currentRound: Math.max(1, c.currentRound - 1) };
    });
  },
  checkLuckEnds: (id: string) => {
    const char = get(sotdlCharacter);
    const effect = char.effects.find(e => e.id === id);
    modalState.set({
      type: 'pre_roll',
      isOpen: true,
      data: {
        type: 'luck_ends',
        system: 'sofdl',
        effectId: id,
        source: { name: effect?.name || 'Efeito' }
      }
    });
  },
  checkConcentration: (effectId: string) => {
    const char = get(sotdlCharacter);
    const effect = char.effects.find(e => e.id === effectId);
    modalState.set({
      type: 'pre_roll',
      isOpen: true,
      data: {
        type: 'concentration',
        system: 'sofdl',
        effectId,
        key: 'will',
        source: { name: effect?.name || 'Concentração' }
      }
    });
  },
  // Spell Actions
  addSpell: (spell: SotDLSpell) => {
    sotdlCharacter.update(c => ({
      ...c,
      spells: [...c.spells, { ...spell, id: spell.id || uuidv7() }]
    }));
  },
  updateSpell: (spell: SotDLSpell) => {
    sotdlCharacter.update(c => ({
      ...c,
      spells: c.spells.map(s => s.id === spell.id ? spell : s)
    }));
  },
  deleteSpell: (id: string) => {
    sotdlCharacter.update(c => ({
      ...c,
      spells: c.spells.filter(s => s.id !== id)
    }));
  },
  castSpell: (id: string) => {
    sotdlCharacter.update(c => ({
      ...c,
      spells: c.spells.map(s => s.id === id ? { ...s, castingsUsed: (s.castingsUsed || 0) + 1 } : s)
    }));
  },
  resetSpellCastings: () => {
    sotdlCharacter.update(c => ({
      ...c,
      spells: c.spells.map(s => ({ ...s, castingsUsed: 0 }))
    }));
  },
  // Talent Actions
  addTalent: (talent: SotDLTalent) => {
    sotdlCharacter.update(c => ({
      ...c,
      talents: [...c.talents, { ...talent, id: talent.id || uuidv7() }]
    }));
  },
  updateTalent: (talent: SotDLTalent) => {
    sotdlCharacter.update(c => ({
      ...c,
      talents: c.talents.map(t => t.id === talent.id ? talent : t)
    }));
  },
  deleteTalent: (id: string) => {
    sotdlCharacter.update(c => ({
      ...c,
      talents: c.talents.filter(t => t.id !== id)
    }));
  },
  useTalent: (id: string) => {
    sotdlCharacter.update(c => ({
      ...c,
      talents: c.talents.map(t => t.id === id && t.uses > 0 ? { ...t, uses: t.uses - 1 } : t)
    }));
  },
  resetTalentUses: () => {
    sotdlCharacter.update(c => ({
      ...c,
      talents: c.talents.map(t => ({ ...t, uses: t.maxUses }))
    }));
  },
  // Senses Actions
  addSense: (sense: string) => {
    sotdlCharacter.update(c => ({
      ...c,
      senses: !c.senses.includes(sense) ? [...c.senses, sense] : c.senses
    }));
  },
  removeSense: (index: number) => {
    sotdlCharacter.update(c => ({
      ...c,
      senses: c.senses.filter((_, i) => i !== index)
    }));
  },
  // Afflictions Actions
  toggleAffliction: (aff: string) => {
    sotdlCharacter.update(c => ({
      ...c,
      afflictions: c.afflictions.includes(aff)
        ? c.afflictions.filter(a => a !== aff)
        : [...c.afflictions, aff]
    }));
  },
  leaveCampaign: () => {
    sotdlCharacter.update(c => ({
      ...c,
      campaignId: null,
      campaignName: null,
      gmName: null,
      campaignApproval: null
    }));
  },
  // History Actions
  addToHistory: (rollData: any, shouldSync = true) => {
    const char = get(sotdlCharacter);
    // Use the global rollHistory from characterStore for now to have a unified history

    const entry = {
      id: rollData.id || uuidv7(),
      timestamp: rollData.timestamp || new Date(),
      charName: char.name,
      ...rollData
    };

    rollHistory.update((h: any[]) => [entry, ...h]);

    const settings = get(appSettings);
    if (settings.autoOpenHistory) {
      isHistoryOpen.set(true);
    } else if (!get(isHistoryOpen)) {
      hasUnreadRolls.set(true);
    }

    // Sync via Trystero if in a campaign
    if (shouldSync && char.campaignId) {
      import('$lib/logic/sync').then(({ syncRoll }) => {
        syncRoll(entry);
      });
    }
  },
  // Languages & Professions
  addLanguage: (lang: string) => sotdlCharacter.update(c => ({ ...c, languages: [...c.languages, lang] })),
  removeLanguage: (index: number) => sotdlCharacter.update(c => ({ ...c, languages: c.languages.filter((_, i) => i !== index) })),
  addProfession: (prof: string) => sotdlCharacter.update(c => ({ ...c, professions: [...c.professions, prof] })),
  removeProfession: (index: number) => sotdlCharacter.update(c => ({ ...c, professions: c.professions.filter((_, i) => i !== index) })),

  // Currency Actions
  updateCurrency: (type: 'gc' | 'ss' | 'cp' | 'bits', amount: number) => {
    sotdlCharacter.update(c => {
      const newVal = Math.max(0, (c.currency[type] || 0) + amount);
      return { ...c, currency: { ...c.currency, [type]: newVal } };
    });
  },

  // Inventory / Equipment Actions
  addItem: (item: SotDLEquipment) => sotdlCharacter.update(c => ({ ...c, equipment: [...c.equipment, item] })),
  updateItem: (item: SotDLEquipment) => sotdlCharacter.update(c => ({
    ...c,
    equipment: c.equipment.map(i => i.id === item.id ? item : i)
  })),
  deleteItem: (itemId: string) => sotdlCharacter.update(c => ({
    ...c,
    equipment: c.equipment.filter(i => i.id !== itemId)
  })),

  useConsumable: (item: SotDLEquipment) => {
    sotdlCharacter.update(c => ({
      ...c,
      equipment: c.equipment.map(i => i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i)
    }));
    // Optional: Add to history that item was used
  },

  reloadWeapon: (item: SotDLEquipment) => sotdlCharacter.update(c => ({
    ...c,
    equipment: c.equipment.map(i => i.id === item.id ? { ...i, isLoaded: true } : i)
  })),

  // Roll Logic
  finalizeRoll: (data: any, modifier: number, selectedEffects: string[] = []) => {
    const char = get(sotdlCharacter);
    const mods = get(sotdlModifiers);

    const isDamage = data?.type === 'weapon_damage' || data?.type === 'spell_damage';
    const sourceName = data?.source?.name || data?.key || 'Atributo';

    if (!isDamage) {
      const d20 = Math.floor(Math.random() * 20) + 1;
      let attrMod = 0;
      let attrLabel = sourceName;

      if (data.type === 'attribute') {
        attrMod = mods[data.key as keyof typeof mods] || 0;
        attrLabel = data.key;
      } else if (data.type === 'luck') {
        attrMod = 0;
        attrLabel = 'Sorte';
      }

      // Boon/Bane Logic (1d6 highest)
      let boonBaneTotal = 0;
      let boonBaneStr = '';
      if (modifier !== 0) {
        const numDice = Math.abs(modifier);
        let rolls = [];
        for (let i = 0; i < numDice; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
        const highest = Math.max(...rolls);

        if (modifier > 0) {
          boonBaneTotal = highest;
          boonBaneStr = ` + ${highest} [Dádiva]`;
        } else {
          boonBaneTotal = -highest;
          boonBaneStr = ` - ${highest} [Perrdição]`;
        }
      }

      const total = d20 + attrMod + boonBaneTotal;

      sotdlCharacterActions.addToHistory({
        source: data.type === 'luck' || data.type === 'luck_ends' ? 'Sorte' : 'Atributo',
        name: attrLabel,
        description: data.type === 'luck_ends' ? `Teste de Sorte para encerrar efeito ${sourceName}` : `Teste de ${attrLabel} ${modifier !== 0 ? `com ${modifier} dádivas/perdições` : ''}`,
        formula: `d20(${d20})${attrMod !== 0 ? (attrMod >= 0 ? '+' : '') + attrMod : ''}${boonBaneStr}`,
        total: total,
        crit: d20 === 20,
        effectsApplied: selectedEffects
      });

      // Special logic for luck_ends
      if (data.type === 'luck_ends' && total >= 10) {
        sotdlCharacter.update(c => ({
          ...c,
          effects: c.effects.map(e => e.id === data.effectId ? { ...e, isActive: false } : e)
        }));
      }
    } else {
      // Damage roll for SotDL
      const rawDamage = data.source?.damage ?? data.source?.damageDice ?? '1d6';
      const damageStr = String(rawDamage);
      const damageMod = Number(data.source?.damageMod) || 0;

      let sum = 0;
      let results: number[] = [];
      let formula = '';

      if (damageStr === '0') {
        sum = 0;
        formula = '0';
      } else if (!damageStr.includes('d')) {
        sum = parseInt(damageStr) || 0;
        formula = `${sum}`;
        results = [sum];
      } else {
        const match = damageStr.match(/(\d+)d(\d+)/);
        if (match) {
          const count = parseInt(match[1]) || 1;
          const sides = parseInt(match[2]) || 6;
          for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * sides) + 1;
            sum += r;
            results.push(r);
          }
          formula = `${damageStr} [${results.join(', ')}]`;
        } else {
          sum = 1;
          formula = '1';
        }
      }

      const total = sum + modifier + damageMod;
      const modStr = (modifier + damageMod) !== 0 ? `${(modifier + damageMod) > 0 ? '+' : ''}${modifier + damageMod}` : '';

      sotdlCharacterActions.addToHistory({
        source: 'Dano',
        name: sourceName,
        description: `Dano de ${sourceName}`,
        formula: `${formula}${modStr}`,
        total: total
      });
    }
  },
  // Rest action
  rest: () => {
    sotdlCharacter.update(c => {
      // Reset all spell castings
      const resetSpells = c.spells.map(s => ({ ...s, castingsUsed: 0 }));

      // Reset all talent uses
      const resetTalents = c.talents.map(t => ({
        ...t,
        uses: t.isPassive ? 0 : t.maxUses
      }));

      // Heal damage equal to healing rate
      const newDamage = Math.max(0, c.damage - c.healingRate);

      return {
        ...c,
        spells: resetSpells,
        talents: resetTalents,
        damage: newDamage
      };
    });
  }
};
