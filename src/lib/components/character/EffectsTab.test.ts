import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import EffectsTab from './EffectsTab.svelte';
import { character } from '$lib/stores/characterStore';

// Mock svelte-i18n
vi.mock('svelte-i18n', () => ({
    t: { subscribe: (fn: (value: (key: string) => string) => void) => { fn((key: string) => key); return () => { }; } }
}));

describe('EffectsTab', () => {
    beforeEach(() => {
        // Reset character store
        character.set({
            effects: [],
            talents: [
                {
                    id: 'passive-talent-1',
                    name: 'Passive Strength',
                    isPassive: true,
                    effect: {
                        name: 'Passive Strength Effect',
                        description: '+1 Strength',
                        modifiers: [{ target: 'str', type: 'ADD', value: 1 }],
                        isActive: true
                    }
                }
            ],
            combatActive: false
        } as any);
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('should display manual effects', () => {
        character.update(c => ({
            ...c,
            effects: [{
                id: 'manual-effect',
                name: 'Manual Shield',
                description: 'Shield spell',
                isActive: true,
                duration: 'ROUNDS',
                modifiers: []
            }]
        }));

        render(EffectsTab);

        expect(screen.getByText('Manual Shield')).toBeTruthy();
    });

    it('should display passive talent effects', () => {
        // This test fails if EffectsTab only iterates over $character.effects
        // verifying the user reported bug
        render(EffectsTab);

        expect(screen.getByText('Passive Strength')).toBeTruthy();
    });
});
