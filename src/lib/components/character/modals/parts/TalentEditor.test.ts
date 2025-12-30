import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import TalentEditor from './TalentEditor.svelte';
import { modalState, characterActions } from '$lib/stores/characterStore';

// Mock uuidv7
vi.mock('uuidv7', () => ({
    uuidv7: () => 'test-uuid-123'
}));

// Mock svelte-i18n
vi.mock('svelte-i18n', () => ({
    t: { subscribe: (fn: (value: (key: string) => string) => void) => { fn((key: string) => key); return () => { }; } }
}));

describe('TalentEditor', () => {
    beforeEach(() => {
        vi.stubGlobal('alert', vi.fn());
        modalState.set({ type: null, isOpen: false, data: null });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('should render when modal is open with type "talent"', () => {
        modalState.set({ type: 'talent', isOpen: true, data: null });
        render(TalentEditor);

        expect(screen.getByText('character.modals.talent_editor')).toBeTruthy();
    });

    it('should not render when modal is closed', () => {
        modalState.set({ type: 'talent', isOpen: false, data: null });
        render(TalentEditor);

        expect(screen.queryByText('character.modals.talent_editor')).toBeNull();
    });

    it('should show validation error when trying to save without name', async () => {
        const alertMock = vi.fn();
        vi.stubGlobal('alert', alertMock);

        modalState.set({ type: 'talent', isOpen: true, data: null });
        render(TalentEditor);

        const saveButton = screen.getByText('common.buttons.save');
        await fireEvent.click(saveButton);

        expect(alertMock).toHaveBeenCalledWith('character.modals.name_required');
    });

    it('should call addTalent when saving a new talent', async () => {
        const addTalentSpy = vi.spyOn(characterActions, 'addTalent');

        modalState.set({ type: 'talent', isOpen: true, data: null });
        render(TalentEditor);

        const nameInput = screen.getByPlaceholderText('character.modals.name');
        await fireEvent.input(nameInput, { target: { value: 'Test Talent' } });

        const saveButton = screen.getByText('common.buttons.save');
        await fireEvent.click(saveButton);

        expect(addTalentSpy).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Test Talent',
            id: 'test-uuid-123'
        }));
    });

    it('should call updateTalent when saving an existing talent', async () => {
        const updateTalentSpy = vi.spyOn(characterActions, 'updateTalent');
        const existingTalent = {
            id: 'existing-id',
            name: 'Existing Talent',
            description: 'Description',
            source: 'Ancestry',
            activityType: 'Passive',
            isPassive: true,
            uses: 0,
            maxUses: 0,
            effect: null
        };

        modalState.set({ type: 'talent', isOpen: true, data: existingTalent });
        render(TalentEditor);

        const nameInput = screen.getByPlaceholderText('character.modals.name');
        await fireEvent.input(nameInput, { target: { value: 'Updated Talent' } });

        const saveButton = screen.getByText('common.buttons.save');
        await fireEvent.click(saveButton);

        expect(updateTalentSpy).toHaveBeenCalledWith(expect.objectContaining({
            id: 'existing-id',
            name: 'Updated Talent'
        }));
    });

    it('REGRESSION: should call addTalent (not updateTalent) when saving a NEW talent with effect', async () => {
        // This is the critical regression test for the bug where new talents with effects
        // were being passed to updateTalent instead of addTalent because data was truthy
        // after returning from EffectEditor
        const addTalentSpy = vi.spyOn(characterActions, 'addTalent');
        const updateTalentSpy = vi.spyOn(characterActions, 'updateTalent');

        // Simulate returning from EffectEditor with effect data for a NEW talent (no id)
        const newTalentWithEffect = {
            id: undefined, // No id means it's a new talent
            name: 'New Talent With Effect',
            description: 'Test description',
            source: 'Ancestry',
            activityType: 'Passive',
            isPassive: true,
            uses: 0,
            maxUses: 0,
            effect: {
                name: 'Test Effect',
                duration: 'ROUNDS',
                roundsLeft: 3,
                modifiers: [{ target: 'str', type: 'ADD', value: 2 }]
            }
        };

        modalState.set({ type: 'talent', isOpen: true, data: newTalentWithEffect });
        render(TalentEditor);

        const saveButton = screen.getByText('common.buttons.save');
        await fireEvent.click(saveButton);

        // Should call addTalent, NOT updateTalent
        expect(addTalentSpy).toHaveBeenCalled();
        expect(updateTalentSpy).not.toHaveBeenCalled();

        // Should preserve the effect
        expect(addTalentSpy).toHaveBeenCalledWith(expect.objectContaining({
            name: 'New Talent With Effect',
            effect: expect.objectContaining({
                name: 'Test Effect'
            })
        }));
    });

    it('should delete talent when delete button is clicked', async () => {
        const deleteTalentSpy = vi.spyOn(characterActions, 'deleteTalent');
        const existingTalent = {
            id: 'talent-to-delete',
            name: 'Delete Me',
            isPassive: true
        };

        modalState.set({ type: 'talent', isOpen: true, data: existingTalent });
        render(TalentEditor);

        const deleteButton = screen.getByTitle('character.modals.delete');
        await fireEvent.click(deleteButton);

        expect(deleteTalentSpy).toHaveBeenCalledWith('talent-to-delete');
    });

    it('should show configured button when effect exists', () => {
        const talentWithEffect = {
            id: 'has-effect',
            name: 'Has Effect',
            isPassive: true,
            effect: { name: 'Some Effect' }
        };

        modalState.set({ type: 'talent', isOpen: true, data: talentWithEffect });
        render(TalentEditor);

        expect(screen.getByText('character.modals.configured')).toBeTruthy();
    });

    it('should show none button when no effect exists', () => {
        modalState.set({ type: 'talent', isOpen: true, data: null });
        render(TalentEditor);

        expect(screen.getByText('character.modals.none')).toBeTruthy();
    });
});
