'use strict';

const {
  existsSync,
  readdirSync,
  unlinkSync,
  readFileSync,
  writeFileSync,
} = require('fs');
const Bundles = require('./bundles');
const {
  asyncCopyTo,
  asyncExecuteCommand,
  asyncExtractTar,
  asyncRimRaf,
} = require('./utils');

const {
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  NODE_DEV,
  NODE_PROD,
  NODE_PROFILING,
  FB_WWW_DEV,
  FB_WWW_PROD,
  FB_WWW_PROFILING,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_OSS_PROFILING,
  RN_FB_DEV,
  RN_FB_PROD,
  RN_FB_PROFILING,
} = Bundles.bundleTypes;

function getPackageName(name) {
  if (name.indexOf('/') !== -1) {
    return name.split('/')[0];
  }
  return name;
}

function getBundleOutputPath(bundleType, filename, packageName) {
  switch (bundleType) {
    case NODE_DEV:
    case NODE_PROD:
    case NODE_PROFILING:
      return `build/node_modules/${packageName}/cjs/${filename}`;
    case UMD_DEV:
    case UMD_PROD:
    case UMD_PROFILING:
      return `build/node_modules/${packageName}/umd/${filename}`;
    case FB_WWW_DEV:
    case FB_WWW_PROD:
    case FB_WWW_PROFILING:
      return `build/facebook-www/${filename}`;
    case RN_OSS_DEV:
    case RN_OSS_PROD:
    case RN_OSS_PROFILING:
      switch (packageName) {
        case 'react-native-renderer':
          return `build/react-native/implementations/${filename}`;
        default:
          throw new Error('Unknown RN package.');
      }
    case RN_FB_DEV:
    case RN_FB_PROD:
    case RN_FB_PROFILING:
      switch (packageName) {
        case 'react-native-renderer':
          return `build/react-native/implementations/${filename.replace(
            /\.js$/,
            '.fb.js'
          )}`;
        default:
          throw new Error('Unknown RN package.');
      }
    default:
      throw new Error('Unknown bundle type.');
  }
}

async function copyWWWShims() {
  await asyncCopyTo(
    `${__dirname}/shims/facebook-www`,
    'build/facebook-www/shims'
  );
}

async function copyRNShims() {
  await asyncCopyTo(
    `${__dirname}/shims/react-native`,
    'build/react-native/shims'
  );
  await asyncCopyTo(
    require.resolve('react-native-renderer/src/ReactNativeTypes.js'),
    'build/react-native/shims/ReactNativeTypes.js'
  );
}

async function copyAllShims() {
  await Promise.all([copyWWWShims(), copyRNShims()]);
}

function getTarOptions(tgzName, packageName) {
  // Files inside the `npm pack`ed archive start
  // with "package/" in their paths. We'll undo
  // this during extraction.
  const CONTENTS_FOLDER = 'package';
  return {
    src: tgzName,
    dest: `build/node_modules/${packageName}`,
    tar: {
      entries: [CONTENTS_FOLDER],
      map(header) {
        if (header.name.indexOf(CONTENTS_FOLDER + '/') === 0) {
          header.name = header.name.substring(CONTENTS_FOLDER.length + 1);
        }
      },
    },
  };
}

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to building in experimental mode. If the release channel is set via
// an environment variable, then check if it's "experimental".
const __EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

function filterOutEntrypoints(name) {
  // Remove entry point files that are not built in this configuration.
  let jsonPath = `build/node_modules/${name}/package.json`;
  let packageJSON = JSON.parse(readFileSync(jsonPath));
  let files = packageJSON.files;
  if (!Array.isArray(files)) {
    throw new Error('expected all package.json files to contain a files field');
  }
  let changed = false;
  for (let i = 0; i < files.length; i++) {
    let filename = files[i];
    if (filename.indexOf('.js') === -1) {
      continue;
    }
    let filepath = `packages/${name}/${filename}`;
    // Check for forks.
    const thisForkedEntry = filepath.replace(
      '.js',
      __EXPERIMENTAL__ ? '.experimental.js' : '.stable.js'
    );
    let hasExports;
    if (existsSync(thisForkedEntry)) {
      hasExports = readFileSync(thisForkedEntry).indexOf('export ') > 0;
    } else {
      // If the file isn't forked, assume we have exports.
      hasExports = true;
    }
    if (!hasExports) {
      // This file doesn't have any exports in this release channel.
      // Let's remove it.
      files.splice(i, 1);
      i--;
      unlinkSync(`build/node_modules/${name}/${filename}`);
      changed = true;
    }
  }
  if (changed) {
    let newJSON = JSON.stringify(packageJSON, null, '  ');
    writeFileSync(jsonPath, newJSON);
  }
}

async function prepareNpmPackage(name) {
  await Promise.all([
    asyncCopyTo('LICENSE', `build/node_modules/${name}/LICENSE`),
    asyncCopyTo(
      `packages/${name}/package.json`,
      `build/node_modules/${name}/package.json`
    ),
    asyncCopyTo(
      `packages/${name}/README.md`,
      `build/node_modules/${name}/README.md`
    ),
    asyncCopyTo(`packages/${name}/npm`, `build/node_modules/${name}`),
  ]);
  filterOutEntrypoints(name);
  const tgzName = (
    await asyncExecuteCommand(`npm pack build/node_modules/${name}`)
  ).trim();
  await asyncRimRaf(`build/node_modules/${name}`);
  await asyncExtractTar(getTarOptions(tgzName, name));
  unlinkSync(tgzName);
}

async function prepareNpmPackages() {
  if (!existsSync('build/node_modules')) {
    // We didn't build any npm packages.
    return;
  }
  const builtPackageFolders = readdirSync('build/node_modules').filter(
    dir => dir.charAt(0) !== '.'
  );
  await Promise.all(builtPackageFolders.map(prepareNpmPackage));
}

module.exports = {
  copyAllShims,
  getPackageName,
  getBundleOutputPath,
  prepareNpmPackages,
};
