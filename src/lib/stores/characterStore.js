
import { writable, derived, get } from 'svelte/store';
import { uuidv7 } from 'uuidv7';
import {
    ITEM_TYPES,
    MOD_TYPES,
    QUALITY,
    GRIPS,
} from "../../routes/sofww";

// --- STATE ---

export const defaultCharacter = {
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
    campaignId: null,
    campaignName: null,
    gmName: null,
    combatActive: false,
    initiative: false,
    acted: false,
    spells: [
        { id: 1, name: "Seta de Energia", tier: "Novice", type: "Ataque", tradition: "Destruction", description: "Causa 1d6 de dano a um alvo em alcance curto.", castings: 3, maxCastings: 3, effect: null },
        {
            id: 2, name: "Escudo Mágico", tier: "Novice", type: "Utilidade", tradition: "Protection", description: "+2 em Defesa por 1 minuto.", castings: 2, maxCastings: 2, effect: {
                id: 999, name: "Escudo Mágico", duration: "MINUTES", roundsLeft: 10, initialRounds: 10, description: "+2 Defesa", isActive: true,
                modifiers: [{ target: 'defense', type: MOD_TYPES.ADD, value: 2 }]
            }
        }
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

export const character = writable(defaultCharacter);
export const rollHistory = writable([]);
export const modalState = writable({ type: null, isOpen: false, data: null });
export const activeTab = writable('acoes');
export const normalHealth = writable(24);
export const currentHealth = writable(24);
export const damage = writable(0);
export const isHistoryOpen = writable(false);

// --- DERIVED STORES & HELPERS ---

export const activeEffects = derived(character, $char => {
    const standardEffects = $char.effects.filter(e => e.isActive);
    const talentEffects = $char.talents
        .filter(t => (t.isPassive || t.activityType === 'Passive') && t.effect)
        .map(t => ({
            ...t.effect,
            id: `talent-effect-${t.id}`, // Ensure unique ID for these virtual effects
            name: t.name, // Use talent name for clarity
            sourceType: 'talent',
            sourceId: t.id
        }));
    return [...standardEffects, ...talentEffects];
});

// Helper for generic stat calculation (non-store, purely functional logic used inside derived)
function calculateDerivedStat(key, baseValue, effects) {
    let value = baseValue || 0;
    const allMods = effects.flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : []);

    const sets = allMods.filter(m => m.target === key && m.type === MOD_TYPES.SET);
    if (sets.length > 0) value = sets[sets.length - 1].value;

    const adds = allMods.filter(m => m.target === key && m.type === MOD_TYPES.ADD);
    adds.forEach(m => { value += m.value; });

    const mults = allMods.filter(m => m.target === key && m.type === MOD_TYPES.MULT);
    mults.forEach(m => { value *= m.value; });

    return Math.floor(value);
}

// Store for checking stats easily in components
export const derivedStats = derived([character, activeEffects], ([$char, $effects]) => {
    const stats = {};
    $char.attributes.forEach(attr => {
        stats[attr.key] = calculateDerivedStat(attr.key, attr.value, $effects);
    });
    return stats;
});

// effectiveMaxHealth: currentHealth + active effect modifiers
// normalHealth is just a reference, currentHealth is the actual cap that can be reduced
export const effectiveMaxHealth = derived([currentHealth, activeEffects], ([$ch, $effects]) => {
    return calculateDerivedStat('health', $ch, $effects);
});

// tempHealth: bonus health from effects (any health above normalHealth)
export const tempHealth = derived([effectiveMaxHealth, normalHealth], ([$emh, $nh]) => {
    return Math.max(0, $emh - $nh);
});

// damagePercentage: damage relative to currentHealth (vida atual), not effectiveMaxHealth
export const damagePercentage = derived([damage, currentHealth], ([$dmg, $ch]) => {
    return $ch > 0 ? Math.min(100, ($dmg / $ch) * 100) : 100;
});

// isIncapacitated: damage >= currentHealth
export const isIncapacitated = derived([damage, currentHealth], ([$dmg, $ch]) => {
    return $dmg >= $ch;
});

// isInjured: damage >= 50% of currentHealth but not incapacitated
export const isInjured = derived([damage, currentHealth, isIncapacitated], ([$dmg, $ch, $incap]) => {
    return $dmg >= ($ch / 2) && !$incap;
});

export const effectiveSpeed = derived([character, derivedStats, activeEffects], ([$char, $stats, $effects]) => {
    // We can use calculateDerivedStat for base modifiers
    let s = calculateDerivedStat('speed', $char.speed, $effects);
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

    // Explicitly use the helper logic here as we would in the component
    return calculateDerivedStat('defense', defense + shieldBonus, $effects);
});

export const damageBonus = derived([character, activeEffects], ([$char, $effects]) => {
    const allMods = $effects.flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : []);
    const bonus = allMods.filter(m => m.target === 'damage' && m.type === MOD_TYPES.ADD).reduce((acc, m) => acc + m.value, 0);
    return ($char.bonusDamage || 0) + bonus;
});


// --- ACTIONS ---

export const characterActions = {
    updateCurrency: (type, amount) => {
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

    advanceRound: (direction) => {
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

    addToHistory: (rollData, shouldSync = true) => {
        const char = get(character);
        const history = get(rollHistory);

        // If the roll already has an ID, check if it's already in the history (prevent duplicates from sync)
        if (rollData.id && history.find(r => r.id === rollData.id)) {
            return;
        }

        const entry = {
            id: rollData.id || uuidv7(),
            timestamp: rollData.timestamp || new Date(),
            charName: char.name,
            ...rollData
        };

        rollHistory.update(h => [entry, ...h]);
        isHistoryOpen.set(true);

        // Sync via Trystero if in a campaign
        if (shouldSync && char.campaignId) {
            import('$lib/logic/sync').then(({ syncRoll }) => {
                syncRoll(entry);
            });
        }
    },

    clearHistory: () => rollHistory.set([]),

    // Generic CRUD helpers
    addItem: (item) => character.update(c => ({ ...c, equipment: [...c.equipment, item] })),
    updateItem: (item) => character.update(c => ({ ...c, equipment: c.equipment.map(i => i.id === item.id ? item : i) })),
    deleteItem: (id) => character.update(c => ({ ...c, equipment: c.equipment.filter(i => i.id !== id) })),

    useConsumable: (item) => {
        if (item.quantity > 0) {
            characterActions.updateItem({ ...item, quantity: item.quantity - 1 });
            characterActions.addToHistory({ source: 'Consumível', name: item.name, description: `Usou ${item.name} ` });
        }
    },

    equipItem: (item, state = null) => {
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

    toggleAffliction: (aff) => {
        character.update(c => {
            if (c.afflictions.includes(aff)) return { ...c, afflictions: c.afflictions.filter(a => a !== aff) };
            return { ...c, afflictions: [...c.afflictions, aff] };
        });
    },

    addLanguage: (lang) => character.update(c => ({ ...c, languages: [...c.languages, lang] })),
    removeLanguage: (index) => character.update(c => ({ ...c, languages: c.languages.filter((_, i) => i !== index) })),

    confirmRest: () => {
        character.update(c => {
            const restoredSpells = c.spells.map(s => ({ ...s, castings: s.maxCastings }));
            const restoredTalents = c.talents.map(t => ({ ...t, uses: t.maxUses }));
            return { ...c, spells: restoredSpells, talents: restoredTalents };
        });
        damage.set(0);
        const nh = get(normalHealth);
        currentHealth.set(nh); // assuming full heal? logic in original was cur = normal.
        modalState.set({ type: null, isOpen: false, data: null });
    },

    finalizeRoll: (data, modifier, selectedEffects = []) => {
        const char = get(character);
        const derivedStatsVal = get(derivedStats); // map of key -> val

        const isAttack = data.type === 'weapon_attack';
        const isLuck = data.type === 'luck';
        const isDamage = data.type === 'weapon_damage';
        const item = data.source;
        const sourceName = item.name || 'Ação';
        const hasTrait = (it, trait) => it.traits && it.traits.toLowerCase().includes(trait.toLowerCase());

        if (!isDamage) {
            const d20 = Math.floor(Math.random() * 20) + 1;
            let attrMod = 0;
            let attrUsed = 'Sorte'; // Default label

            if (data.type === 'attribute') {
                const baseVal = derivedStatsVal[data.source.key] || data.source.value;
                attrMod = baseVal - 10;
                attrUsed = data.source.name;
            } else if (isAttack) {
                // Default Weapon Attack Attribute: Strength
                let key = 'str';
                let attrLabel = 'Força';

                // Ranges: Melee vs Ranged
                // Rule: Ranged attacks use Agility. Melee uses Strength.
                const isRangedAttack = item.range === 'Ranged';

                if (isRangedAttack) {
                    key = 'agi';
                    attrLabel = 'Agilidade';

                    // THROWN: Uses Strength unless Nimble
                    if (hasTrait(item, 'Thrown')) {
                        key = 'str';
                        attrLabel = 'Força';
                    }
                }

                // NIMBLE: Overrides all, allows Agility
                if (hasTrait(item, 'Nimble')) {
                    key = 'agi';
                    attrLabel = 'Agilidade';
                }

                const baseVal = derivedStatsVal[key] || 10;
                attrMod = baseVal - 10;
                attrUsed = attrLabel;
            }

            // Calculate Boons/Banes from Effects
            // Target: 'boons' -> Value is added to modifier. 
            // Positive value = Boons, Negative value = Banes (handled by modifier logic below)
            const effectBoons = selectedEffects
                .flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : [])
                .filter(m => m.target === 'boons' && m.type === MOD_TYPES.ADD)
                .reduce((acc, m) => acc + m.value, 0);

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
                    boonBaneStr = ` + ${highest} [Boon]`;
                } else {
                    boonBaneTotal = -highest;
                    boonBaneStr = ` - ${highest} [Bane]`;
                }
            }

            const total = d20 + attrMod + boonBaneTotal;
            let description = isAttack ? `Ataque (${attrUsed})` : isLuck ? `Teste de Sorte` : `Teste de ${sourceName}`;
            if (modifier !== 0) description += ` com ${modifier} boons/banes`;

            if (isAttack && d20 === 20) {
                let critEffects = [];
                if (hasTrait(item, 'Bludgeoning')) critEffects.push("Vuln");
                if (hasTrait(item, 'Piercing')) critEffects.push("Weakened");
                if (hasTrait(item, 'Slashing')) critEffects.push("+1d6 Dmg");
                if (critEffects.length > 0) description += `\nCRÍTICO! ${critEffects.join(" ")} `;
            }

            characterActions.addToHistory({
                source: isAttack ? 'Ataque' : isLuck ? 'Sorte' : 'Atributo',
                name: sourceName,
                description: description,
                formula: `d20(${d20})${attrMod !== 0 ? (attrMod >= 0 ? '+' : '') + attrMod : ''}${boonBaneStr} `,
                total: total,
                crit: d20 === 20,
                effectsApplied: selectedEffects.map(e => e.name)
            });

            // Consume NEXT_ROLL effects
            character.update(c => ({
                ...c,
                effects: c.effects.map(e => (e.isActive && e.duration === 'NEXT_ROLL') ? { ...e, isActive: false } : e)
            }));

            // Handle RELOAD trait usage (set isLoaded = false)
            if (isAttack && hasTrait(item, 'Reload')) {
                character.update(c => ({
                    ...c,
                    equipment: c.equipment.map(i => i.id === item.id ? { ...i, isLoaded: false } : i)
                }));
            }

        } else {
            // Damage Logic
            let baseDice = parseInt(item.damageDice) || 0;

            // VERSATILE: +1d6 if two-handed (Check both static grip and equipped state)
            const isTwoHanded = (item.grip && item.grip.toLowerCase() === 'two') ||
                (item.equippedState && item.equippedState.toLowerCase() === 'two');

            if (hasTrait(item, 'Versatile') && isTwoHanded) {
                baseDice += 1;
            }

            let charBonus = (char.bonusDamage || 0);

            // LIGHT: Reduce bonus damage die by 1
            if (hasTrait(item, 'Light') && charBonus > 1) {
                charBonus -= 1;
            }

            // Effect Bonus
            const effectBonus = selectedEffects
                .flatMap(e => Array.isArray(e.modifiers) ? e.modifiers : [])
                .filter(m => m.target === 'damage' && m.type === MOD_TYPES.ADD)
                .reduce((acc, m) => acc + m.value, 0);

            const totalBonus = charBonus + effectBonus;
            const totalDice = Math.max(0, baseDice + totalBonus + modifier);

            let results = [];
            let sum = 0;
            let originalRollsInfo = [];

            for (let i = 0; i < totalDice; i++) {
                let r = Math.floor(Math.random() * 6) + 1;

                // BRUTAL: Reroll 1s

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
                source: `Dano`,
                name: item.name,
                description: `Dano: ${totalDice}d6 ${hasTrait(item, 'Brutal') ? '(Brutal)' : ''}`,
                formula: `${totalDice}d6 [${results.join(', ')}] ${originalRollsInfo.some(s => s.includes('->')) ? `(Rolagens: ${originalRollsInfo.join(', ')})` : ''}`,
                total: sum,
                effectsApplied: selectedEffects.map(e => e.name)
            });

            if (item.type === ITEM_TYPES.EXPLOSIVE) characterActions.useConsumable(item);
        }

        modalState.set({ type: null, isOpen: false, data: null });
        isHistoryOpen.set(true);
    },

    reloadWeapon: (item) => {
        character.update(c => ({
            ...c,
            equipment: c.equipment.map(i => i.id === item.id ? { ...i, isLoaded: true } : i)
        }));
        characterActions.addToHistory({ source: 'Ação', name: 'Recarregar', description: `Recarregou ${item.name}` });
    },

    // Spells / Talents Management

    addSpell: (spell) => character.update(c => ({ ...c, spells: [...c.spells, spell] })),
    updateSpell: (spell) => character.update(c => ({ ...c, spells: c.spells.map(s => s.id === spell.id ? spell : s) })),
    deleteSpell: (id) => character.update(c => ({ ...c, spells: c.spells.filter(s => s.id !== id) })),

    commitSpellCast: (spell) => {
        if (spell.castings > 0) {
            character.update(c => ({ ...c, spells: c.spells.map(s => s.id === spell.id ? { ...s, castings: s.castings - 1 } : s) }));
            characterActions.addToHistory({ source: 'Magia', name: spell.name, description: spell.description });
            modalState.set({ type: null, isOpen: false, data: null });
        }
    },

    addTalent: (talent) => character.update(c => ({ ...c, talents: [...c.talents, talent] })),
    updateTalent: (talent) => character.update(c => ({ ...c, talents: c.talents.map(t => t.id === talent.id ? talent : t) })),
    deleteTalent: (id) => character.update(c => ({ ...c, talents: c.talents.filter(t => t.id !== id) })),

    commitTalentUse: (talent) => {
        if (talent.activityType === 'Duration' && talent.duration === 'LUCK_ENDS') {
            character.update(c => ({ ...c, talents: c.talents.map(t => t.id === talent.id ? { ...t, uses: 0 } : t) }));
        } else if (talent.maxUses) {
            character.update(c => ({ ...c, talents: c.talents.map(t => t.id === talent.id ? { ...t, uses: t.uses - 1 } : t) }));
        }
        characterActions.addToHistory({ source: 'Talento', name: talent.name, description: talent.description });
        modalState.set({ type: null, isOpen: false, data: null });
    },
    recoverTalent: (id) => {
        character.update(c => ({ ...c, talents: c.talents.map(t => t.id === id && t.uses < t.maxUses ? { ...t, uses: t.uses + 1 } : t) }));
    },
    rollLuckTalent: (talentId) => {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const success = d20 >= 10;
        const char = get(character);
        const talent = char.talents.find(t => t.id === talentId);

        characterActions.addToHistory({
            source: 'Sorte',
            name: `Teste de Sorte - ${talent?.name || 'Talento'}`,
            formula: `d20(${d20})`,
            total: d20,
            description: `Rolou ${d20}. ${success ? 'Sucesso! Talento recuperado.' : 'Falha. O talento continua indisponível.'}`
        });

        if (success) {
            character.update(c => ({
                ...c,
                talents: c.talents.map(t => t.id === talentId ? { ...t, uses: 1 } : t)
            }));
        }
    },

    // Effects
    addEffect: (effect) => character.update(c => ({ ...c, effects: [...c.effects, effect] })),
    updateEffect: (effect) => character.update(c => ({ ...c, effects: c.effects.map(e => e.id === effect.id ? effect : e) })),
    deleteEffect: (id) => character.update(c => ({ ...c, effects: c.effects.filter(e => e.id !== id) })),
    toggleEffect: (id) => character.update(c => ({
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

    applyEffectToCharacter: (effect, parentItem) => {
        const effectName = effect.name || (parentItem ? parentItem.name : "Efeito sem nome");
        const effectDesc = effect.description || (parentItem ? parentItem.description : "");

        const newEffect = {
            ...effect,
            id: uuidv7(),
            isActive: true,
            name: effectName,
            description: effectDesc
        };

        if (newEffect.duration === 'ROUNDS' && !newEffect.initialRounds) {
            newEffect.initialRounds = newEffect.roundsLeft;
        }

        character.update(c => ({ ...c, effects: [...c.effects, newEffect] }));
    },

    checkLuckEnds: (effId) => {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const success = d20 >= 10;
        characterActions.addToHistory({ source: 'Sorte', name: 'Check Fim Efeito', description: `Rolou ${d20}. ${success ? 'Sucesso (Encerra)' : 'Falha'} ` });
        if (success) {
            character.update(c => ({ ...c, effects: c.effects.map(e => e.id === effId ? { ...e, isActive: false } : e) }));
        }
    },

    joinCampaign: (campaign) => {
        character.update(c => ({
            ...c,
            campaignId: campaign.id,
            campaignName: campaign.name,
            gmName: campaign.gmName || 'Mestre'
        }));

        // Connect to Trystero
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

// Auto Affliction Logic (Subscription)
// Ideally this logic runs whenever damage or maxHealth changes?
// In Svelte store, we can use a derived or just subscribe?
// Let's create a "subscriber" to keep consistency if we want to strictly follow the "logic outside components"
damage.subscribe($dmg => {
    // We also need $effectiveMaxHealth.
    // This is hard to do cleanly inside the store definition file without creating a circular dependency loop or complex setup.
    // For now, I will leave the "Auto Affliction" logic to be called or leave it in the main page / component that binds them?
    // BETTER: Use a derived store that *returns* if it should be incapacitated, and let a component handle the side effect?
    // OR: Just keep it reactive in the Vitals component.
});
