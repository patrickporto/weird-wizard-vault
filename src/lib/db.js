import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

export const doc = new Y.Doc();

// Single DB for the vault
// We will store characters in a Y.Map named 'characters'
const isBrowser = typeof window !== 'undefined';

export const provider = isBrowser
    ? new IndexeddbPersistence('weird-wizard-vault', doc)
    : null;

export const charactersMap = doc.getMap('characters');

// Helper to wait for sync
export const waitForSync = () => {
    return new Promise((resolve) => {
        if (!provider) {
            resolve();
            return;
        }
        if (provider.synced) {
            resolve();
        } else {
            provider.on('synced', () => {
                resolve();
            });
        }
    });
};
