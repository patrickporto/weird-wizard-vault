export const DURATION_TYPES: Record<string, string> = {
    NEXT_ROLL: 'Próxima Rolagem',
    ROUNDS: 'Rodadas',
    MINUTES: 'Minutos',
    HOURS: 'Horas',
    DAYS: 'Dias',
    LUCK_ENDS: 'Sorte Encerra',
    PERMANENT: 'Indeterminado',
    END_OF_ROUND: 'Fim da Rodada',
    CONCENTRATION: 'Concentração'
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
    boons: 'Boons/Banes',
    healing_rate: 'Taxa de Cura'
};

export const ITEM_TYPES = {
    WEAPON: 'Weapon',
    ARMOR: 'Armor',
    SHIELD: 'Shield',
    CONSUMABLE: 'Consumable',
    EXPLOSIVE: 'Explosive',
    OTHER: 'Other'
};

export const MAGIC_TRADITIONS = [
    "Aeromancy", "Alchemy", "Alteration", "Animism", "Astromancy", "Chaos",
    "Chronomancy", "Conjuration", "Cryomancy", "Dark Arts", "Destruction",
    "Divination", "Eldritch", "Enchantment", "Evocation", "Geomancy",
    "Hydromancy", "Illusion", "Invocation", "Necromancy", "Oneiromancy",
    "Order", "Primal", "Protection", "Psychomancy", "Pyromancy",
    "Shadowmancy", "Skullduggery", "Spiritualism", "Symbolism",
    "Technomancy", "Teleportation", "War"
];

// SotDL Castings by Power Level and Spell Rank
// Row = Power (0-10), Column = Rank (0-10)
export const SOTDL_CASTINGS_TABLE: number[][] = [
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // Power 0
    [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // Power 1
    [3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],  // Power 2
    [4, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0],  // Power 3
    [5, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0],  // Power 4
    [6, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0],  // Power 5
    [7, 3, 2, 2, 2, 1, 1, 0, 0, 0, 0],  // Power 6
    [8, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0],  // Power 7
    [9, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0],  // Power 8
    [10, 3, 3, 3, 2, 2, 1, 1, 1, 1, 0], // Power 9
    [11, 3, 3, 3, 3, 2, 1, 1, 1, 1, 1]  // Power 10
];

export const SOTDL_TRADITIONS = [
    "Air", "Alteration", "Arcana", "Battle", "Celestial", "Chaos",
    "Conjuration", "Curse", "Death", "Demonology", "Destruction",
    "Divination", "Enchantment", "Ether", "Fey", "Fire", "Forbidden",
    "Illusion", "Life", "Metal", "Nature", "Necromancy", "Order",
    "Primal", "Protection", "Rune", "Shadow", "Song", "Soul",
    "Spiritualism", "Storm", "Technomancy", "Telekinesis", "Telepathy",
    "Teleportation", "Theurgy", "Time", "Transformation", "Water"
];

export function getSotDLCastings(power: number, rank: number): number {
    if (power < 0 || power > 10 || rank < 0 || rank > 10) return 0;
    return SOTDL_CASTINGS_TABLE[power]?.[rank] ?? 0;
}
