
import { writable, derived, get } from 'svelte/store';
import { _ as t } from 'svelte-i18n';
import { uuidv7 } from 'uuidv7';
import { Parser } from 'expr-eval';

const parser = new Parser();
import {
    ITEM_TYPES,
    MOD_TYPES,
    GRIPS
} from "../../routes/sofww";

// --- TYPES ---

export interface WWModifier {
    target: string;
    type: string;
    value: number | string;
}

export interface WWEffect {
    id: string;
    name: string;
    duration: string;
    roundsLeft: number;
    initialRounds?: number;
    description: string;
    isActive: boolean;
    modifiers: WWModifier[];
    sourceType?: string;
    sourceId?: string | number;
}

export interface WWSpell {
    id: string | number;
    name: string;
    tier: string;
    type: string;
    tradition: string;
    description: string;
    castings: number;
    maxCastings: number;
    effect: WWEffect | null;
}

export interface WWTalent {
    id: string | number;
    name: string;
    description: string;
    uses: number;
    maxUses: number;
    isPassive: boolean;
    activityType?: 'Passive' | 'Uses' | 'Duration';
    duration?: string;
    effect: WWEffect | null;
}

export interface WWItem {
    id: string | number;
    name: string;
    type: string;
    quantity: number;
    price?: number;
    availability?: string;
    quality?: string;
    grip?: string;
    range?: string;
    damageDice?: number | string;
    boonsBanes?: number;
    traits?: string;
    equipped: boolean;
    equippedState?: string | null;
    notes?: string;
    description?: string;
    defenseType?: 'fixed' | 'mod';
    defenseFixed?: number;
    defenseMod?: number;
    armorWeight?: 'Light' | 'Medium' | 'Heavy';
    isLoaded?: boolean;
}

export interface WWCharacter {
    id?: string;
    name: string;
    level: number;
    ancestry: string;
    paths: {
        novice: string;
        expert: string;
        master: string;
    };
    attributes: { name: string; value: number; key: string }[];
    currency: { gp: number; sp: number; cp: number };
    naturalDefense: number;
    bonusDamage: number;
    size: number;
    speed: number;
    currentRound: number;
    languages: string[];
    senses: string[];
    afflictions: string[];
    effects: WWEffect[];
    notes: string;
    campaignId: string | null;
    campaignName: string | null;
    gmName: string | null;
    combatActive: boolean;
    initiative: boolean;
    acted: boolean;
    spells: WWSpell[];
    talents: WWTalent[];
    equipment: WWItem[];
    professions: string[];
    imageUrl?: string;
    system?: string;
    campaignApproval?: 'pending' | 'approved' | 'rejected' | null;
    passwordHash?: string;
}

export interface RollHistoryEntry {
    id: string;
    timestamp: Date;
    charName: string;
    source: string;
    name: string;
    description?: string;
    formula?: string;
    total?: number;
    crit?: boolean;
    effectsApplied?: string[];
    system?: string;
}


export interface AppSettings {
    autoOpenHistory: boolean;
    stickyHistory: boolean;
    theme: string;
    defaultPlayerName?: string;
    defaultGmName?: string;
}

// --- STATE ---

export const defaultCharacter: WWCharacter = {
    name: "",
    level: 1,
    ancestry: "",
    paths: { novice: "", expert: "", master: "" },
    attributes: [
        { name: "Strength", value: 10, key: "str" },
        { name: "Agility", value: 10, key: "agi" },
        { name: "Intellect", value: 10, key: "int" },
        { name: "Will", value: 10, key: "wil" }
    ],
    currency: { gp: 0, sp: 0, cp: 0 },
    naturalDefense: 10,
    bonusDamage: 0,
    size: 1,
    speed: 10,
    currentRound: 1,
    languages: [],
    professions: [],
    senses: [],
    afflictions: [],
    effects: [],
    notes: "",
    campaignId: null,
    campaignName: null,
    gmName: null,
    combatActive: false,
    initiative: false,
    acted: false,
    spells: [],
    talents: [],
    equipment: []
};

export const character = writable<WWCharacter>(JSON.parse(JSON.stringify(defaultCharacter)));
export const rollHistory = writable<RollHistoryEntry[]>([]);
export const modalState = writable<{ type: string | null; isOpen: boolean; data: any; system?: string }>({ type: null, isOpen: false, data: null });
export const activeTab = writable('acoes');
export const normalHealth = writable(24);
export const currentHealth = writable(24);
export const damage = writable(0);
export const isHistoryOpen = writable(false);
export const hasUnreadRolls = writable(false);

// --- APP SETTINGS ---

const initialSettings: AppSettings = {
    autoOpenHistory: false,
    stickyHistory: false,
    theme: 'dark',
    defaultPlayerName: '',
    defaultGmName: ''
};

function createAppSettings() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('wwv_app_settings') : null;
    const { subscribe, set, update } = writable<AppSettings>(saved ? { ...initialSettings, ...JSON.parse(saved) } : initialSettings);

    return {
        subscribe,
        set: (value: AppSettings) => {
            if (typeof localStorage !== 'undefined') localStorage.setItem('wwv_app_settings', JSON.stringify(value));
            set(value);
        },
        update: (fn: (old: AppSettings) => AppSettings) => {
            update(old => {
                const newValue = fn(old);
                if (typeof localStorage !== 'undefined') localStorage.setItem('wwv_app_settings', JSON.stringify(newValue));
                return newValue;
            });
        }
    };
}

export const appSettings = createAppSettings();

// Clear unread on open
isHistoryOpen.subscribe(open => {
    if (open) hasUnreadRolls.set(false);
});

// --- DERIVED STORES & HELPERS ---

export const activeEffects = derived(character, $char => {
    const standardEffects = $char.effects.filter(e => e.isActive);
    const talentEffects = $char.talents
        .filter(t => (t.isPassive || t.activityType === 'Passive') && t.effect)
        .map(t => ({
            ...(t.effect as WWEffect),
            id: `talent-effect-${t.id}`,
            name: t.name,
            sourceType: 'talent',
            sourceId: t.id
        }));
    return [...standardEffects, ...talentEffects];
});

export function evaluateModifierValue(value: number | string, characterObj: WWCharacter): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const sValue = String(value).trim();
    if (!isNaN(Number(sValue))) return Number(sValue);

    try {
        const context: any = {};
        if (Array.isArray(characterObj.attributes)) {
            characterObj.attributes.forEach(attr => {
                context[attr.key] = attr.value;
            });
        }
        context['level'] = characterObj.level || 0;
        context['defense'] = characterObj.naturalDefense || 0;
        context['speed'] = characterObj.speed || 0;
        context['bonusDamage'] = characterObj.bonusDamage || 0;
        context['currentRound'] = characterObj.currentRound || 0;

        const expression = sValue.replace(/@(\w+)/g, '$1');
        return parser.evaluate(expression, context);
    } catch (e) {
        return 0;
    }
}

function calculateDerivedStat(key: string, baseValue: number, effects: WWEffect[], characterObj: WWCharacter): number {
    let value = baseValue || 0;
    const allMods = effects.flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : []);

    const sets = allMods.filter(m => m.target === key && m.type === MOD_TYPES.SET);
    if (sets.length > 0) value = evaluateModifierValue(sets[sets.length - 1].value, characterObj);

    const adds = allMods.filter(m => m.target === key && m.type === MOD_TYPES.ADD);
    adds.forEach(m => { value += evaluateModifierValue(m.value, characterObj); });

    const mults = allMods.filter(m => m.target === key && m.type === MOD_TYPES.MULT);
    mults.forEach(m => { value *= evaluateModifierValue(m.value, characterObj); });

    return Math.floor(value);
}

export const derivedStats = derived([character, activeEffects], ([$char, $effects]) => {
    const stats: Record<string, number> = {};
    if (Array.isArray($char.attributes)) {
        $char.attributes.forEach(attr => {
            stats[attr.key] = calculateDerivedStat(attr.key, attr.value, $effects, $char);
        });
    }
    return stats;
});

export const effectiveMaxHealth = derived([character, currentHealth, activeEffects], ([$char, $ch, $effects]) => {
    return calculateDerivedStat('health', $ch, $effects, $char);
});

export const tempHealth = derived([effectiveMaxHealth, normalHealth], ([$emh, $nh]) => {
    return Math.max(0, $emh - $nh);
});

export const damagePercentage = derived([damage, currentHealth], ([$dmg, $ch]) => {
    return $ch > 0 ? Math.min(100, ($dmg / $ch) * 100) : 100;
});

export const isIncapacitated = derived([damage, currentHealth], ([$dmg, $ch]) => {
    return $dmg >= $ch;
});

export const isInjured = derived([damage, currentHealth, isIncapacitated], ([$dmg, $ch, $incap]) => {
    return $dmg >= ($ch / 2) && !$incap;
});

export const effectiveSpeed = derived([character, derivedStats, activeEffects], ([$char, $stats, $effects]) => {
    let s = calculateDerivedStat('speed', $char.speed, $effects, $char);
    const affs = $char.afflictions;
    if (affs.includes("Held") || affs.includes("Stunned") || affs.includes("Unconscious") || affs.includes("Incapacitated")) return 0;
    if (affs.includes("Blinded") || affs.includes("Weakened")) s = Math.floor(s / 2);
    if (affs.includes("Slowed")) s = Math.min(s, 2);
    return Math.max(0, s);
});

export const totalDefense = derived([character, activeEffects], ([$char, $effects]) => {
    let defense = $char.naturalDefense;
    let shieldBonus = 0;
    const equippedArmor = $char.equipment.find(i => i.type === ITEM_TYPES.ARMOR && i.equipped);

    if (equippedArmor) {
        const fixedDef = equippedArmor.defenseFixed || 0;
        const modDef = $char.naturalDefense + (equippedArmor.defenseMod || 0);
        if (equippedArmor.defenseFixed && equippedArmor.defenseMod) defense = Math.max(fixedDef, modDef);
        else if (equippedArmor.defenseFixed) defense = fixedDef;
        else if (equippedArmor.defenseMod) defense = $char.naturalDefense + equippedArmor.defenseMod;
    }

    $char.equipment.filter(i => i.type === ITEM_TYPES.SHIELD && i.equippedState).forEach(shield => {
        shieldBonus += (shield.defenseMod || 0);
    });

    return calculateDerivedStat('defense', defense + shieldBonus, $effects, $char);
});

export const damageBonus = derived([character, activeEffects], ([$char, $effects]) => {
    const allMods = $effects.flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : []);
    const bonus = allMods.filter(m => m.target === 'damage' && m.type === MOD_TYPES.ADD)
        .reduce((acc, m) => acc + evaluateModifierValue(m.value, $char), 0);
    return ($char.bonusDamage || 0) + bonus;
});

// --- ACTIONS ---

export const characterActions = {
    updateCurrency: (type: 'gp' | 'sp' | 'cp', amount: number) => {
        character.update(c => {
            let totalCp = (c.currency.gp * 100) + (c.currency.sp * 10) + c.currency.cp;
            let addCp = 0;
            if (type === 'gp') addCp = amount * 100;
            if (type === 'sp') addCp = amount * 10;
            if (type === 'cp') addCp = amount;
            totalCp += addCp;
            if (totalCp < 0) totalCp = 0;

            return {
                ...c,
                currency: {
                    gp: Math.floor(totalCp / 100),
                    sp: Math.floor((totalCp % 100) / 10),
                    cp: (totalCp % 100) % 10
                }
            };
        });
    },

    advanceRound: (direction: 'next' | 'prev') => {
        character.update(c => {
            const currentR = c.currentRound || 1;
            if (direction === 'next') {
                const newEffects = (c.effects || []).map(eff => {
                    if (eff.isActive && eff.duration === 'ROUNDS' && eff.roundsLeft > 0) {
                        const remaining = eff.roundsLeft - 1;
                        return remaining <= 0 ? { ...eff, roundsLeft: 0, isActive: false } : { ...eff, roundsLeft: remaining };
                    }
                    return eff;
                });
                return { ...c, currentRound: currentR + 1, effects: newEffects };
            } else {
                return { ...c, currentRound: Math.max(1, currentR - 1) };
            }
        });
    },

    addToHistory: (rollData: Partial<RollHistoryEntry>, shouldSync = true) => {
        const char = get(character);
        const history = get(rollHistory);

        if (rollData.id && history.find(r => r.id === rollData.id)) {
            return;
        }

        const entry: RollHistoryEntry = {
            id: rollData.id || uuidv7(),
            timestamp: rollData.timestamp || new Date(),
            charName: char.name,
            source: rollData.source || 'gm',
            name: rollData.name || 'Action',
            ...rollData
        };

        rollHistory.update(h => [entry, ...h]);

        const settings = get(appSettings);
        if (settings.autoOpenHistory) {
            isHistoryOpen.set(true);
        } else if (!get(isHistoryOpen)) {
            hasUnreadRolls.set(true);
        }

        if (shouldSync && char.campaignId) {
            import('$lib/logic/sync').then(({ syncRoll }) => {
                syncRoll(entry);
            });
        }
    },

    clearHistory: () => rollHistory.set([]),

    addItem: (item: WWItem) => character.update(c => ({ ...c, equipment: [...c.equipment, item] })),
    updateItem: (item: WWItem) => character.update(c => ({ ...c, equipment: c.equipment.map(i => i.id === item.id ? item : i) })),
    deleteItem: (id: string | number) => character.update(c => ({ ...c, equipment: c.equipment.filter(i => i.id !== id) })),

    useConsumable: (item: WWItem) => {
        if (item.quantity > 0) {
            const _t = get(t);
            characterActions.updateItem({ ...item, quantity: item.quantity - 1 });
            characterActions.addToHistory({
                source: 'item',
                name: item.name,
                description: _t('sofww.item_types.consumable') + `: ${item.name}`
            });
        }
    },

    equipItem: (item: WWItem, state: string | null = null) => {
        character.update(c => {
            let newEquip = [...c.equipment];
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
            return { ...c, equipment: newEquip };
        });
    },

    toggleAffliction: (aff: string) => {
        character.update(c => {
            if (c.afflictions.includes(aff)) return { ...c, afflictions: c.afflictions.filter(a => a !== aff) };
            return { ...c, afflictions: [...c.afflictions, aff] };
        });
    },

    addLanguage: (lang: string) => character.update(c => ({ ...c, languages: [...c.languages, lang] })),
    removeLanguage: (index: number) => character.update(c => ({ ...c, languages: c.languages.filter((_, i) => i !== index) })),

    addSense: (sense: string) => character.update(c => ({ ...c, senses: [...(c.senses || []), sense] })),
    removeSense: (index: number) => character.update(c => ({ ...c, senses: (c.senses || []).filter((_, i) => i !== index) })),

    confirmRest: () => {
        character.update(c => {
            const restoredSpells = c.spells.map(s => ({ ...s, castings: s.maxCastings }));
            const restoredTalents = c.talents.map(t => ({ ...t, uses: t.maxUses }));
            return { ...c, spells: restoredSpells, talents: restoredTalents };
        });
        damage.set(0);
        const nh = get(normalHealth);
        currentHealth.set(nh);
        modalState.set({ type: null, isOpen: false, data: null });
    },

    finalizeRoll: (data: any, modifier: number, selectedEffects: any[] = []) => {
        const char = get(character);
        const derivedStatsVal = get(derivedStats);
        const _t = get(t);

        const isAttack = data.type === 'weapon_attack';
        const isLuck = data.type === 'luck';
        const isDamage = data.type === 'weapon_damage';
        const item = data?.source;
        const sourceName = item?.name || _t('common.labels.action');
        const hasTrait = (it: any, trait: string) => it.traits && it.traits.toLowerCase().includes(trait.toLowerCase());

        if (!isDamage) {
            const d20 = Math.floor(Math.random() * 20) + 1;
            let attrMod = 0;
            let attrUsed = _t('history.source.luck');

            if (data.type === 'attribute') {
                const baseVal = derivedStatsVal[data.source.key] || data.source.value;
                attrMod = baseVal - 10;
                attrUsed = _t(`sofww.attributes.${data.source.key}`);
            } else if (isAttack) {
                let key = 'str';
                let attrLabel = _t('sofww.attributes.str');

                const isRangedAttack = item.range === 'Ranged';

                if (isRangedAttack) {
                    key = 'agi';
                    attrLabel = _t('sofww.attributes.agi');

                    if (hasTrait(item, 'Thrown')) {
                        key = 'str';
                        attrLabel = _t('sofww.attributes.str');
                    }
                }

                if (hasTrait(item, 'Nimble')) {
                    key = 'agi';
                    attrLabel = _t('sofww.attributes.agi');
                }

                const baseVal = derivedStatsVal[key] || 10;
                attrMod = baseVal - 10;
                attrUsed = attrLabel;
            }

            const effectBoons = Math.floor(selectedEffects
                .flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : [])
                .filter(m => m.target === 'boons' && m.type === MOD_TYPES.ADD)
                .reduce((acc, m) => acc + evaluateModifierValue(m.value, char), 0));

            modifier += effectBoons;

            let boonBaneTotal = 0;
            let boonBaneStr = '';

            if (modifier !== 0) {
                const numDice = Math.abs(modifier);
                let rolls = [];
                for (let i = 0; i < numDice; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
                const highest = Math.max(...rolls);

                if (modifier > 0) {
                    boonBaneTotal = highest;
                    boonBaneStr = ` + ${highest} [${_t('sofdl.rolls.boon')}]`;
                } else {
                    boonBaneTotal = -highest;
                    boonBaneStr = ` - ${highest} [${_t('sofdl.rolls.bane')}]`;
                }
            }

            const total = d20 + attrMod + boonBaneTotal;

            let description = '';
            if (isAttack) {
                description = `${_t('history.source.attack')} (${attrUsed})`;
            } else if (isLuck) {
                description = _t('history.source.luck');
            } else {
                description = `${_t('history.source.attribute')}: ${sourceName}`;
            }

            if (modifier !== 0) {
                description += ` ${_t('sofdl.rolls.attribute_test', { values: { attr: '', modifier } }).replace(/^[^ ]+ /, '')}`;
            }

            if (isAttack && d20 === 20) {
                let critEffects = [];
                if (hasTrait(item, 'Bludgeoning')) critEffects.push(_t('sofww.afflictions.vulnerable.name'));
                if (hasTrait(item, 'Piercing')) critEffects.push(_t('sofww.afflictions.weakened.name'));
                if (hasTrait(item, 'Slashing')) critEffects.push("+1d6 Dmg");
                if (critEffects.length > 0) description += `\nCRÍTICO! ${critEffects.join(" ")} `;
            }

            characterActions.addToHistory({
                source: isAttack ? 'attack' : isLuck ? 'luck' : 'attribute',
                name: sourceName,
                description: description,
                formula: `d20(${d20})${attrMod !== 0 ? (attrMod >= 0 ? '+' : '') + attrMod : ''}${boonBaneStr} `,
                total: total,
                crit: d20 === 20,
                effectsApplied: selectedEffects.map(e => e.name)
            });

            character.update(c => ({
                ...c,
                effects: c.effects.map(e => (e.isActive && e.duration === 'NEXT_ROLL') ? { ...e, isActive: false } : e)
            }));

            if (isAttack && hasTrait(item, 'Reload')) {
                character.update(c => ({
                    ...c,
                    equipment: c.equipment.map(i => i.id === item.id ? { ...i, isLoaded: false } : i)
                }));
            }

        } else {
            let baseDice = parseInt(item.damageDice) || 0;

            const isTwoHanded = (item.grip && item.grip.toLowerCase() === 'two') ||
                (item.equippedState && item.equippedState.toLowerCase() === 'two');

            if (hasTrait(item, 'Versatile') && isTwoHanded) {
                baseDice += 1;
            }

            let charBonus = (char.bonusDamage || 0);

            if (hasTrait(item, 'Light') && charBonus > 1) {
                charBonus -= 1;
            }

            const effectBonus = selectedEffects
                .flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : [])
                .filter(m => m.target === 'damage' && m.type === MOD_TYPES.ADD)
                .reduce((acc, m) => acc + evaluateModifierValue(m.value, char), 0);

            const totalBonus = charBonus + effectBonus;
            const totalDice = Math.max(0, baseDice + totalBonus + modifier);

            let results = [];
            let sum = 0;
            let originalRollsInfo = [];

            for (let i = 0; i < totalDice; i++) {
                let r = Math.floor(Math.random() * 6) + 1;

                if (r === 1 && hasTrait(item, 'Brutal')) {
                    const newR = Math.floor(Math.random() * 6) + 1;
                    originalRollsInfo.push(`1->${newR}`);
                    r = newR;
                } else {
                    originalRollsInfo.push(`${r}`);
                }

                results.push(r);
                sum += r;
            }

            damage.set(sum);

            characterActions.addToHistory({
                source: `damage`,
                name: item.name,
                description: `${_t('history.source.damage')}: ${totalDice}d6 ${hasTrait(item, 'Brutal') ? '(Brutal)' : ''}`,
                formula: `${totalDice}d6 [${results.join(', ')}] ${originalRollsInfo.some(s => s.includes('->')) ? `(Rolagens: ${originalRollsInfo.join(', ')})` : ''}`,
                total: sum,
                effectsApplied: selectedEffects.map(e => e.name)
            });

            if (item.type === ITEM_TYPES.EXPLOSIVE) characterActions.useConsumable(item);
        }

        modalState.set({ type: null, isOpen: false, data: null });
    },

    reloadWeapon: (item: WWItem) => {
        const _t = get(t);
        character.update(c => ({
            ...c,
            equipment: c.equipment.map(i => i.id === item.id ? { ...i, isLoaded: true } : i)
        }));
        characterActions.addToHistory({
            source: 'attribute', // or action? Standardized to attribute for now or action?
            name: _t('actions.reload'),
            description: `${_t('actions.reload')}: ${item.name}`
        });
    },

    addSpell: (spell: WWSpell) => character.update(c => ({ ...c, spells: [...c.spells, spell] })),
    updateSpell: (spell: WWSpell) => character.update(c => ({ ...c, spells: c.spells.map(s => s.id === spell.id ? spell : s) })),
    deleteSpell: (id: string | number) => character.update(c => ({ ...c, spells: c.spells.filter(s => s.id !== id) })),

    commitSpellCast: (spell: WWSpell) => {
        if (spell.castings > 0) {
            character.update(c => ({ ...c, spells: c.spells.map(s => s.id === spell.id ? { ...s, castings: s.castings - 1 } : s) }));
            characterActions.addToHistory({ source: 'spell', name: spell.name, description: spell.description });
            modalState.set({ type: null, isOpen: false, data: null });
        }
    },

    addTalent: (talent: WWTalent) => character.update(c => ({ ...c, talents: [...c.talents, talent] })),
    updateTalent: (talent: WWTalent) => character.update(c => ({ ...c, talents: c.talents.map(t => t.id === talent.id ? talent : t) })),
    deleteTalent: (id: string | number) => character.update(c => ({ ...c, talents: c.talents.filter(t => t.id !== id) })),

    commitTalentUse: (talent: WWTalent) => {
        if (talent.activityType === 'Duration' && talent.duration === 'LUCK_ENDS') {
            character.update(c => ({ ...c, talents: c.talents.map(t => t.id === talent.id ? { ...t, uses: 0 } : t) }));
        } else if (talent.maxUses) {
            character.update(c => ({ ...c, talents: c.talents.map(t => t.id === talent.id ? { ...t, uses: t.uses - 1 } : t) }));
        }
        characterActions.addToHistory({ source: 'talent', name: talent.name, description: talent.description });
        modalState.set({ type: null, isOpen: false, data: null });
    },

    recoverTalent: (id: string | number) => {
        character.update(c => ({ ...c, talents: c.talents.map(t => t.id === id && t.uses < t.maxUses ? { ...t, uses: (t.uses || 0) + 1 } : t) }));
    },

    rollLuckTalent: (talentId: string | number) => {
        const _t = get(t);
        const d20 = Math.floor(Math.random() * 20) + 1;
        const success = d20 >= 10;
        const char = get(character);
        const talent = char.talents.find(t => t.id === talentId);

        characterActions.addToHistory({
            source: 'luck',
            name: `${_t('character.history.source.luck')} - ${talent?.name || _t('character.talents.title')}`,
            formula: `d20(${d20})`,
            total: d20,
            description: success ? _t('character.dice_roll.luck_success', { values: { total: d20 } }) : _t('character.dice_roll.luck_failure', { values: { total: d20 } })
        });

        if (success) {
            character.update(c => ({
                ...c,
                talents: c.talents.map(t => t.id === talentId ? { ...t, uses: 1 } : t)
            }));
        }
    },

    addEffect: (effect: WWEffect) => character.update(c => ({ ...c, effects: [...c.effects, effect] })),
    updateEffect: (effect: WWEffect) => character.update(c => ({ ...c, effects: c.effects.map(e => e.id === effect.id ? effect : e) })),
    deleteEffect: (id: string) => character.update(c => ({ ...c, effects: c.effects.filter(e => e.id !== id) })),
    toggleEffect: (id: string) => character.update(c => ({
        ...c,
        effects: c.effects.map(e => {
            if (e.id === id) {
                const becomingActive = !e.isActive;
                return {
                    ...e,
                    isActive: becomingActive,
                    roundsLeft: (becomingActive && e.duration === 'ROUNDS') ? (e.initialRounds || e.roundsLeft) : e.roundsLeft
                };
            }
            return e;
        })
    })),
    cleanInactiveEffects: () => character.update(c => ({ ...c, effects: c.effects.filter(e => e.isActive) })),

    applyEffectToCharacter: (effect: Partial<WWEffect>, parentItem: any) => {
        const effectName = effect.name || (parentItem ? parentItem.name : "Effect");
        const effectDesc = effect.description || (parentItem ? parentItem.description : "");

        const newEffect: WWEffect = {
            id: uuidv7(),
            isActive: true,
            name: effectName,
            description: effectDesc,
            roundsLeft: 0,
            duration: 'PERMANENT',
            modifiers: [],
            ...effect
        } as WWEffect;

        if (newEffect.duration === 'ROUNDS' && !newEffect.initialRounds) {
            newEffect.initialRounds = newEffect.roundsLeft;
        }

        character.update(c => ({ ...c, effects: [...c.effects, newEffect] }));
    },

    checkLuckEnds: (effId: string) => {
        const _t = get(t);
        const d20 = Math.floor(Math.random() * 20) + 1;
        const success = d20 >= 10;
        characterActions.addToHistory({
            source: 'luck',
            name: _t('sofww.duration.luck_ends'),
            description: success ? _t('character.dice_roll.luck_success', { values: { total: d20 } }) : _t('character.dice_roll.luck_failure', { values: { total: d20 } })
        });
        if (success) {
            character.update(c => ({ ...c, effects: c.effects.map(e => e.id === effId ? { ...e, isActive: false } : e) }));
        }
    },

    joinCampaign: (campaign: any) => {
        character.update(c => ({
            ...c,
            campaignId: campaign.id,
            campaignName: campaign.name,
            gmName: campaign.gmName || 'Game Master'
        }));

        import('$lib/logic/sync').then(({ joinCampaignRoom }) => {
            joinCampaignRoom(campaign.id, false);
        });
    },

    leaveCampaign: () => {
        character.update(c => ({
            ...c,
            campaignId: null,
            campaignName: null,
            gmName: null,
            combatActive: false
        }));
    }
};
