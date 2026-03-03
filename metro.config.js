const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

const ALIAS = {
  '@core': path.resolve(projectRoot, 'packages/core'),
  '@experience-core': path.resolve(projectRoot, 'packages/experience-core'),
  '@plugins': path.resolve(projectRoot, 'packages/plugins'),
  '@app': path.resolve(projectRoot, 'apps/member-base/src'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-linear-gradient') {
    const shim = platform === 'web'
      ? 'shim-linear-gradient.web.js'
      : 'shim-linear-gradient.native.js';
    return {
      type: 'sourceFile',
      filePath: path.resolve(projectRoot, shim),
    };
  }
  if (moduleName === 'react-native-maps' && platform === 'web') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(projectRoot, 'shim-maps.web.js'),
    };
  }
  const aliasMatch = Object.keys(ALIAS).find((alias) => moduleName === alias || moduleName.startsWith(alias + '/'));
  if (aliasMatch) {
    const fs = require('fs');
    const targetDir = moduleName === aliasMatch ? ALIAS[aliasMatch] : path.join(ALIAS[aliasMatch], path.normalize(moduleName.slice(aliasMatch.length + 1)));
    const ext = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    const tryFile = (p) => { try { return fs.existsSync(p) ? p : null; } catch (_) { return null; } };
    for (const e of ext) {
      const f = tryFile(path.join(targetDir, 'index' + e));
      if (f) return { type: 'sourceFile', filePath: f };
    }
    for (const e of ext) {
      const f = tryFile(targetDir + e);
      if (f) return { type: 'sourceFile', filePath: f };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
