'use strict';

const asyncCopyTo = require('./utils').asyncCopyTo;
const chalk = require('chalk');
const resolvePath = require('./utils').resolvePath;

const DEFAULT_FB_SOURCE_PATH = '~/fbsource/';
const DEFAULT_WWW_PATH = '~/www/';
const RELATIVE_RN_PATH = 'xplat/js/react-native-github/Libraries/Renderer/';
const RELATIVE_RN_CS_PATH = 'xplat/js/RKJSModules/Libraries/CS/downstream/';
const RELATIVE_RN_RT_PATH = 'xplat/js/RKJSModules/Libraries/RT/downstream/';
const RELATIVE_WWW_PATH = 'html/shared/react/';

function doSync(buildPath, destPath) {
  console.log(`${chalk.bgYellow.black(' SYNCING ')} React to ${destPath}`);

  const promise = asyncCopyTo(buildPath, destPath);
  promise.then(() => {
    console.log(`${chalk.bgGreen.black(' SYNCED ')} React to ${destPath}`);
  });

  return promise;
}

function syncReactDom(buildPath, wwwPath) {
  wwwPath = typeof wwwPath === 'string' ? wwwPath : DEFAULT_WWW_PATH;

  if (wwwPath.charAt(wwwPath.length - 1) !== '/') {
    wwwPath += '/';
  }

  const destPath = resolvePath(wwwPath + RELATIVE_WWW_PATH);

  return doSync(buildPath, destPath);
}

function syncReactNativeHelper(buildPath, fbSourcePath, relativeDestPath) {
  fbSourcePath =
    typeof fbSourcePath === 'string' ? fbSourcePath : DEFAULT_FB_SOURCE_PATH;

  if (fbSourcePath.charAt(fbSourcePath.length - 1) !== '/') {
    fbSourcePath += '/';
  }

  const destPath = resolvePath(fbSourcePath + relativeDestPath);

  return doSync(buildPath, destPath);
}

function syncReactNative(buildPath, fbSourcePath) {
  return syncReactNativeHelper(buildPath, fbSourcePath, RELATIVE_RN_PATH);
}

function syncReactNativeCS(buildPath, fbSourcePath) {
  return syncReactNativeHelper(buildPath, fbSourcePath, RELATIVE_RN_CS_PATH);
}

function syncReactNativeRT(buildPath, fbSourcePath) {
  return syncReactNativeHelper(buildPath, fbSourcePath, RELATIVE_RN_RT_PATH);
}

module.exports = {
  syncReactDom,
  syncReactNative,
  syncReactNativeCS,
  syncReactNativeRT,
};
