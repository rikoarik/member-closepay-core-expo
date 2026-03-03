/**
 * Re-export web implementation for TypeScript and Metro (web resolves to .web.tsx).
 * Native uses QrScanScreenExpo from QrScreen; this file is only loaded on web.
 */
export { QrScanScreen } from './QrScanScreen.web';
