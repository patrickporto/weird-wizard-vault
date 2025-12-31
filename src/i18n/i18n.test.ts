import { describe, it, expect } from 'vitest';
import { waitLocale, locale, isLoading, _ } from 'svelte-i18n';
import { get } from 'svelte/store';

// i18n is initialized in src/test/setup.ts

describe('i18n Initialization', () => {
    it('should initialize locale without errors', async () => {
        await waitLocale();
        const currentLocale = get(locale);
        expect(currentLocale).toBeTruthy();
        expect(currentLocale).toBe('en');
    });

    it('should not be loading after initialization', async () => {
        await waitLocale();
        const loading = get(isLoading);
        expect(loading).toBe(false);
    });

    it('should be able to translate keys', async () => {
        await waitLocale();
        const t = get(_);
        const translation = t('common.labels.level');
        expect(translation).toBeTruthy();
        expect(translation).toBe('Level');
    });

    it('should handle locale changes and load translations', async () => {
        await waitLocale();

        let t = get(_);
        const enTranslation = t('common.labels.level');
        expect(enTranslation).toBe('Level');

        // Switch to Portuguese
        locale.set('pt');
        await waitLocale();

        t = get(_);
        const ptTranslation = t('common.labels.level');
        expect(ptTranslation).toBe('Nível');

        // Translations should differ
        expect(enTranslation).not.toBe(ptTranslation);

        // Cleanup - switch back to English for other tests
        locale.set('en');
        await waitLocale();
    });
});
