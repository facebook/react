'use strict';

const basename = require('path').basename;
const fs = require('fs');
const join = require('path').join;
const resolve = require('path').resolve;
const Bundles = require('./bundles');
const asyncCopyTo = require('./utils').asyncCopyTo;

const UMD_DEV = Bundles.bundleTypes.UMD_DEV;
const UMD_PROD = Bundles.bundleTypes.UMD_PROD;
const NODE_DEV = Bundles.bundleTypes.NODE_DEV;
const NODE_PROD = Bundles.bundleTypes.NODE_PROD;
const FB_DEV = Bundles.bundleTypes.FB_DEV;
const FB_PROD = Bundles.bundleTypes.FB_PROD;
const RN_DEV = Bundles.bundleTypes.RN_DEV;
const RN_PROD = Bundles.bundleTypes.RN_PROD;

const facebookWWW = 'facebook-www';

// these files need to be copied to the react-native build
const reactNativeSrcDependencies = [
  'packages/shared/ReactTypes.js',
  'packages/react-native-renderer/src/ReactNativeTypes.js',
];

// these files need to be copied to the react-rt build
const reactNativeRTSrcDependencies = [
  'packages/react-rt-renderer/src/ReactNativeRTTypes.js',
];

// these files need to be copied to the react-cs build
const reactNativeCSSrcDependencies = [
  'packages/react-cs-renderer/src/ReactNativeCSTypes.js',
];

function getPackageName(name) {
  if (name.indexOf('/') !== -1) {
    return name.split('/')[0];
  }
  return name;
}

async function createReactNativeBuild() {
  fs.mkdirSync(join('build', 'react-native'));
  fs.mkdirSync(join('build', 'react-native', 'shims'));
  const from = join('scripts', 'rollup', 'shims', 'react-native');
  const to = join('build', 'react-native', 'shims');
  await asyncCopyTo(from, to);
  await Promise.all(
    reactNativeSrcDependencies.map(srcDependency =>
      asyncCopyTo(resolve(srcDependency), join(to, basename(srcDependency)))
    )
  );
}

async function createReactNativeRTBuild() {
  fs.mkdirSync(join('build', 'react-rt'));
  fs.mkdirSync(join('build', 'react-rt', 'shims'));
  const to = join('build', 'react-rt', 'shims');
  await Promise.all(
    reactNativeRTSrcDependencies.map(srcDependency =>
      asyncCopyTo(resolve(srcDependency), join(to, basename(srcDependency)))
    )
  );
}

async function createReactNativeCSBuild() {
  fs.mkdirSync(join('build', 'react-cs'));
  fs.mkdirSync(join('build', 'react-cs', 'shims'));
  const to = join('build', 'react-cs', 'shims');
  await Promise.all(
    reactNativeCSSrcDependencies.map(srcDependency =>
      asyncCopyTo(resolve(srcDependency), join(to, basename(srcDependency)))
    )
  );
}

async function createFacebookWWWBuild() {
  fs.mkdirSync(join('build', facebookWWW));
  fs.mkdirSync(join('build', facebookWWW, 'shims'));
  const from = join('scripts', 'rollup', 'shims', facebookWWW);
  const to = join('build', facebookWWW, 'shims');
  await asyncCopyTo(from, to);
}

async function copyBundleIntoNodePackage(packageName, filename, bundleType) {
  const packageDirectory = resolve(`./build/packages/${packageName}`);
  if (!fs.existsSync(packageDirectory)) {
    return;
  }
  let from = resolve(`./build/${filename}`);
  let to = `${packageDirectory}/${filename}`;
  // for UMD bundles we have to move the files into a umd directory
  // within the package directory. we also need to set the from
  // to be the root build from directory
  if (bundleType === UMD_DEV || bundleType === UMD_PROD) {
    const distDirectory = `${packageDirectory}/umd`;
    // create a dist directory if not created
    if (!fs.existsSync(distDirectory)) {
      fs.mkdirSync(distDirectory);
    }
    from = resolve(`./build/dist/${filename}`);
    to = `${packageDirectory}/umd/${filename}`;
  }
  // for NODE bundles we have to move the files into a cjs directory
  // within the package directory. we also need to set the from
  // to be the root build from directory
  if (bundleType === NODE_DEV || bundleType === NODE_PROD) {
    const distDirectory = `${packageDirectory}/cjs`;
    // create a dist directory if not created
    if (!fs.existsSync(distDirectory)) {
      fs.mkdirSync(distDirectory);
    }
    to = `${packageDirectory}/cjs/${filename}`;
  }
  await asyncCopyTo(from, to);
  // delete the old file if this is a not a UMD bundle
  if (bundleType !== UMD_DEV && bundleType !== UMD_PROD) {
    fs.unlinkSync(from);
  }
}

async function copyNodePackageTemplate(packageName) {
  const from = resolve(`./packages/${packageName}`);
  const to = resolve(`./build/packages/${packageName}`);
  const npmFrom = resolve(`${from}/npm`);
  if (!fs.existsSync(npmFrom)) {
    // The package is not meant for npm consumption.
    return;
  }
  if (fs.existsSync(to)) {
    // We already created this package (e.g. due to another entry point).
    return;
  }
  // TODO: verify that all copied files are either in the "files"
  // whitelist or implicitly published by npm.
  await asyncCopyTo(npmFrom, to);
  await asyncCopyTo(resolve(`${from}/package.json`), `${to}/package.json`);
  await asyncCopyTo(resolve(`${from}/README.md`), `${to}/README.md`);
  await asyncCopyTo(resolve('./LICENSE'), `${to}/LICENSE`);
}

async function createNodePackage(bundleType, packageName, filename) {
  // the only case where we don't want to copy the package is for FB bundles
  if (bundleType === FB_DEV || bundleType === FB_PROD) {
    return;
  }
  await copyNodePackageTemplate(packageName);
  await copyBundleIntoNodePackage(packageName, filename, bundleType);
}

function getOutputPathRelativeToBuildFolder(bundleType, filename, hasteName) {
  if (bundleType === FB_DEV || bundleType === FB_PROD) {
    return `${facebookWWW}/${filename}`;
  } else if (bundleType === UMD_DEV || bundleType === UMD_PROD) {
    return `dist/${filename}`;
  } else if (bundleType === RN_DEV || bundleType === RN_PROD) {
    if (hasteName === 'ReactRTRenderer') {
      return `react-rt/${filename}`;
    } else if (hasteName === 'ReactCSRenderer') {
      return `react-cs/${filename}`;
    } else {
      return `react-native/${filename}`;
    }
  }
  return filename;
}

module.exports = {
  getOutputPathRelativeToBuildFolder,
  createNodePackage,
  getPackageName,
  createFacebookWWWBuild,
  createReactNativeBuild,
  createReactNativeRTBuild,
  createReactNativeCSBuild,
};
