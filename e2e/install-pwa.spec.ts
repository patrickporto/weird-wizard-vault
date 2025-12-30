import { test, expect } from '@playwright/test';

test.describe('PWA Install Button', () => {
    test.use({ locale: 'pt-BR' });

    // Validar iOS (botão sempre visível se não standalone)
    test('should show install button on iOS devices', async ({ page }) => {
        // Simular iOS
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'userAgent', {
                get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' // User Agent de iPhone
            });
            // Mock matchMedia para garantir que não está em modo standalone
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: (query: string) => ({
                    matches: false,
                    media: query,
                    onchange: null,
                    addListener: () => { },
                    removeListener: () => { },
                    addEventListener: () => { },
                    removeEventListener: () => { },
                    dispatchEvent: () => false,
                }),
            });
            // Propriedade standalone do Safari antigo
            (window.navigator as any).standalone = false;
        });

        await page.goto('/');

        // O texto do botão depende do idioma, mas buscamos por regex aproximado
        // Como o navegador de teste pode estar em inglês, garantimos que pegamos ambos
        const installButton = page.getByRole('button', { name: /Instalar App|Install App/i });

        // Deve estar visível
        await expect(installButton).toBeVisible();

        // Clicar deve mostrar instruções e não tentar chamar .prompt() (que falharia pois não existe deferredPrompt no iOS simulado)
        await installButton.click();

        // Validar modal de instruções iOS
        await expect(page.locator('text=Compartilhar')).toBeVisible(); // Ou "Share" se estiver em inglês
    });

    // Validar Android/Desktop (com evento beforeinstallprompt)
    test('should show install button when beforeinstallprompt is triggered', async ({ page }) => {
        // Simular NÃO iOS e NÃO standalone
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'userAgent', {
                get: () => 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
            });
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: (query: string) => ({ matches: false }),
            });
        });

        await page.goto('/');

        const installButton = page.getByRole('button', { name: /Instalar App|Install App/i });

        // Inicialmente visível (Android fallback)
        await expect(installButton).toBeVisible();

        // Disparar evento manually
        await page.evaluate(() => {
            const event = new Event('beforeinstallprompt');
            // Mock prompt method se necessário, mas o código só armazena o evento
            (event as any).prompt = () => { };
            (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
            window.dispatchEvent(event);
        });

        // Agora clicar deve usar o prompt e sumir
        await installButton.click();
        await expect(installButton).toBeHidden();
    });
});
