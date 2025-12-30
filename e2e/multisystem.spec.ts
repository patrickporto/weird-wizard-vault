import { test, expect } from '@playwright/test';

test.describe('Multi-System Support', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      // Clear IndexedDB `schwalbvault` used by Yjs
      // We also need to clear 'schwalbvault-blobs' if it exists, or whatever y-indexeddb uses. 
      // y-indexeddb typically uses the name provided.
      await new Promise((resolve, reject) => {
        const req = window.indexedDB.deleteDatabase('schwalbvault');
        req.onsuccess = resolve;
        req.onerror = reject;
        req.onblocked = resolve; // Just proceed if blocked
      });
    });
    // Reload to ensure fresh start
    await page.reload();
  });

  test('should create a character with default system', async ({ page }) => {
    const charName = `Gandalf ${Date.now()}`;
    // Open New Character Modal
    await page.getByRole('button', { name: 'New Character' }).click();

    // Check if System Selection is present
    await expect(page.getByText('Sistema de Jogo')).toBeVisible();

    // Check options
    const sofwwOption = page.getByRole('button', { name: 'Shadow of the Weird Wizard' });
    await expect(sofwwOption).toBeVisible();
    await expect(sofwwOption).toBeEnabled();

    const sofdlOption = page.getByRole('button', { name: 'Shadow of the Demon Lord' });
    await expect(sofdlOption).toBeDisabled();

    // Fill form
    await page.getByLabel('Nome do Personagem').fill(charName);

    // Save
    await page.getByRole('button', { name: 'Criar Personagem' }).click();

    // Verify redirection to character sheet
    await expect(page).toHaveURL(/\/characters\/.+/);

    // Go back to Dashboard
    await page.goto('/');

    // Verify Character Card has System Tag
    await expect(page.getByText('Shadow of the Weird Wizard')).toBeVisible();
    await expect(page.getByRole('heading', { name: charName })).toBeVisible();
  });

  test('should create a campaign with default system', async ({ page }) => {
    const campaignName = `The Fellowship ${Date.now()}`;
    // Switch to Campaigns tab
    await page.getByRole('button', { name: 'Campaigns' }).click();

    // Open New Campaign Modal
    await page.getByRole('button', { name: 'New Campaign' }).click();

    // Check System Selection
    await expect(page.getByText('Sistema de Jogo')).toBeVisible();

    const sofwwOption = page.getByRole('button', { name: 'Shadow of the Weird Wizard' });
    await expect(sofwwOption).toBeVisible();

    // Fill Form
    await page.getByLabel('Nome da Campanha').fill(campaignName);
    await page.getByLabel('Mestre (GM)').fill('Dungeon Master');

    // Save
    await page.getByRole('button', { name: 'Criar Campanha' }).click();

    // Basic verification that card appears
    await expect(page.getByText(campaignName)).toBeVisible();
    // Verify System Tag on Card
    await expect(page.getByText('Shadow of the Weird Wizard')).toBeVisible();
  });

  test('invite flow should show match', async ({ page }) => {
    const charName = `Legolas ${Date.now()}`;
    const campaignName = `Ring Quest ${Date.now()}`;

    // 1. Create Character
    await page.getByRole('button', { name: 'New Character' }).click();
    await page.getByLabel('Nome do Personagem').fill(charName);
    await page.getByRole('button', { name: 'Criar Personagem' }).click();
    await expect(page).toHaveURL(/\/characters\/.+/);

    // 2. Create Campaign
    await page.goto('/');
    await page.getByRole('button', { name: 'Campaigns' }).click();
    await page.getByRole('button', { name: 'New Campaign' }).click();
    await page.getByLabel('Nome da Campanha').fill(campaignName);
    await page.getByLabel('Mestre (GM)').fill('Sauron');
    await page.getByRole('button', { name: 'Criar Campanha' }).click();

    // 3. Find Campaign Card and Click Start Session
    const campaignCard = page.locator('div', { hasText: campaignName }).filter({ hasText: 'Sauron' }).first();
    await expect(campaignCard).toBeVisible();

    await campaignCard.getByRole('button', { name: 'Start Session' }).click();
    await expect(page).toHaveURL(/\/campaigns\/.+/);

    // 4. Construct Invite URL
    // Ensure we strip any trailing slash or query params
    const campaignId = page.url().split('/campaigns/')[1].split('/')[0].split('?')[0];
    const inviteUrl = `/campaigns/${campaignId}/invite`;

    // 5. Visit Invite URL
    await page.goto(inviteUrl);

    // Expect "Legolas" to be visible
    await expect(page.getByText(charName)).toBeVisible();
  });
});
