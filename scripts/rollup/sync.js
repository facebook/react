'use strict';

const asyncCopyTo = require('./utils').asyncCopyTo;
const chalk = require('chalk');
const resolvePath = require('./utils').resolvePath;

const DEFAULT_FB_SOURCE_PATH = '~/fbsource/';
const RELATIVE_RN_PATH = 'xplat/js/react-native-github/Libraries/Renderer/';

function syncReactNative(buildPath, fbSourcePath) {
  fbSourcePath = typeof fbSourcePath === 'string'
    ? fbSourcePath
    : DEFAULT_FB_SOURCE_PATH;

  if (fbSourcePath.charAt(fbSourcePath.length - 1) !== '/') {
    fbSourcePath += '/';
  }

  const destPath = resolvePath(fbSourcePath + RELATIVE_RN_PATH);

  console.log(
    `${chalk.bgYellow.black(' SYNCING ')} ReactNative to ${destPath}`
  );

  const promise = asyncCopyTo(buildPath, destPath);
  promise.then(() => {
    console.log(
      `${chalk.bgGreen.black(' SYNCED ')} ReactNative to ${destPath}`
    );
  });

  return promise;
}

module.exports = {
  syncReactNative: syncReactNative,
};
