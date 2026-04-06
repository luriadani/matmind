const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Fix for @expo/metro-runtime@6.1.2 on Windows:
 * The package's src/index.ts imports './error-overlay/LogBox' which Metro's
 * TypeScript resolver fails to locate on Windows despite the file existing.
 * We intercept only that specific import and replace it with a no-op shim.
 * (LogBox.clearAllLogs is only used to reset dev overlay errors — safe to stub.)
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === './error-overlay/LogBox' &&
    context.originModulePath &&
    context.originModulePath.includes('metro-runtime')
  ) {
    return {
      filePath: path.resolve(__dirname, 'shims/expo-metro-logbox.js'),
      type: 'sourceFile',
    };
  }
  // Fall through to default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
