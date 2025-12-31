import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { addMessages, init } from 'svelte-i18n';

// Initialize i18n for all tests
import enTranslations from '../i18n/en.json';
import ptTranslations from '../i18n/pt.json';

addMessages('en', enTranslations);
addMessages('pt', ptTranslations);

init({
  fallbackLocale: 'en',
  initialLocale: 'en',
});

// Mock Web Animations API for Svelte transitions (browser environment only)
if (typeof Element !== 'undefined') {
  Element.prototype.animate = vi.fn().mockImplementation(() => ({
    finished: Promise.resolve(),
    cancel: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    reverse: vi.fn(),
    onfinish: null
  }));
}

// Mock indexedDB for Yjs/y-indexeddb (not available in happy-dom)
if (typeof indexedDB === 'undefined') {
  const mockRequest: any = {
    result: {
      objectStoreNames: { contains: () => false },
      createObjectStore: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({ onsuccess: null, onerror: null })),
          put: vi.fn(() => ({ onsuccess: null, onerror: null })),
          delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
          getAll: vi.fn(() => ({ onsuccess: null, onerror: null })),
          clear: vi.fn(() => ({ onsuccess: null, onerror: null })),
          index: vi.fn(() => ({
            get: vi.fn(() => ({ onsuccess: null, onerror: null })),
            getAll: vi.fn(() => ({ onsuccess: null, onerror: null })),
          })),
        })),
        oncomplete: null,
        onerror: null,
        onabort: null,
      })),
    },
    onsuccess: null,
    onerror: null,
    onblocked: null,
    onupgradeneeded: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 'done',
  };

  // @ts-ignore
  global.indexedDB = {
    open: vi.fn(() => {
      setTimeout(() => {
        if (mockRequest.onsuccess) mockRequest.onsuccess({ target: mockRequest });
      }, 0);
      return mockRequest;
    }),
    deleteDatabase: vi.fn(() => mockRequest),
  } as any;
}

if (typeof IDBKeyRange === 'undefined') {
  // @ts-ignore
  global.IDBKeyRange = {
    bound: vi.fn(),
    lowerBound: vi.fn(),
    upperBound: vi.fn(),
    only: vi.fn(),
  } as any;
}
