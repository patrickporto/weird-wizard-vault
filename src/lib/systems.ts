export interface GameSystem {
    id: string;
    nameKey: string;
    descriptionKey: string;
    disabled?: boolean;
    comingSoon?: boolean;
}

export const SYSTEMS: GameSystem[] = [
    {
        id: 'sofww',
        nameKey: 'common.systems.sofww.name',
        descriptionKey: 'common.systems.sofww.description'
    },
    {
        id: 'sofdl',
        nameKey: 'common.systems.sofdl.name',
        descriptionKey: 'common.systems.sofdl.description'
    },
    {
        id: 'dle',
        nameKey: 'common.systems.dle.name',
        descriptionKey: 'common.systems.dle.description',
        disabled: true,
        comingSoon: true
    }
];

export const DEFAULT_SYSTEM = 'sofww';

export type InitiativeStyle = 'dle' | 'standard' | 'team' | 'individual';

export type TierLevel = 'starting' | 'novice' | 'expert' | 'master';

export interface TierOption {
    value: TierLevel;
    labelKey: string;
}

export const TIERS: TierOption[] = [
    { value: 'starting', labelKey: 'campaign.settings.tiers.starting' },
    { value: 'novice', labelKey: 'campaign.settings.tiers.novice' },
    { value: 'expert', labelKey: 'campaign.settings.tiers.expert' },
    { value: 'master', labelKey: 'campaign.settings.tiers.master' }
];

export function getDefaultTier(systemId?: string): TierLevel {
    // Demon Lord starts at 'starting', Weird Wizard starts at 'novice'
    return systemId === 'sofdl' ? 'starting' : 'novice';
}

export function getAvailableTiers(systemId?: string): TierOption[] {
  return TIERS;
}

export function getSystem(id?: string): GameSystem {
    return SYSTEMS.find(s => s.id === id) || SYSTEMS.find(s => s.id === DEFAULT_SYSTEM)!;
}

export function isSystemDisabled(id: string): boolean {
    const system = SYSTEMS.find(s => s.id === id);
    return !!system?.disabled;
}
