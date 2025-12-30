import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { characterActions, character, rollHistory, damage } from './characterStore';
import { MOD_TYPES } from '../../routes/sofww';

// Mock get from svelte/store if needed, but here we can use real stores
// We might need to mock Math.random though

describe('characterStore finalizeRoll', () => {
    beforeEach(() => {
        character.set({
            effects: [],
            talents: [],
            spells: [],
            equipment: [],
            attributes: [
                { key: 'str', value: 10, name: 'Força' },
                { key: 'agi', value: 10, name: 'Agilidade' }
            ],
            bonusDamage: 0
        } as any);
        rollHistory.set([]);
        damage.set(0);
        vi.spyOn(Math, 'random').mockReturnValue(0.5); // 0.5 * 20 + 1 = 11, 0.5 * 6 + 1 = 4
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should apply boon from selected effect to attack roll', () => {
        const attackData = {
            type: 'weapon_attack',
            source: { name: 'Espada', type: 'Weapon', traits: '', grip: 'One' }
        };

        const boonEffect = {
            id: '1',
            name: 'Boon Effect',
            isActive: true,
            modifiers: [{ target: 'boons', type: MOD_TYPES.ADD, value: 1 }]
        };

        // Call with 0 manual modifier, but 1 selected effect
        characterActions.finalizeRoll(attackData, 0, [boonEffect]);

        const history = get(rollHistory);
        expect(history.length).toBe(1);
        const entry = history[0];

        // With 1 boon (modifier=1), logic rolls 1d6. Mock=0.5 -> 4.
        // d20 logic: 0.5 * 20 + 1 = 11.
        // Attr logic: default str 10 -> +0.
        // Total = 11 + 0 + 4 = 15.
        expect(entry.total).toBe(15);
        expect(entry.description).toContain('com 1 boons/banes');
        expect(entry.effectsApplied).toContain('Boon Effect');
    });

    it('should apply bane from selected effect (negative value)', () => {
        const attackData = {
            type: 'weapon_attack',
            source: { name: 'Espada', type: 'Weapon' }
        };

        const baneEffect = {
            id: '2',
            name: 'Bane Effect',
            modifiers: [{ target: 'boons', type: MOD_TYPES.ADD, value: -1 }]
        };

        characterActions.finalizeRoll(attackData, 0, [baneEffect]);

        const history = get(rollHistory);
        const entry = history[0];

        // modifier becomes -1.
        // d20: 11.
        // Bane roll: 4. Total calculation subtracts highest.
        // Total = 11 - 4 = 7.
        expect(entry.total).toBe(7);
        expect(entry.description).toContain('com -1 boons/banes');
    });

    it('should apply damage bonus from selected effect', () => {
        const damageData = {
            type: 'weapon_damage',
            source: { name: 'Espada', damageDice: '1' } // 1d6
        };

        const damageEffect = {
            id: '3',
            name: 'Damage Buff',
            modifiers: [{ target: 'damage', type: MOD_TYPES.ADD, value: 1 }]
        };

        // Call finalizeRoll
        characterActions.finalizeRoll(damageData, 0, [damageEffect]);

        // Logic:
        // baseDice: 1
        // charBonus: 0
        // effectBonus: 1
        // totalDice: 1 + 0 + 1 = 2 dice.
        // Roll: 2 * (0.5*6+1 = 4) = 8.

        const currentDmg = get(damage);
        expect(currentDmg).toBe(8);

        const history = get(rollHistory);
        const entry = history[0];
        expect(entry.total).toBe(8);
        expect(entry.effectsApplied).toContain('Damage Buff');
    });
});
