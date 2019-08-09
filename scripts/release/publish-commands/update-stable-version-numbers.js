#!/usr/bin/env node

'use strict';

const {readFileSync, writeFileSync} = require('fs');
const {readJson, writeJson} = require('fs-extra');
const {join} = require('path');

const run = async ({cwd, packages, skipPackages, tags}) => {
  if (!tags.includes('latest')) {
    // Don't update version numbers for alphas.
    return;
  }

  const nodeModulesPath = join(cwd, 'build/node_modules');
  const packagesPath = join(cwd, 'packages');

  // Update package versions and dependencies (in source) to mirror what was published to NPM.
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const publishedPackageJSON = await readJson(
      join(nodeModulesPath, packageName, 'package.json')
    );
    const sourcePackageJSONPath = join(
      packagesPath,
      packageName,
      'package.json'
    );
    const sourcePackageJSON = await readJson(sourcePackageJSONPath);
    sourcePackageJSON.version = publishedPackageJSON.version;
    sourcePackageJSON.dependencies = publishedPackageJSON.dependencies;
    sourcePackageJSON.peerDependencies = publishedPackageJSON.peerDependencies;

    await writeJson(sourcePackageJSONPath, sourcePackageJSON, {spaces: 2});
  }

  // Update the shared React version source file.
  // (Unless this release does not include an update to React)
  if (!skipPackages.includes('react')) {
    const sourceReactVersionPath = join(cwd, 'packages/shared/ReactVersion.js');
    const {version} = await readJson(
      join(nodeModulesPath, 'react', 'package.json')
    );
    const sourceReactVersion = readFileSync(
      sourceReactVersionPath,
      'utf8'
    ).replace(/module\.exports = '[^']+';/, `module.exports = '${version}';`);
    writeFileSync(sourceReactVersionPath, sourceReactVersion);
  }
};

module.exports = run;
