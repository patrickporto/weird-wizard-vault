import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import { writable } from 'svelte/store';
import ActionsTab from './ActionsTab.svelte';
import { character } from '$lib/stores/characterStore';

// Mock the store
vi.mock('$lib/stores/characterStore', () => {
    const charStore = writable({
        name: 'Test',
        level: 1,
        ancestry: 'Human',
        paths: { novice: 'Test', expert: 'Test', master: 'Test' },
        attributes: [],
        currency: { gp: 0, sp: 0, cp: 0 },
        naturalDefense: 10,
        bonusDamage: 0,
        speed: 10,
        currentRound: 1,
        languages: [],
        afflictions: [],
        effects: [],
        notes: '',
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

    return {
        character: charStore,
        activeTab: writable('acoes'),
        modalState: writable({}),
        characterActions: {
            useConsumable: vi.fn()
        }
    };
});

describe('ActionsTab Component', () => {
    it('should show empty state when no actions are available', () => {
        character.set({
            name: 'Test',
            level: 1,
            ancestry: 'Human',
            paths: { novice: 'Test', expert: 'Test', master: 'Test' },
            attributes: [],
            currency: { gp: 0, sp: 0, cp: 0 },
            naturalDefense: 10,
            bonusDamage: 0,
            speed: 10,
            currentRound: 1,
            languages: [],
            afflictions: [],
            effects: [],
            notes: '',
            campaignId: null,
            campaignName: null,
            gmName: null,
            combatActive: false,
            initiative: false,
            acted: false,
            spells: [],
            talents: [],
            equipment: []
        } as any);

        render(ActionsTab);

        // Using English translations (en.json character.actions.empty_title/empty_desc)
        expect(screen.getByText(/Ready for Combat\?/i)).toBeTruthy();
        expect(screen.getByText(/Your quick actions list is empty/i)).toBeTruthy();
    });
});
