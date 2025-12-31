import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { sotdlCharacter, sotdlCharacterActions, sotdlTotalHealingRate } from './characterStoreSotDL';

describe('SotDL Store - Expression Evaluation (expr-eval)', () => {
    beforeEach(() => {
        sotdlCharacter.set({
            id: 'test-sotdl',
            system: 'sofdl',
            name: "Test Warrior",
            level: 3,
            ancestry: "Human",
            paths: { novice: "Warrior", expert: "", master: "" },
            attributes: {
                strength: 12,
                agility: 10,
                intellect: 10,
                will: 10
            },
            perception: 10,
            defense: 12,
            health: 24,
            healingRate: 6,
            size: 1,
            speed: 10,
            power: 0,
            damage: 0,
            insanity: 0,
            corruption: 0,
            description: '',
            notes: '',
            professions: [],
            languages: [],
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
        });
    });

    it('should evaluate expression in healing_rate modifier', () => {
        // We want to add an effect that adds strength to healing rate
        const char = get(sotdlCharacter);
        sotdlCharacter.set({
            ...char,
            effects: [{
                id: 'mod-hr',
                name: 'Toughness',
                isActive: true,
                modifiers: [{ target: 'healing_rate', type: 'ADD', value: '@strength / 2' }]
            }]
        });

        // strength is 12, so 12/2 = 6. Base is 6. Total should be 12.
        expect(get(sotdlTotalHealingRate)).toBe(12);
    });
});
