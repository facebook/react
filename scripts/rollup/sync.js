'use strict';

const asyncCopyTo = require('./utils').asyncCopyTo;
const chalk = require('chalk');
const resolvePath = require('./utils').resolvePath;

const DEFAULT_FB_SOURCE_PATH = '~/fbsource/';
const DEFAULT_WWW_PATH = '~/www/';
const RELATIVE_RN_OSS_PATH = 'xplat/js/react-native-github/Libraries/Renderer/';
const RELATIVE_WWW_PATH = 'html/shared/react/';

async function doSync(buildPath, destPath) {
  console.log(`${chalk.bgYellow.black(' SYNCING ')} React to ${destPath}`);

  await asyncCopyTo(buildPath, destPath);
  console.log(`${chalk.bgGreen.black(' SYNCED ')} React to ${destPath}`);
}

async function syncReactDom(buildPath, wwwPath) {
  wwwPath = typeof wwwPath === 'string' ? wwwPath : DEFAULT_WWW_PATH;

  if (wwwPath.charAt(wwwPath.length - 1) !== '/') {
    wwwPath += '/';
  }

  const destPath = resolvePath(wwwPath + RELATIVE_WWW_PATH);
  await doSync(buildPath, destPath);
}

async function syncReactNativeHelper(
  buildPath,
  fbSourcePath,
  relativeDestPath
) {
  fbSourcePath =
    typeof fbSourcePath === 'string' ? fbSourcePath : DEFAULT_FB_SOURCE_PATH;

  if (fbSourcePath.charAt(fbSourcePath.length - 1) !== '/') {
    fbSourcePath += '/';
  }

  const destPath = resolvePath(fbSourcePath + relativeDestPath);
  await doSync(buildPath, destPath);
}

async function syncReactNative(fbSourcePath) {
  await syncReactNativeHelper(
    'build/react-native',
    fbSourcePath,
    RELATIVE_RN_OSS_PATH
  );
}

module.exports = {
  syncReactDom,
  syncReactNative,
};
