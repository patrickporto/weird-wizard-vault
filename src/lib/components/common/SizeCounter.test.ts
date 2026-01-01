// @vitest-environment happy-dom
import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import SizeCounter from './SizeCounter.svelte';

describe('SizeCounter', () => {
    it('renders correctly with initial value 1', () => {
        render(SizeCounter, { value: 1, onUpdate: vi.fn() });
        const display = screen.getByTestId('size-display');
        expect(display.textContent).toBe('1');
    });

    it('renders correctly with initial value 0.125 (1/8)', () => {
        render(SizeCounter, { value: 0.125, onUpdate: vi.fn() });
        const display = screen.getByTestId('size-display');
        expect(display.textContent).toBe('1/8');
    });

    it('renders label if provided', () => {
        render(SizeCounter, { value: 1, onUpdate: vi.fn(), label: 'Tamanho' });
        expect(screen.getByText('Tamanho')).toBeInTheDocument();
    });

    it('decreases value from 1 to 0.5 (1/2)', async () => {
        const onUpdate = vi.fn();
        render(SizeCounter, { value: 1, onUpdate });

        const decreaseBtn = screen.getByLabelText('Diminuir');
        await fireEvent.click(decreaseBtn);

        expect(onUpdate).toHaveBeenCalledWith(0.5);
    });

    it('decreases value from 0.5 to 0.125 (1/8)', async () => {
        const onUpdate = vi.fn();
        render(SizeCounter, { value: 0.5, onUpdate });

        const decreaseBtn = screen.getByLabelText('Diminuir');
        await fireEvent.click(decreaseBtn);

        expect(onUpdate).toHaveBeenCalledWith(0.125);
    });

    it('increases value from 0.125 to 0.5 (1/2)', async () => {
        const onUpdate = vi.fn();
        render(SizeCounter, { value: 0.125, onUpdate });

        const increaseBtn = screen.getByLabelText('Aumentar');
        await fireEvent.click(increaseBtn);

        expect(onUpdate).toHaveBeenCalledWith(0.5);
    });

    it('increases value from 0.5 to 1', async () => {
        const onUpdate = vi.fn();
        render(SizeCounter, { value: 0.5, onUpdate });

        const increaseBtn = screen.getByLabelText('Aumentar');
        await fireEvent.click(increaseBtn);

        expect(onUpdate).toHaveBeenCalledWith(1);
    });

    it('does not decrease below 0.125', async () => {
        const onUpdate = vi.fn();
        render(SizeCounter, { value: 0.125, onUpdate });

        const decreaseBtn = screen.getByLabelText('Diminuir');
        expect(decreaseBtn).toBeDisabled();
        await fireEvent.click(decreaseBtn);

        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('does not increase above 20', async () => {
        const onUpdate = vi.fn();
        render(SizeCounter, { value: 20, onUpdate });

        const increaseBtn = screen.getByLabelText('Aumentar');
        expect(increaseBtn).toBeDisabled();
        await fireEvent.click(increaseBtn);

        expect(onUpdate).not.toHaveBeenCalled();
    });
});
