import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // Mise à jour automatique du SW en arrière-plan
      registerType: "autoUpdate",

      // Activer le SW en dev pour tester le prompt d'installation
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },

      // Utiliser notre fichier manifest.webmanifest custom dans /public
      manifest: false,
      manifestFilename: "manifest.webmanifest",
      injectManifest: undefined,

      // Assets à mettre en cache lors du pre-caching
      includeAssets: [
        "favicon.ico",
        "pwa-icon-192.png",
        "pwa-icon-512.png",
        "robots.txt",
      ],

      workbox: {
        // Augmenter la limite de taille du cache pour les gros fichiers (ex: index.js avec jspdf/html2canvas)
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MiB

        // Routes à exclure du service worker (OAuth, API...)
        navigateFallbackDenylist: [/^\/api/, /^\/~oauth/, /^\/admin/],

        // Toutes les routes frontend redirigent vers index.html (SPA)
        navigateFallback: "index.html",

        // Assets mis en cache statiquement au moment du build
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,ttf,eot}",
        ],

        // Nettoyage des anciens caches après mise à jour du SW
        cleanupOutdatedCaches: true,

        // Stratégies de cache pour les ressources dynamiques
        runtimeCaching: [
          {
            // API backend → Network First (données fraîches en priorité)
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "beautyflow-api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 jour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Images → Cache First (performances maximales)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "beautyflow-images-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Fonts Google → Cache First
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "beautyflow-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-utils';
            }
            return 'vendor';
          }
        }
      }
    }
  }
}));
