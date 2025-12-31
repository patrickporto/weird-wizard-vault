import { writable, derived, get } from 'svelte/store';
import { uuidv7 } from 'uuidv7';
// Use the global rollHistory from characterStore for now to have a unified history
// We import as type any or handle the JS import properly
// @ts-ignore
import { rollHistory, appSettings, isHistoryOpen, hasUnreadRolls } from './characterStore';

export interface SotDLCharacter {
    id: string;
    system: 'sofdl';
    name: string;
    level: number;
    ancestry: string;
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
    talents: any[];
    spells: any[];
    equipment: any[];
    effects: any[];

    // Campaign
  campaignId: string | null;
  campaignName: string | null;
  gmName: string | null;
  campaignApproval: 'pending' | 'approved' | 'rejected' | null;

    // Combat
  combatActive: boolean;
  currentRound: number;
  magicSystem: 'standard' | 'forbidden_rules' | 'uncanny_arcana';
}

export const defaultSotDLCharacter: SotDLCharacter = {
    id: '',
    system: 'sofdl',
    name: 'Novo Personagem',
    level: 0,
    ancestry: 'Humano',
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
    effects: [],
  campaignId: null,
  campaignName: null,
  gmName: null,
  campaignApproval: null,
    combatActive: false,
  currentRound: 1,
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
        // Simple placeholder for round advancement logic, similar to WW
        console.log('Advance round', direction);
    },
    checkLuckEnds: (id: string) => {
        // Logic for luck rolls ending effects
        console.log('Check luck ends', id);
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

  // Roll Logic
  finalizeRoll: (data: any, modifier: number, selectedEffects: string[] = []) => {
    const char = get(sotdlCharacter);
    const mods = get(sotdlModifiers);

    const isDamage = data.type === 'weapon_damage' || data.type === 'spell_damage';
    const sourceName = data.source?.name || data.key || 'Atributo';

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
        source: data.type === 'luck' ? 'Sorte' : 'Atributo',
        name: attrLabel,
        description: `Teste de ${attrLabel} ${modifier !== 0 ? `com ${modifier} dádivas/perdições` : ''}`,
        formula: `d20(${d20})${attrMod !== 0 ? (attrMod >= 0 ? '+' : '') + attrMod : ''}${boonBaneStr}`,
        total: total,
        crit: d20 === 20
      });
    } else {
      // Damage roll placeholder for SotDL
      const dice = data.source?.damageDice || '1d6';
      const [count, sides] = dice.split('d').map(Number);
      let sum = 0;
      let results = [];
      for (let i = 0; i < (count || 1); i++) {
        const r = Math.floor(Math.random() * (sides || 6)) + 1;
        sum += r;
        results.push(r);
      }
      const total = sum + modifier;

      sotdlCharacterActions.addToHistory({
        source: 'Dano',
        name: sourceName,
        description: `Dano de ${sourceName}`,
        formula: `${dice} [${results.join(', ')}] ${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}`,
        total: total
      });
    }
  },
    // Item Actions
    useConsumable: (item: any) => {
        console.log('Use consumable', item);
    },
    reloadWeapon: (item: any) => {
        console.log('Reload weapon', item);
    }
};
