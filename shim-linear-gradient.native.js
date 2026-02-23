/**
 * Native (iOS/Android) shim for react-native-linear-gradient.
 * Resolves to expo-linear-gradient so BVLinearGradient is never loaded (Expo Go compatible).
 */
const expo = require('expo-linear-gradient');
const LinearGradient = expo.LinearGradient || expo.default;
if (!LinearGradient) {
  throw new Error('expo-linear-gradient: LinearGradient export not found');
}
module.exports = LinearGradient;
module.exports.LinearGradient = LinearGradient;
