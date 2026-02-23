/**
 * Workbox config for PWA service worker.
 * Run after: npx expo export -p web
 * Usage: npx workbox-cli generateSW workbox-config.js
 */
module.exports = {
  globDirectory: 'dist',
  globPatterns: ['**/*.{js,html,ttf,ico,json,png,svg,woff2}'],
  swDest: 'dist/sw.js',
  clientsClaim: true,
  skipWaiting: true,
};
