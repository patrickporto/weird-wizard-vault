export const MAGIC_TRADITIONS = [
    "Aeromancy", "Alchemy", "Alteration", "Animism", "Astromancy", "Chaos",
    "Chronomancy", "Conjuration", "Cryomancy", "Dark Arts", "Destruction",
    "Divination", "Eldritch", "Enchantment", "Evocation", "Geomancy",
    "Hydromancy", "Illusion", "Invocation", "Necromancy", "Oneiromancy",
    "Order", "Primal", "Protection", "Psychomancy", "Pyromancy",
    "Shadowmancy", "Skullduggery", "Spiritualism", "Symbolism",
    "Technomancy", "Teleportation", "War"
];

export const DURATION_TYPES = {
    NEXT_ROLL: 'Próxima Rolagem',
    ROUNDS: 'Rodadas',
    MINUTES: 'Minutos',
    HOURS: 'Horas',
    DAYS: 'Dias',
    LUCK_ENDS: 'Sorte Encerra',
    PERMANENT: 'Indeterminado'
};

export const ITEM_TYPES = {
    WEAPON: 'Weapon',
    ARMOR: 'Armor',
    SHIELD: 'Shield',
    CONSUMABLE: 'Consumable',
    EXPLOSIVE: 'Explosive',
    OTHER: 'Other'
};

export const MOD_TYPES = {
    ADD: 'ADD',
    SET: 'SET',
    MULT: 'MULT'
};

export const MOD_TARGETS = {
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

export const AFFLICTIONS_DATA = {
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

export const GRIPS = { OFF: 'Off', ONE: 'One', TWO: 'Two' };
export const AVAILABILITY = ['Common', 'Uncommon', 'Rare', 'Exotic'];
export const QUALITY = ['Standard', 'Inferior', 'Superior'];