import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Modal from './Modal.svelte';

describe('Modal Component', () => {
    it('should not render when isOpen is false', () => {
        render(Modal, { isOpen: false, onClose: vi.fn() });
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeNull();
    });

    it('should render correctly when isOpen is true', () => {
        render(Modal, { isOpen: true, onClose: vi.fn(), title: 'Test Modal' });
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeTruthy();
        expect(screen.getByText('Test Modal')).toBeTruthy();
    });

    it('should NOT call onClose when clicking the backdrop (modal is persistent)', async () => {
        const onClose = vi.fn();
        render(Modal, { isOpen: true, onClose });

        const backdrop = screen.getByRole('presentation');
        await fireEvent.click(backdrop);

        // Modal is designed to be persistent - backdrop click does not close
        expect(onClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking inside the content', async () => {
        const onClose = vi.fn();
        render(Modal, { isOpen: true, onClose });

        const dialog = screen.getByRole('dialog');
        await fireEvent.click(dialog);

        expect(onClose).not.toHaveBeenCalled();
    });

    it('should apply custom maxWidth class', () => {
        render(Modal, { isOpen: true, onClose: vi.fn(), maxWidth: 'max-w-2xl' });
        const dialog = screen.getByRole('dialog');
        expect(dialog.getAttribute('class')).toContain('max-w-2xl');
    });
});
