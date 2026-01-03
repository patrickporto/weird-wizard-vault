import { writable, get } from 'svelte/store';

declare global {
  const google: any;
}

// Client ID provided by the user (PLACEHOLDER - NEED TO REQUEST FROM USER)
// Using a placeholder for now, user needs to update this or I'll ask for it.
const CLIENT_ID = '701898444454-7ml9onnv529k99rkvgh1slhdj4a1arrm.apps.googleusercontent.com';
const API_KEY = ''; // Optional if using OAuth2 only for personal data, but usually needed for discovery docs. Drive API often works without separate API Key if using OAuth token.

// Imports for Sync
import { charactersMap, campaignsMap, enemiesMap, encountersMap, imagesMap, deletedIdsMap } from '$lib/db';
import { appSettings } from '$lib/stores/characterStore';
import { liveCharacters, liveCampaigns, liveEnemies, liveEncounters } from '$lib/stores/live';
import { syncStatus, lastSyncTime, authError } from '$lib/stores/syncStatus';

// Scopes: App Data for backup, User Info for avatar/name
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile';

export const googleSession = writable<{
  signedIn: boolean;
  accessToken: string | null;
  tokenExpiry: number | null; // Timestamp when token expires
  userProfile: { name: string; picture: string } | null;
  isInited: boolean;
}>({
  signedIn: false,
  accessToken: null,
  tokenExpiry: null,
  userProfile: null,
  isInited: false
});

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

const STORAGE_KEY = 'wwv_google_session';

// Function to check if token is expired (with 5 min buffer)
function isTokenExpired(): boolean {
  const session = get(googleSession);
  if (!session.tokenExpiry) return true;
  // Consider expired 5 minutes before actual expiry to avoid edge cases
  return Date.now() > (session.tokenExpiry - 5 * 60 * 1000);
}

// Function to clear session on auth failure
export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  googleSession.update(s => ({
    ...s,
    signedIn: false,
    accessToken: null,
    tokenExpiry: null,
    userProfile: null
  }));
  console.log('Session cleared due to expired or invalid token');
}

// Function to handle 401 errors and trigger re-auth
async function handleUnauthorized() {
  clearSession();
  // Show user-friendly message
  console.warn('OAuth token expired or invalid. Please sign in again.');
}

// Function to fetch user profile
async function fetchUserProfile(token: string) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Token is invalid/expired
      await handleUnauthorized();
      return;
    }

    if (response.ok) {
      const data = await response.json();
      googleSession.update(s => ({
        ...s,
        userProfile: {
          name: data.name,
          picture: data.picture
        }
      }));
      saveSession(); // Save updated profile to storage
    }
  } catch (e) {
    console.error('Failed to fetch user profile:', e);
  }
}

// Function to load session from localStorage
function loadStoredSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.accessToken) {
        // Check if token is expired before restoring
        if (data.tokenExpiry && Date.now() > data.tokenExpiry) {
          console.log('Stored token is expired, clearing session');
          localStorage.removeItem(STORAGE_KEY);
          return false;
        }

        googleSession.set({
          signedIn: true,
          accessToken: data.accessToken,
          tokenExpiry: data.tokenExpiry || null,
          userProfile: data.userProfile || null,
          isInited: true
        });
        console.log('Restored session from localStorage');

        // Verify token is still valid by fetching profile
        fetchUserProfile(data.accessToken);

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
      tokenExpiry: session.tokenExpiry,
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
    // Session restored, but we still need to init the tokenClient for sign-out or re-auth
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
    // Track error for UI display
    authError.set('init_failed');
    // Force init state so button shows (but might fail)
    googleSession.update(s => ({ ...s, isInited: true }));
  }
}

function handleAuthCallback(resp: any) {
  if (resp.error !== undefined) {
    console.error('Google Auth Error:', resp);
    return;
  }
  console.log('Google Auth Success', resp);

  // Calculate token expiry time (expires_in is in seconds, typically 3600 = 1 hour)
  const expiresIn = resp.expires_in || 3600; // Default to 1 hour if not provided
  const tokenExpiry = Date.now() + (expiresIn * 1000);

  googleSession.update(s => ({
    ...s,
    signedIn: true,
    accessToken: resp.access_token,
    tokenExpiry
  }));

  // Save session with expiry
  saveSession();

  // Fetch profile immediately after successful auth
  fetchUserProfile(resp.access_token);
}

let scriptLoadPromise: Promise<void> | null = null;

function waitForScripts() {
  if (typeof window === 'undefined') return Promise.resolve();

  // If already loaded, resolve immediately
  if (typeof google !== 'undefined' && google.accounts) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    // Check if script already exists in DOM (e.g. from previous attempt or manual addition)
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      // If it exists but we are here, it might still be loading or failed
      // To be safe, we'll wait for the global to appear or timeout
      const checkGoogle = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
          clearInterval(checkGoogle);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkGoogle);
        if (typeof google === 'undefined' || !google.accounts) {
          // Script exists but didn't load google object within 5s
          scriptLoadPromise = null; // Allow retry
          reject(new Error('Google Identity Services script found but failed to initialize'));
        }
      }, 5000);
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
          scriptLoadPromise = null; // Allow retry
          reject(new Error('Google object not available after script load'));
        }
      }, 5000);
    };

    script.onerror = () => {
      scriptLoadPromise = null; // Allow retry on next call
      const isOffline = !navigator.onLine;
      const msg = isOffline
        ? 'Failed to load Google script: No internet connection'
        : 'Failed to load Google script: Blocked by browser or network error';
      reject(new Error(msg));
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function signIn() {
  if (tokenClient) {
    // Clear any previous error
    authError.set(null);
    // Request access token
    tokenClient.requestAccessToken();
  } else {
    console.error('Google Auth not initialized');
    authError.set('not_initialized');
    syncStatus.set('error');
  }
}

export function signOut() {
  const token = get(googleSession).accessToken;

  // Clear localStorage first
  localStorage.removeItem(STORAGE_KEY);
  googleSession.update(s => ({
    ...s,
    signedIn: false,
    accessToken: null,
    tokenExpiry: null,
    userProfile: null
  }));

  if (token && typeof google !== 'undefined' && google.accounts) {
    google.accounts.oauth2.revoke(token, () => {
      console.log('Access token revoked');
    });
  }
}

// Drive Operations
export async function listBackups() {
  const session = get(googleSession);
  const token = session.accessToken;
  if (!token) throw new Error('Not signed in');

  // Check if token is expired before making request
  if (session.tokenExpiry && Date.now() > session.tokenExpiry) {
    await handleUnauthorized();
    throw new Error('Token expired, please sign in again');
  }

  const q = "name = 'weird-wizard-backup.json' and 'appDataFolder' in parents and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=appDataFolder&fields=files(id, name, modifiedTime, size)`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    await handleUnauthorized();
    throw new Error('Token expired, please sign in again');
  }

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

  if (response.status === 401) {
    await handleUnauthorized();
    throw new Error('Token expired, please sign in again');
  }

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
    syncStatus.set('syncing');
    const files = await listBackups();
    if (files.length === 0) {
      console.log('No backups found in cloud.');
      syncStatus.set('success');
      return;
    }

    // Get the most recent file
    const fileId = files[0].id;
    const cloudData: any = await downloadBackup(fileId);

    // Bi-directional merge: Add cloud items that don't exist locally
    // This preserves local data while enriching with cloud data
    // But respects local deletions

    // Build set of deleted IDs from local deletedIdsMap
    const deletedIds = new Set<string>();
    deletedIdsMap.forEach((value: any, key: string) => {
      deletedIds.add(String(key));
      console.log('[DEBUG] Local deleted ID entry:', { key, type: typeof key, val: value });
    });
    console.log('[DEBUG] Total locally deleted IDs:', deletedIds.size);

    // Also check if cloud has deletedIds we don't have locally (sync deletions from other devices)
    if (cloudData.deletedIds && Array.isArray(cloudData.deletedIds)) {
      console.log('[DEBUG] Cloud data deletedIds count:', cloudData.deletedIds.length);
      for (const deletedEntry of cloudData.deletedIds) {
        const entryId = String(deletedEntry.id);
        if (!deletedIdsMap.has(entryId)) {
          deletedIdsMap.set(entryId, deletedEntry);
          console.log('[DEBUG] New deletion synced from cloud:', entryId);
        }
        deletedIds.add(entryId);

        // Remove locally if exists (was deleted on another device)
        if (deletedEntry.type === 'character' && charactersMap.has(entryId)) {
          charactersMap.delete(entryId);
          console.log('[DEBUG] Removed char locally based on cloud deletion:', entryId);
        }
        if (deletedEntry.type === 'campaign' && campaignsMap.has(entryId)) {
          campaignsMap.delete(entryId);
          console.log('[DEBUG] Removed camp locally based on cloud deletion:', entryId);
        }
        if (deletedEntry.type === 'enemy' && enemiesMap.has(entryId)) {
          enemiesMap.delete(entryId);
          console.log('[DEBUG] Removed enemy locally based on cloud deletion:', entryId);
        }
        if (deletedEntry.type === 'encounter' && encountersMap.has(entryId)) {
          encountersMap.delete(entryId);
          console.log('[DEBUG] Removed encounter locally based on cloud deletion:', entryId);
        }
      }
    }

    if (cloudData.characters && Array.isArray(cloudData.characters)) {
      console.log('[DEBUG] Syncing', cloudData.characters.length, 'characters from cloud');
      for (const cloudChar of cloudData.characters) {
        const charId = String(cloudChar.id);
        // Double check using both the Set and the Map for maximum certainty
        if (deletedIds.has(charId) || deletedIdsMap.has(charId)) {
          console.log('[DEBUG] Skipping character because it is marked as deleted:', { id: charId, name: cloudChar.name });

          // ACTIVE REMOVAL: If it somehow exists locally but is marked deleted, remove it now correctly
          if (charactersMap.has(charId)) {
            console.log('[DEBUG] Character found locally but marked deleted. Removing now:', charId);
            charactersMap.delete(charId);
          }
          // Also check for mismatch entries
          for (const key of charactersMap.keys()) {
            const localVal = charactersMap.get(key);
            if (localVal && localVal.id === charId) {
              console.log('[DEBUG] Mismatched key entry found for deleted char. Removing:', key);
              charactersMap.delete(key);
            }
          }
          continue;
        }

        const localChar = charactersMap.get(charId);

        // CONFLICT RESOLUTION: Check timestamps
        const cloudTime = cloudChar.lastUpdate || 0;
        const localTime = localChar?.lastUpdate || 0;

        if (localChar && localTime > cloudTime) {
          console.log('[DEBUG] Skipping cloud overwrite for character, local is newer:', { id: charId, localTime, cloudTime });
          continue;
        }

        // OVERWRITE: If syncing from cloud, we assume cloud has the authoritative backup
        // In a future version, we could check for newer modification dates
        console.log('[DEBUG] Syncing character from cloud:', { id: charId, name: cloudChar.name, status: localChar ? 'OVERWRITING' : 'ADDING' });
        charactersMap.set(charId, cloudChar);
      }
    }

    if (cloudData.campaigns && Array.isArray(cloudData.campaigns)) {
      console.log('[DEBUG] Syncing', cloudData.campaigns.length, 'campaigns from cloud');
      for (const cloudCamp of cloudData.campaigns) {
        const campId = String(cloudCamp.id);
        if (deletedIds.has(campId) || deletedIdsMap.has(campId)) {
          console.log('[DEBUG] Skipping campaign because it is marked as deleted:', { id: campId, name: cloudCamp.name });

          // ACTIVE REMOVAL
          if (campaignsMap.has(campId)) {
            console.log('[DEBUG] Campaign found locally but marked deleted. Removing now:', campId);
            campaignsMap.delete(campId);
          }
          for (const key of campaignsMap.keys()) {
            const localVal = campaignsMap.get(key);
            if (localVal && localVal.id === campId) {
              console.log('[DEBUG] Mismatched key entry found for deleted camp. Removing:', key);
              campaignsMap.delete(key);
            }
          }
          continue;
        }

        const localCamp = campaignsMap.get(campId);
        const cloudTime = cloudCamp.lastUpdate || 0;
        const localTime = localCamp?.lastUpdate || 0;

        if (localCamp && localTime > cloudTime) {
          console.log('[DEBUG] Skipping cloud overwrite for campaign, local is newer:', { id: campId, localTime, cloudTime });
          continue;
        }

        console.log('[DEBUG] Syncing campaign from cloud:', { id: campId, name: cloudCamp.name, status: campaignsMap.has(campId) ? 'OVERWRITING' : 'ADDING' });
        campaignsMap.set(campId, cloudCamp);
      }
    }

    // Sync Enemies
    if (cloudData.enemies && Array.isArray(cloudData.enemies)) {
      for (const cloudEnemy of cloudData.enemies) {
        const id = String(cloudEnemy.id);
        if (!deletedIds.has(id) && !enemiesMap.has(id)) {
          enemiesMap.set(id, cloudEnemy);
        }
      }
    }

    // Sync Encounters
    if (cloudData.encounters && Array.isArray(cloudData.encounters)) {
      for (const cloudEnc of cloudData.encounters) {
        const id = String(cloudEnc.id);
        if (!deletedIds.has(id) && !encountersMap.has(id)) {
          encountersMap.set(id, cloudEnc);
        }
      }
    }

    // Sync Images
    if (cloudData.images && typeof cloudData.images === 'object') {
      console.log('[DEBUG] Syncing', Object.keys(cloudData.images).length, 'images from cloud');
      for (const [hash, base64] of Object.entries(cloudData.images)) {
        if (!imagesMap.has(hash)) {
          imagesMap.set(hash, base64);
          console.log('[DEBUG] New image synced from cloud:', hash);
        }
      }
    }


    // Sync App Settings with migration from legacy format
    if (cloudData.appSettings) {
      console.log('[DEBUG] Syncing app settings from cloud');

      // Get current local settings
      const currentSettings = get(appSettings);

      // Migrate legacy settings: defaultPlayerName/defaultGmName -> userName
      const settings: any = { ...cloudData.appSettings };

      // If new format already exists, use it
      if (!settings.userName && (settings.defaultPlayerName || settings.defaultGmName)) {
        // Prioritize defaultPlayerName, fall back to defaultGmName
        settings.userName = settings.defaultPlayerName || settings.defaultGmName || '';
        console.log('[DEBUG] Migrated legacy settings to userName:', settings.userName);
      }

      // Remove legacy fields
      delete settings.defaultPlayerName;
      delete settings.defaultGmName;

      // Merge cloud settings with local settings
      // CRITICAL: Local settings take priority over cloud to preserve recent user changes
      const mergedSettings = {
        ...settings,
        ...currentSettings
      };

      console.log('[DEBUG] Merged settings:', { current: currentSettings, cloud: settings, merged: mergedSettings });
      appSettings.set(mergedSettings);
    }

    console.log('[DEBUG] Sync from cloud complete.');
    syncStatus.set('success');
    lastSyncTime.set(Date.now());

  } catch (err) {
    console.error('Failed to sync from cloud:', err);
    syncStatus.set('error');
  }
}

export async function syncToCloud() {
  const token = get(googleSession).accessToken;
  if (!token) return;

  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

  syncDebounceTimer = setTimeout(async () => {
    try {
      console.log('Syncing to cloud...');
      syncStatus.set('syncing');

      // Build deletedIds array from map and Create Filter Set
      const deletedIdsArray: any[] = [];
      const deletedIdsSet = new Set<string>();

      deletedIdsMap.forEach((value: any, key: string) => {
        deletedIdsArray.push({ id: key, ...value });
        deletedIdsSet.add(String(key));
      });

      // CRITICAL: Filter out any items that are marked as deleted
      // This ensures local deletions allow propagate correctly even if there's a race condition
      const cleanCharacters = get(liveCharacters).filter((c: any) => !deletedIdsSet.has(String(c.id)));
      const cleanCampaigns = get(liveCampaigns).filter((c: any) => !deletedIdsSet.has(String(c.id)));
      const cleanEnemies = get(liveEnemies).filter((c: any) => !deletedIdsSet.has(String(c.id)));
      const cleanEncounters = get(liveEncounters).filter((c: any) => !deletedIdsSet.has(String(c.id)));

      const images: Record<string, any> = {};
      imagesMap.forEach((val: any, key: string) => {
        images[key] = val;
      });

      const data = {
        characters: cleanCharacters,
        campaigns: cleanCampaigns,
        enemies: cleanEnemies,
        encounters: cleanEncounters,
        images,
        deletedIds: deletedIdsArray,
        appSettings: get(appSettings),
        timestamp: Date.now(),
        version: 1,
        appName: 'WeirdWizardVault'
      };

      console.log('[DEBUG] Uploading to cloud:', {
        charactersCount: data.characters.length,
        campaignsCount: data.campaigns.length,
        enemiesCount: cleanEnemies.length,
        imagesCount: Object.keys(images).length,
        deletedIdsCount: deletedIdsArray.length
      });

      await uploadBackup(data);
      console.log('Sync to cloud complete.');

      syncStatus.set('success');
      lastSyncTime.set(Date.now());

    } catch (err) {
      console.error('Failed to sync to cloud:', err);
      syncStatus.set('error');
    }
  }, 2000); // 2 second debounce
}
