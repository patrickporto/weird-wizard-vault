import { writable, get } from 'svelte/store';

// Client ID provided by the user (PLACEHOLDER - NEED TO REQUEST FROM USER)
// Using a placeholder for now, user needs to update this or I'll ask for it.
const CLIENT_ID = '701898444454-7ml9onnv529k99rkvgh1slhdj4a1arrm.apps.googleusercontent.com';
const API_KEY = ''; // Optional if using OAuth2 only for personal data, but usually needed for discovery docs. Drive API often works without separate API Key if using OAuth token.

// Imports for Sync
import { charactersMap, campaignsMap } from '$lib/db';
import { liveCharacters, liveCampaigns } from '$lib/stores/live';

// Scopes for App Data Folder
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

export const googleSession = writable<{
    signedIn: boolean;
    accessToken: string | null;
    userProfile: any | null;
    isInited: boolean;
}>({
    signedIn: false,
    accessToken: null,
    userProfile: null,
    isInited: false
});

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

const STORAGE_KEY = 'wwv_google_session';

// Function to load session from localStorage
function loadStoredSession() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            if (data.accessToken) {
                googleSession.set({
                    signedIn: true,
                    accessToken: data.accessToken,
                    userProfile: data.userProfile || null,
                    isInited: true
                });
                console.log('Restored session from localStorage');
                return true;
            }
        }
    } catch (e) {
        console.error('Failed to load stored session:', e);
    }
    return false;
}

// Function to save session to localStorage
function saveSession() {
    const session = get(googleSession);
    if (session.signedIn && session.accessToken) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            accessToken: session.accessToken,
            userProfile: session.userProfile
        }));
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export async function initializeGoogleAuth() {
    if (!CLIENT_ID) {
        console.error('Google Client ID not provided');
        return;
    }
    const clientId = CLIENT_ID;

    // Try to restore session from localStorage first
    const restoredSession = loadStoredSession();
    if (restoredSession) {
        // Session restored, but we still need to init the tokenClient for sign-out
        try {
            await waitForScripts();
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPES,
                callback: handleAuthCallback,
            });
            gisInited = true;
        } catch (err) {
            console.warn('Could not initialize GIS after restoring session:', err);
        }
        return;
    }

    try {
        // Wait for scripts to load if not already
        await waitForScripts();

        // Initialize GIS (Identity)
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: handleAuthCallback,
        });

        gisInited = true;
        googleSession.update(s => ({ ...s, isInited: true }));
        console.log('Google Auth Initialized');
    } catch (err) {
        console.error('Failed to initialize Google Auth:', err);
        // Force init state so button shows (but might fail)
        googleSession.update(s => ({ ...s, isInited: true }));
        alert('Falha ao inicializar Google Auth. Verifique sua conexão/Console.');
    }
}

function handleAuthCallback(resp: any) {
    if (resp.error !== undefined) {
        console.error('Google Auth Error:', resp);
        return;
    }
    console.log('Google Auth Success', resp);
    googleSession.update(s => ({ ...s, signedIn: true, accessToken: resp.access_token }));
    saveSession();
}

function waitForScripts() {
    return new Promise<void>((resolve, reject) => {
        // If already loaded, resolve immediately
        if (typeof google !== 'undefined' && google.accounts) {
            resolve();
            return;
        }

        // If not loaded, dynamically inject the script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;

        script.onload = () => {
            // Wait a bit for global to be available
            const checkGoogle = setInterval(() => {
                if (typeof google !== 'undefined' && google.accounts) {
                    clearInterval(checkGoogle);
                    resolve();
                }
            }, 50);

            // Safety timeout
            setTimeout(() => {
                clearInterval(checkGoogle);
                if (typeof google === 'undefined' || !google.accounts) {
                    reject(new Error('Google object not available after script load'));
                }
            }, 3000);
        };

        script.onerror = () => {
            reject(new Error('Failed to load Google Identity Services script'));
        };

        document.head.appendChild(script);
    });
}

export function signIn() {
    if (tokenClient) {
        // Request access token
        tokenClient.requestAccessToken();
    } else {
        console.error('Google Auth not initialized');
        alert('Google Auth ainda não inicializou. Tente novamente em alguns segundos.');
    }
}

export function signOut() {
    const token = get(googleSession).accessToken;

    // Clear localStorage first
    localStorage.removeItem(STORAGE_KEY);
    googleSession.update(s => ({ ...s, signedIn: false, accessToken: null, userProfile: null }));

    if (token && typeof google !== 'undefined' && google.accounts) {
        google.accounts.oauth2.revoke(token, () => {
            console.log('Access token revoked');
        });
    }
}

// Drive Operations
export async function listBackups() {
    const token = get(googleSession).accessToken;
    if (!token) throw new Error('Not signed in');

    const q = "name = 'weird-wizard-backup.json' and 'appDataFolder' in parents and trashed = false";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=appDataFolder&fields=files(id, name, modifiedTime, size)`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to list backups: ' + response.statusText);
    }

    const data = await response.json();
    return data.files || [];
}

export async function uploadBackup(data: any) {
    const token = get(googleSession).accessToken;
    if (!token) throw new Error('Not signed in');

    const fileContent = JSON.stringify(data);
    const fileName = 'weird-wizard-backup.json';

    // 1. Check if file exists to update it, or create new
    const existing = await listBackups();
    const fileId = existing.length > 0 ? existing[0].id : null;

    if (fileId) {
        // Use simple media upload for updates (no metadata, just content)
        const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: fileContent
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload error details:', errorText);
            throw new Error('Upload failed: ' + response.statusText);
        }

        return await response.json();
    } else {
    // Create new file with multipart upload (includes metadata with parents)
        const metadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: ['appDataFolder']
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload error details:', errorText);
            throw new Error('Upload failed: ' + response.statusText);
        }

        return await response.json();
    }
}

export async function downloadBackup(fileId: string) {
    const token = get(googleSession).accessToken;
    if (!token) throw new Error('Not signed in');

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Download failed: ' + response.statusText);
    }

    return await response.json();
}

// Auto-Sync Logic
let syncDebounceTimer: any;

export async function syncFromCloud() {
    const token = get(googleSession).accessToken;
    if (!token) return;

    try {
        console.log('Syncing from cloud...');
        const files = await listBackups();
        if (files.length === 0) {
            console.log('No backups found in cloud.');
            return;
        }

        // Get the most recent file
        const fileId = files[0].id;
        const cloudData: any = await downloadBackup(fileId);

        // Bi-directional merge: Add cloud items that don't exist locally
        // This preserves local data while enriching with cloud data
        if (cloudData.characters && Array.isArray(cloudData.characters)) {
            for (const cloudChar of cloudData.characters) {
                const localChar = charactersMap.get(cloudChar.id);
                if (!localChar) {
                    // Cloud item doesn't exist locally, add it
                    charactersMap.set(cloudChar.id, cloudChar);
                    console.log('Added character from cloud:', cloudChar.name);
                }
        // If local exists, keep local version (local wins for existing items)
            }
        }

        if (cloudData.campaigns && Array.isArray(cloudData.campaigns)) {
            for (const cloudCamp of cloudData.campaigns) {
                const localCamp = campaignsMap.get(cloudCamp.id);
                if (!localCamp) {
                    // Cloud item doesn't exist locally, add it
                    campaignsMap.set(cloudCamp.id, cloudCamp);
                    console.log('Added campaign from cloud:', cloudCamp.name);
                }
        // If local exists, keep local version
            }
        }

        console.log('Sync from cloud complete.');

    } catch (err) {
        console.error('Failed to sync from cloud:', err);
    }
}

export async function syncToCloud() {
    const token = get(googleSession).accessToken;
    if (!token) return;

    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

    syncDebounceTimer = setTimeout(async () => {
        try {
            console.log('Syncing to cloud...');
            const data = {
                characters: get(liveCharacters),
                campaigns: get(liveCampaigns),
                timestamp: Date.now(),
                version: 1,
                appName: 'WeirdWizardVault'
            };

            await uploadBackup(data);
            console.log('Sync to cloud complete.');
        } catch (err) {
            console.error('Failed to sync to cloud:', err);
        }
    }, 2000); // 2 second debounce
}
