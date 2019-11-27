'use strict';

require('./handlePromiseErrors');
const argv = require('minimist')(process.argv.slice(2));
const Stats = require('../stats');
const Sync = require('../sync');
const Packaging = require('../packaging');
const {asyncRimRaf} = require('../utils');
const getBundlesToBuild = require('./getBundlesToBuild');
const createBundle = require('./createBundle');

const forcePrettyOutput = argv.pretty;
const syncFBSourcePath = argv['sync-fbsource'];
const syncWWWPath = argv['sync-www'];
const shouldExtractErrors = argv['extract-errors'];

async function buildEverything() {
  /**
   * Remove the build directory unless the unsafe-partial CLI flag is set
   */
  if (!argv['unsafe-partial']) {
    await asyncRimRaf('build');
  }

  // Run bundle builds serially for better console output
  // and to avoid any potential race conditions.
  const bundles = getBundlesToBuild();

  if (!shouldExtractErrors && process.env.CIRCLE_NODE_TOTAL) {
    // In CI, parallelize bundles across multiple tasks.
    const nodeTotal = parseInt(process.env.CIRCLE_NODE_TOTAL, 10);
    const nodeIndex = parseInt(process.env.CIRCLE_NODE_INDEX, 10);
    bundles = bundles.filter((_, i) => i % nodeTotal === nodeIndex);
  }

  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const [bundle, bundleType] of bundles) {
    await createBundle(bundle, bundleType);
  }

  await Packaging.copyAllShims();
  await Packaging.prepareNpmPackages();

  if (syncFBSourcePath) {
    await Sync.syncReactNative(syncFBSourcePath);
  } else if (syncWWWPath) {
    await Sync.syncReactDom('build/facebook-www', syncWWWPath);
  }

  console.log(Stats.printResults());
  if (!forcePrettyOutput) {
    Stats.saveResults();
  }

  if (shouldExtractErrors) {
    console.warn(
      '\nWarning: this build was created with --extract-errors enabled.\n' +
        'this will result in extremely slow builds and should only be\n' +
        'used when the error map needs to be rebuilt.\n'
    );
  }
}

buildEverything();
