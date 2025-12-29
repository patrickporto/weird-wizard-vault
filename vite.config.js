import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from '@tailwindcss/vite'
import devtoolsJson from 'vite-plugin-devtools-json';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [
    sveltekit(),
    tailwindcss(),
    devtoolsJson(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      base: process.env.NODE_ENV === 'production' ? '/schwalb-vault/' : '/',
      scope: process.env.NODE_ENV === 'production' ? '/schwalb-vault/' : '/',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'Weird Wizard Vault',
        short_name: 'WW Vault',
        description: 'Gerenciador de Fichas para Shadow of the Weird Wizard',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: process.env.NODE_ENV === 'production' ? '/schwalb-vault/' : '/',
        start_url: process.env.NODE_ENV === 'production' ? '/schwalb-vault/' : '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
          // Precache all static assets
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
          // Fallback for SPA navigation
          navigateFallback: '/',
          navigateFallbackDenylist: [/^\/api/],
          // Runtime caching strategies
          runtimeCaching: [
            {
                // Cache IndexedDB-backed pages (app shell)
                urlPattern: /^https?:\/\/localhost(:\d+)?\//,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'app-shell-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                  },
                  networkTimeoutSeconds: 3
                }
              },
              {
              // Google Fonts stylesheets
                  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                  handler: 'StaleWhileRevalidate',
                  options: {
                      cacheName: 'google-fonts-stylesheets',
                      expiration: {
                        maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  }
                }
              },
              {
                  // Google Fonts webfont files
                  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                      cacheName: 'google-fonts-webfonts',
                      expiration: {
                        maxEntries: 30,
                        maxAgeSeconds: 60 * 60 * 24 * 365
                      },
                      cacheableResponse: {
                        statuses: [0, 200]
                      }
                    }
              },
              {
                // Images
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                  }
                }
            }
          ]
        }
    })
  ],
};
