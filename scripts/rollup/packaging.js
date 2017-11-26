'use strict';

const basename = require('path').basename;
const dirname = require('path').dirname;
const fs = require('fs');
const join = require('path').join;
const resolve = require('path').resolve;
const Bundles = require('./bundles');
const asyncCopyTo = require('./utils').asyncCopyTo;
const glob = require('glob');
const mkdirp = require('mkdirp');

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

  return asyncCopyTo(from, to);
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
  const npmFrom = `${from}/npm`;
  if (!fs.existsSync(npmFrom)) {
    // The package is not meant for npm consumption.
    return Promise.resolve();
  }
  if (fs.existsSync(to)) {
    // We already created this package (e.g. due to another entry point).
    return Promise.resolve();
  }
  // Get all entry points in the package root
  // Exceptions: *.fb.js
  const packageEntries = glob.sync('!(*.fb).js', {
    cwd: from,
  });
  const npmFiles = fs.readdirSync(npmFrom);
  packageEntries.forEach(entry => {
    if (!npmFiles.includes(entry)) {
      // Terminate the build if any entry point(Exception: *.fb.js)
      // does not have an equivalent in ./npm.
      console.error(
        `Entry point ${entry} in package ${
          packageName
        } does not have an equivalent in ./npm`
      );
      process.exit(1);
    }
  });
  const packageJson = `${from}/package.json`;
  const whitelist = fs.existsSync(packageJson) && require(packageJson).files;
  let promisesForForwardingModules = [];
  if (!whitelist) {
    // Terminate the build if 'files' field is missing from package.json.
    console.error(
      `'files' field is missing from package.json in package ${packageName}`
    );
    process.exit(1);
  }
  // looping through entries(single file / directory / pattern) in `files`
  const whitelistedFiles = whitelist.reduce((list, pattern) => {
    const matchedFiles = glob.sync(pattern, {
      cwd: npmFrom,
    });
    // copy matching files/directories from './npm' to build package.
    matchedFiles.forEach(file => {
      mkdirp.sync(`${to}/${dirname(file)}`);
      promisesForForwardingModules.push(
        asyncCopyTo(`${npmFrom}/${file}`, `${to}/${file}`)
      );
    });
    // return an array of whitelisted files
    // for entry point check next.
    // All patterns have been parsed to file/directory
    return list.concat(matchedFiles);
  }, []);
  // terminate the build if any entry point(Exception: *.fb.js)
  // is not whitelisted in the 'files' field in package.json.
  packageEntries.forEach(entry => {
    if (!whitelistedFiles.includes(entry)) {
      console.error(
        `Entry point ${entry} in package ${
          packageName
        } is not listed in the 'files' field in package.json`
      );
      process.exit(1);
    }
  });
  return Promise.all([
    ...promisesForForwardingModules,
    asyncCopyTo(resolve(`${from}/package.json`), `${to}/package.json`),
    asyncCopyTo(resolve(`${from}/README.md`), `${to}/README.md`),
    asyncCopyTo(resolve('./LICENSE'), `${to}/LICENSE`),
  ]);
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
