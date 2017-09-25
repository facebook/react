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
  'src/renderers/dom/shared/eventPlugins/TapEventPlugin.js',
];

// these files need to be copied to the react-native build
const reactNativeSrcDependencies = [
  // TODO: copy this to RN repository and delete from React
  'src/renderers/shared/stack/PooledClass.js',
  'src/renderers/shared/fiber/isomorphic/ReactTypes.js',
  'src/renderers/native/ReactNativeTypes.js',
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

  // if the package directory already exists, we skip copying to it
  if (!fs.existsSync(to) && fs.existsSync(from)) {
    return asyncCopyTo(from, to).then(() =>
      Promise.all([
        asyncCopyTo(resolve('./LICENSE'), `${to}/LICENSE`),
        asyncCopyTo(resolve('./PATENTS'), `${to}/PATENTS`),
      ])
    );
  } else {
    return Promise.resolve();
  }
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

function getPackageDestination(config, bundleType, filename) {
  let dest = config.destDir + filename;

  if (bundleType === FB_DEV || bundleType === FB_PROD) {
    dest = `${config.destDir}${facebookWWW}/${filename}`;
  } else if (bundleType === UMD_DEV || bundleType === UMD_PROD) {
    dest = `${config.destDir}dist/${filename}`;
  } else if (bundleType === RN_DEV || bundleType === RN_PROD) {
    dest = `${config.destDir}react-native/${filename}`;
  }
  return dest;
}

module.exports = {
  getPackageDestination,
  createNodePackage,
  getPackageName,
  createFacebookWWWBuild,
  createReactNativeBuild,
};
