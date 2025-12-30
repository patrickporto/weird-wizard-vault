export interface GameSystem {
    id: string;
    name: string;
    description: string;
    disabled?: boolean;
    comingSoon?: boolean;
}

export const SYSTEMS: GameSystem[] = [
    {
        id: 'sofww',
        name: 'Shadow of the Weird Wizard',
        description: 'A fantasy roleplaying game of dark magic and perilous quests.'
    },
    {
        id: 'sofdl',
        name: 'Shadow of the Demon Lord',
        description: 'A dark fantasy tabletop RPG.',
        disabled: true,
        comingSoon: true
    },
    {
        id: 'dle',
        name: 'Demon Lord Engine',
        description: 'A system agnostic engine based on the Demon Lord mechanics.',
        disabled: true,
        comingSoon: true
    }
];

export const DEFAULT_SYSTEM = 'sofww';

export function getSystem(id?: string): GameSystem {
    return SYSTEMS.find(s => s.id === id) || SYSTEMS.find(s => s.id === DEFAULT_SYSTEM)!;
}

export function isSystemDisabled(id: string): boolean {
    const system = SYSTEMS.find(s => s.id === id);
    return !!system?.disabled;
}
