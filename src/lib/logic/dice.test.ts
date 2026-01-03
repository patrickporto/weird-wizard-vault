// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { calculateDiceRoll, evaluateDiceFormula } from './dice';

describe('Dice Logic', () => {
    it('should roll basic d20', () => {
        const result = calculateDiceRoll(20, 1, 0);
        expect(result.results.length).toBe(1);
        expect(result.results[0]).toBeGreaterThanOrEqual(1);
        expect(result.results[0]).toBeLessThanOrEqual(20);
        expect(result.total).toBe(result.results[0]);
    });

    it('should apply boons on d20', () => {
        // Mock math.random? Or check constraints.
        // modifier +1 means 1d6 boon.
        // total = d20 + d6.
        const result = calculateDiceRoll(20, 1, 1);
        expect(result.bonusRolls.length).toBe(1);
        expect(result.modifierTotal).toBeGreaterThanOrEqual(1);
        expect(result.modifierTotal).toBeLessThanOrEqual(6);
        expect(result.total).toBe(result.results[0] + result.modifierTotal);
        expect(result.formula).toContain('[Boon]');
    });

    it('should apply banes on d20', () => {
        const result = calculateDiceRoll(20, 1, -1);
        expect(result.bonusRolls.length).toBe(1);
        expect(result.modifierTotal).toBeLessThanOrEqual(-1);
        expect(result.modifierTotal).toBeGreaterThanOrEqual(-6);
        expect(result.total).toBe(result.results[0] + result.modifierTotal);
        expect(result.formula).toContain('[Bane]');
    });

    it('should apply flat modifier on non-d20', () => {
        const result = calculateDiceRoll(6, 2, 2);
        // 2d6 + 2
        expect(result.results.length).toBe(2);
        expect(result.modifierTotal).toBe(2);
        expect(result.total).toBe(result.results.reduce((a, b) => a + b, 0) + 2);
        expect(result.formula).not.toContain('Boon');
    });

    it('should handle multiple boons (take highest)', () => {
        // Use a loop to try to hit a case where rolls differ if possible, but statistically checks are fine for now.
        const result = calculateDiceRoll(20, 1, 3);
        expect(result.bonusRolls.length).toBe(3);
        const max = Math.max(...result.bonusRolls);
        expect(result.modifierTotal).toBe(max);
    });

    describe('Formula Evaluation', () => {
        it('should evaluate simple dice', () => {
            const result = evaluateDiceFormula('1d6');
            expect(result.results.length).toBe(1);
            expect(result.total).toBeGreaterThanOrEqual(1);
            expect(result.total).toBeLessThanOrEqual(6);
        });

        it('should evaluate addition', () => {
            const result = evaluateDiceFormula('1d4 + 2');
            expect(result.total).toBeGreaterThanOrEqual(3);
            expect(result.total).toBeLessThanOrEqual(6);
        });

        it('should evaluate mixed dice', () => {
            const result = evaluateDiceFormula('1d6 + 1d4');
            expect(result.results.length).toBe(2);
            expect(result.total).toBeGreaterThanOrEqual(2);
            expect(result.total).toBeLessThanOrEqual(10);
        });

        it('should evaluate subtraction', () => {
            const result = evaluateDiceFormula('1d1 - 5');
            expect(result.total).toBe(-4);
        });

        it('should handle demon lord 1d3', () => {
            const result = evaluateDiceFormula('1d3');
            expect(result.total).toBeGreaterThanOrEqual(1);
            expect(result.total).toBeLessThanOrEqual(3);
        });
    });
});
