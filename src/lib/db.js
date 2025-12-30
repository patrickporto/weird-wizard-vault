import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { appId } from '../app';


export const doc = new Y.Doc();

// Single DB for the vault
// We will store characters in a Y.Map named 'characters'
const isBrowser = typeof window !== 'undefined';

export const provider = isBrowser
    ? new IndexeddbPersistence(appId, doc)
    : null;

export const charactersMap = doc.getMap('characters');
export const campaignsMap = doc.getMap('campaigns');
export const enemiesMap = doc.getMap('enemies');
export const encountersMap = doc.getMap('encounters');
export const imagesMap = doc.getMap('images');
export const deletedIdsMap = doc.getMap('deletedIds'); // Tracks deleted character/campaign IDs for sync

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
