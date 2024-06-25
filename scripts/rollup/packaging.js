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

function getPackageName(name) {
  if (name.indexOf('/') !== -1) {
    return name.split('/')[0];
  }
  return name;
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
          header.name = header.name.slice(CONTENTS_FOLDER.length + 1);
        }
      },
    },
  };
}

let entryPointsToHasBundle = new Map();
// eslint-disable-next-line no-for-of-loops/no-for-of-loops
for (const bundle of Bundles.bundles) {
  let hasBundle = entryPointsToHasBundle.get(bundle.entry);
  if (!hasBundle) {
    const hasNonFBBundleTypes = bundle.hasNonFBBundleTypes();
    entryPointsToHasBundle.set(bundle.entry, hasNonFBBundleTypes);
  }
}

function filterOutEntrypoints(name) {
  // Remove entry point files that are not built in this configuration.
  let jsonPath = `build/node_modules/${name}/package.json`;
  let packageJSON = JSON.parse(readFileSync(jsonPath));
  let files = packageJSON.files;
  let exportsJSON = packageJSON.exports;
  let browserJSON = packageJSON.browser;
  if (!Array.isArray(files)) {
    throw new Error('expected all package.json files to contain a files field');
  }
  let changed = false;
  for (let i = 0; i < files.length; i++) {
    let filename = files[i];
    let entry =
      filename === 'index.js'
        ? name
        : name + '/' + filename.replace(/\.js$/, '');
    let hasBundle = entryPointsToHasBundle.get(entry);
    if (hasBundle === undefined) {
      // This entry doesn't exist in the bundles. Check if something similar exists.
      hasBundle =
        entryPointsToHasBundle.get(entry + '.node') ||
        entryPointsToHasBundle.get(entry + '.browser');

      // The .react-server and .rsc suffixes may not have a bundle representation but
      // should infer their bundle status from the non-suffixed entry point.
      if (entry.endsWith('.react-server')) {
        hasBundle = entryPointsToHasBundle.get(
          entry.slice(0, '.react-server'.length * -1)
        );
      } else if (entry.endsWith('.rsc')) {
        hasBundle = entryPointsToHasBundle.get(
          entry.slice(0, '.rsc'.length * -1)
        );
      }
    }
    if (hasBundle === undefined) {
      // This doesn't exist in the bundles. It's an extra file.
    } else if (hasBundle === true) {
      // This is built in this release channel.
    } else {
      // This doesn't have any bundleTypes in this release channel.
      // Let's remove it.
      files.splice(i, 1);
      i--;
      try {
        unlinkSync(`build/node_modules/${name}/${filename}`);
      } catch (err) {
        // If the file doesn't exist we can just move on. Otherwise throw the halt the build
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
      changed = true;
      // Remove it from the exports field too if it exists.
      if (exportsJSON) {
        if (filename === 'index.js') {
          delete exportsJSON['.'];
        } else {
          delete exportsJSON['./' + filename.replace(/\.js$/, '')];
        }
      }
      if (browserJSON) {
        delete browserJSON['./' + filename];
      }
    }

    // We only export the source directory so Jest and Rollup can access them
    // during local development and at build time. The files don't exist in the
    // public builds, so we don't need the export entry, either.
    const sourceWildcardExport = './src/*';
    if (exportsJSON && exportsJSON[sourceWildcardExport]) {
      delete exportsJSON[sourceWildcardExport];
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
  prepareNpmPackages,
};
