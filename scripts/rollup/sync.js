'use strict';

const utils = require('./utils');

const DEFAULT_RN_PATH =
  '~/fbsource/xplat/js/react-native-github/Libraries/Renderer/';

function syncReactNative(buildPath, destPath) {
  destPath = typeof destPath === 'string' ? destPath : DEFAULT_RN_PATH;

  return utils.asyncCopyTo(buildPath, utils.resolvePath(destPath));
}

module.exports = {
  syncReactNative: syncReactNative,
};
