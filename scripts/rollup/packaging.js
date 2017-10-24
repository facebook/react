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
// these files need to be copied to the facebook-www build
const facebookWWWSrcDependencies = [
  'packages/react-dom/src/events/TapEventPlugin.js',
];

// these files need to be copied to the react-native build
const reactNativeSrcDependencies = [
  'packages/react-reconciler/src/ReactTypes.js',
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

function createReactNativeBuild() {
  // create the react-native folder for FB bundles
  fs.mkdirSync(join('build', 'react-native'));
  // create the react-native shims folder for FB shims
  fs.mkdirSync(join('build', 'react-native', 'shims'));
  // copy in all the shims from build/rollup/shims/react-native
  const from = join('scripts', 'rollup', 'shims', 'react-native');
  const to = join('build', 'react-native', 'shims');

  return asyncCopyTo(from, to).then(() => {
    let promises = [];
    // we also need to copy over some specific files from src
    // defined in reactNativeSrcDependencies
    for (const srcDependency of reactNativeSrcDependencies) {
      promises.push(
        asyncCopyTo(resolve(srcDependency), join(to, basename(srcDependency)))
      );
    }
    return Promise.all(promises);
  });
}

function createReactNativeRTBuild() {
  // create the react-rt folder for FB bundles
  fs.mkdirSync(join('build', 'react-rt'));
  // create the react-rt shims folder for FB shims
  fs.mkdirSync(join('build', 'react-rt', 'shims'));

  const to = join('build', 'react-rt', 'shims');

  let promises = [];
  // we also need to copy over some specific files from src
  // defined in reactNativeRTSrcDependencies
  for (const srcDependency of reactNativeRTSrcDependencies) {
    promises.push(
      asyncCopyTo(resolve(srcDependency), join(to, basename(srcDependency)))
    );
  }
  return Promise.all(promises);
}

function createReactNativeCSBuild() {
  // create the react-cs folder for FB bundles
  fs.mkdirSync(join('build', 'react-cs'));
  // create the react-cs shims folder for FB shims
  fs.mkdirSync(join('build', 'react-cs', 'shims'));

  const to = join('build', 'react-cs', 'shims');

  let promises = [];
  // we also need to copy over some specific files from src
  // defined in reactNativeCSSrcDependencies
  for (const srcDependency of reactNativeCSSrcDependencies) {
    promises.push(
      asyncCopyTo(resolve(srcDependency), join(to, basename(srcDependency)))
    );
  }
  return Promise.all(promises);
}

function createFacebookWWWBuild() {
  // create the facebookWWW folder for FB bundles
  fs.mkdirSync(join('build', facebookWWW));
  // create the facebookWWW shims folder for FB shims
  fs.mkdirSync(join('build', facebookWWW, 'shims'));
  // copy in all the shims from build/rollup/shims/facebook-www
  const from = join('scripts', 'rollup', 'shims', facebookWWW);
  const to = join('build', facebookWWW, 'shims');

  return asyncCopyTo(from, to).then(() => {
    let promises = [];
    // we also need to copy over some specific files from src
    // defined in facebookWWWSrcDependencies
    for (const srcDependency of facebookWWWSrcDependencies) {
      promises.push(
        asyncCopyTo(resolve(srcDependency), join(to, basename(srcDependency)))
      );
    }
    return Promise.all(promises);
  });
}

function copyBundleIntoNodePackage(packageName, filename, bundleType) {
  const packageDirectory = resolve(`./build/packages/${packageName}`);

  if (fs.existsSync(packageDirectory)) {
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
    return asyncCopyTo(from, to).then(() => {
      // delete the old file if this is a not a UMD bundle
      if (bundleType !== UMD_DEV && bundleType !== UMD_PROD) {
        fs.unlinkSync(from);
      }
    });
  } else {
    return Promise.resolve();
  }
}

function copyNodePackageTemplate(packageName) {
  const from = resolve(`./packages/${packageName}`);
  const to = resolve(`./build/packages/${packageName}`);
  const npmFrom = resolve(`${from}/npm`);
  if (!fs.existsSync(npmFrom)) {
    // The package is not meant for npm consumption.
    return Promise.resolve();
  }
  if (fs.existsSync(to)) {
    // We already created this package (e.g. due to another entry point).
    return Promise.resolve();
  }
  // TODO: verify that all copied files are either in the "files"
  // whitelist or implicitly published by npm.
  return asyncCopyTo(npmFrom, to).then(() =>
    Promise.all([
      asyncCopyTo(resolve(`${from}/package.json`), `${to}/package.json`),
      asyncCopyTo(resolve(`${from}/README.md`), `${to}/README.md`),
      asyncCopyTo(resolve('./LICENSE'), `${to}/LICENSE`),
    ])
  );
}

function createNodePackage(bundleType, packageName, filename) {
  // the only case where we don't want to copy the package is for FB bundles
  if (bundleType !== FB_DEV && bundleType !== FB_PROD) {
    return copyNodePackageTemplate(packageName).then(() =>
      copyBundleIntoNodePackage(packageName, filename, bundleType)
    );
  }
  return Promise.resolve();
}

function getPackageDestination(config, bundleType, filename, hasteName) {
  let dest = config.destDir + filename;

  if (bundleType === FB_DEV || bundleType === FB_PROD) {
    dest = `${config.destDir}${facebookWWW}/${filename}`;
  } else if (bundleType === UMD_DEV || bundleType === UMD_PROD) {
    dest = `${config.destDir}dist/${filename}`;
  } else if (bundleType === RN_DEV || bundleType === RN_PROD) {
    if (hasteName === 'ReactRTRenderer') {
      dest = `${config.destDir}react-rt/${filename}`;
    } else if (hasteName === 'ReactCSRenderer') {
      dest = `${config.destDir}react-cs/${filename}`;
    } else {
      dest = `${config.destDir}react-native/${filename}`;
    }
  }
  return dest;
}

module.exports = {
  getPackageDestination,
  createNodePackage,
  getPackageName,
  createFacebookWWWBuild,
  createReactNativeBuild,
  createReactNativeRTBuild,
  createReactNativeCSBuild,
};
