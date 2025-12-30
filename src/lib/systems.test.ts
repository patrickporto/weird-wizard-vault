import { describe, it, expect } from 'vitest';
import { SYSTEMS, getSystem, isSystemDisabled, DEFAULT_SYSTEM } from './systems';

describe('SystemRegistry', () => {
    it('should have the default system defined', () => {
        expect(DEFAULT_SYSTEM).toBe('sofww');
    });

    it('should retrieve the Shadow of the Weird Wizard system', () => {
        const system = getSystem('sofww');
        expect(system).toBeDefined();
        expect(system.name).toBe('Shadow of the Weird Wizard');
        expect(system.disabled).toBeFalsy();
    });

    it('should retrieve the Shadow of the Demon Lord system', () => {
        const system = getSystem('sofdl');
        expect(system).toBeDefined();
        expect(system.name).toBe('Shadow of the Demon Lord');
        expect(system.disabled).toBe(true);
    });

    it('should retrieve the Demon Lord Engine system', () => {
        const system = getSystem('dle');
        expect(system).toBeDefined();
        expect(system.name).toBe('Demon Lord Engine');
        expect(system.disabled).toBe(true);
    });

    it('should default to sofww for unknown systems', () => {
        const system = getSystem('unknown-system-id');
        expect(system).toBeDefined();
        expect(system.id).toBe('sofww');
    });

    it('should correctly identify disabled systems', () => {
        expect(isSystemDisabled('sofww')).toBe(false);
        expect(isSystemDisabled('sofdl')).toBe(true);
        expect(isSystemDisabled('dle')).toBe(true);
    });

    it('should have 3 registered systems', () => {
        expect(SYSTEMS.length).toBe(3);
    });
});
