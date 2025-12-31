import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import DiceCounter from './DiceCounter.svelte';

describe('DiceCounter', () => {
    it('should render with initial value', () => {
        render(DiceCounter, { value: 3, onUpdate: vi.fn() });

        expect(screen.getByText('3d6')).toBeInTheDocument();
    });

    it('should render with label when provided', () => {
        render(DiceCounter, { value: 2, label: 'Damage (d6)', onUpdate: vi.fn() });

        expect(screen.getByText('Damage (d6)')).toBeInTheDocument();
        expect(screen.getByText('2d6')).toBeInTheDocument();
    });

    it('should render without label when not provided', () => {
        const { container } = render(DiceCounter, { value: 1, onUpdate: vi.fn() });

        const label = container.querySelector('.text-indigo-300');
        expect(label).not.toBeInTheDocument();
    });

    it('should call onUpdate with incremented value when plus button is clicked', async () => {
        const user = userEvent.setup();
        const onUpdate = vi.fn();

        render(DiceCounter, { value: 2, onUpdate });

        const plusButton = screen.getByLabelText('Aumentar');
        await user.click(plusButton);

        expect(onUpdate).toHaveBeenCalledWith(3);
    });

    it('should call onUpdate with decremented value when minus button is clicked', async () => {
        const user = userEvent.setup();
        const onUpdate = vi.fn();

        render(DiceCounter, { value: 3, onUpdate });

        const minusButton = screen.getByLabelText('Diminuir');
        await user.click(minusButton);

        expect(onUpdate).toHaveBeenCalledWith(2);
    });

    it('should not decrement below minimum value (default 0)', async () => {
        const user = userEvent.setup();
        const onUpdate = vi.fn();

        render(DiceCounter, { value: 0, onUpdate });

        const minusButton = screen.getByLabelText('Diminuir');
        await user.click(minusButton);

        expect(onUpdate).toHaveBeenCalledWith(0);
    });

    it('should respect custom minimum value', async () => {
        const user = userEvent.setup();
        const onUpdate = vi.fn();

        render(DiceCounter, { value: 5, min: 5, onUpdate });

        const minusButton = screen.getByLabelText('Diminuir');
        await user.click(minusButton);

        expect(onUpdate).toHaveBeenCalledWith(5);
    });

    it('should allow decrementing above custom minimum', async () => {
        const user = userEvent.setup();
        const onUpdate = vi.fn();

        render(DiceCounter, { value: 6, min: 5, onUpdate });

        const minusButton = screen.getByLabelText('Diminuir');
        await user.click(minusButton);

        expect(onUpdate).toHaveBeenCalledWith(5);
    });

    it('should update display when value prop changes', async () => {
        const { rerender } = render(DiceCounter, { value: 2, onUpdate: vi.fn() });

        expect(screen.getByText('2d6')).toBeInTheDocument();

        rerender({ value: 5, onUpdate: vi.fn() });

        expect(screen.getByText('5d6')).toBeInTheDocument();
    });

    it('should have proper button accessibility attributes', () => {
        render(DiceCounter, { value: 1, onUpdate: vi.fn() });

        const minusButton = screen.getByLabelText('Diminuir');
        const plusButton = screen.getByLabelText('Aumentar');

        expect(minusButton).toHaveAttribute('type', 'button');
        expect(minusButton).toHaveAttribute('aria-label', 'Diminuir');

        expect(plusButton).toHaveAttribute('type', 'button');
        expect(plusButton).toHaveAttribute('aria-label', 'Aumentar');
    });

    it('should display dice notation correctly for various values', () => {
        const { rerender } = render(DiceCounter, { value: 0, onUpdate: vi.fn() });
        expect(screen.getByText('0d6')).toBeInTheDocument();

        rerender({ value: 1, onUpdate: vi.fn() });
        expect(screen.getByText('1d6')).toBeInTheDocument();

        rerender({ value: 10, onUpdate: vi.fn() });
        expect(screen.getByText('10d6')).toBeInTheDocument();
    });
});
