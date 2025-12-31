import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { character, characterActions, damageBonus, derivedStats } from './characterStore';

describe('Character Store - Expression Evaluation (expr-eval)', () => {
    beforeEach(() => {
        character.set({
            name: "Test Wizard",
            level: 5,
            ancestry: "Elf",
            paths: { novice: "Wizard", expert: "", master: "" },
            attributes: [
                { name: "Strength", value: 10, key: "str" },
                { name: "Agility", value: 12, key: "agi" },
                { name: "Intellect", value: 15, key: "int" },
                { name: "Will", value: 13, key: "wil" }
            ],
            currency: { gp: 0, sp: 0, cp: 0 },
            naturalDefense: 10,
            bonusDamage: 0,
            speed: 10,
            currentRound: 1,
            languages: [],
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
        });
    });

    it('should evaluate a numeric modifier correctly', () => {
        characterActions.addEffect({
            id: 'mod1',
            name: 'Generic Buff',
            isActive: true,
            duration: 'PERMANENT',
            roundsLeft: 0,
            description: '',
            modifiers: [{ target: 'damage', type: 'ADD', value: 5 }]
        });

        expect(get(damageBonus)).toBe(5);
    });

    it('should evaluate an expression using @str', () => {
        characterActions.addEffect({
            id: 'mod2',
            name: 'Strength Buff',
            isActive: true,
            duration: 'PERMANENT',
            roundsLeft: 0,
            description: '',
            modifiers: [{ target: 'damage', type: 'ADD', value: '@str / 2' }]
        });

        // str is 10, so 10/2 = 5
        expect(get(damageBonus)).toBe(5);
    });

    it('should evaluate an expression using level', () => {
        characterActions.addEffect({
            id: 'mod3',
            name: 'Level Buff',
            isActive: true,
            duration: 'PERMANENT',
            roundsLeft: 0,
            description: '',
            modifiers: [{ target: 'damage', type: 'ADD', value: '@level' }]
        });

        // level is 5
        expect(get(damageBonus)).toBe(5);
    });

    it('should evaluate a complex expression', () => {
        characterActions.addEffect({
            id: 'mod4',
            name: 'Complex Buff',
            isActive: true,
            duration: 'PERMANENT',
            roundsLeft: 0,
            description: '',
            modifiers: [{ target: 'damage', type: 'ADD', value: '(@int + @level) / 4' }]
        });

        // (15 + 5) / 4 = 5
        expect(get(damageBonus)).toBe(5);
    });

    it('should handle invalid expressions gracefully (return 0)', () => {
        characterActions.addEffect({
            id: 'mod5',
            name: 'Broken Buff',
            isActive: true,
            duration: 'PERMANENT',
            roundsLeft: 0,
            description: '',
            modifiers: [{ target: 'damage', type: 'ADD', value: '@invalid + 1' }]
        });

        expect(get(damageBonus)).toBe(0);
    });
});
