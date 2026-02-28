#!/usr/bin/env node

'use strict';

const {readJson, writeJson} = require('fs-extra');
const {join} = require('path');

const run = async (packages, {cwd, tags, prerelease}) => {
  if (!tags.includes('latest')) {
    // Don't update version numbers for alphas.
    return;
  }

  const nodeModulesPath = join(cwd, 'build/node_modules');

  // Update the versions in manifest.version and dependencies to the ones designated when the Canary was published.
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const publishedPackageJSONPath = join(
      nodeModulesPath,
      packageName,
      'package.json'
    );
    const publishedPackageJSON = await readJson(publishedPackageJSONPath);

    if (!publishedPackageJSON.reactPublishStableConfig) {
      throw new Error(
        `Can't promote older React versions with new workflow. ` +
          `Package ${packageName} is missing the reactPublishStableConfig field required to update stable version numbers. `
      );
    }

    const {
      version: designatedStableVersion,
      dependencies: designatedStableDependencies,
      peerDependencies: designatedStablePeerDependencies,
    } = publishedPackageJSON.reactPublishStableConfig;
    delete publishedPackageJSON.reactPublishStableConfig;

    publishedPackageJSON.version = designatedStableVersion;
    for (const dep in designatedStableDependencies) {
      if (!packages.includes(dep)) {
        throw new Error(
          `Cannot update dependencies of ${packageName} because its dependency ${dep} is not being published alongside.`
        );
      }
      publishedPackageJSON.dependencies[dep] =
        designatedStableDependencies[dep];
    }
    for (const dep in designatedStablePeerDependencies) {
      if (!packages.includes(dep)) {
        throw new Error(
          `Cannot update peerDependencies of ${packageName} because its dependency ${dep} is not being published alongside.`
        );
      }
      publishedPackageJSON.peerDependencies[dep] =
        designatedStablePeerDependencies[dep];
    }

    await writeJson(publishedPackageJSONPath, publishedPackageJSON, {
      spaces: 2,
    });
  }
};

module.exports = run;
