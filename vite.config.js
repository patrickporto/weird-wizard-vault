import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from '@tailwindcss/vite'
import devtoolsJson from 'vite-plugin-devtools-json';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [
    nodePolyfills({
      include: ['buffer'],
      globals: {
        Buffer: true
      }
    }),
    sveltekit(),
    tailwindcss(),
    devtoolsJson(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      base: process.env.NODE_ENV === 'production' ? '/schwalb-vault/' : '/',
      scope: process.env.NODE_ENV === 'production' ? '/schwalb-vault/' : '/',
      includeAssets: ['icon/favicon.ico', 'icon/apple-icon-180x180.png', 'icon/android-icon-192x192.png'],
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'Schwalb Vault',
        short_name: 'Schwalb Vault',
        description: 'Gerenciador de Fichas para Shadow of the Weird Wizard',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: process.env.NODE_ENV === 'production' ? '/schwalb-vault/' : '/',
        start_url: process.env.NODE_ENV === 'production' ? '/schwalb-vault/' : '/',
        icons: [
          {
            src: 'icon/android-icon-36x36.png',
            sizes: '36x36',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-48x48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon/ms-icon-310x310.png',
            sizes: '310x310',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
          // Precache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot,json}'],
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
