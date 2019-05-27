#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {readFileSync, writeFileSync} = require('fs');
const {readJson, writeJson} = require('fs-extra');
const {join, relative} = require('path');
const {confirm, execRead, printDiff} = require('../utils');
const theme = require('../theme');

const run = async ({cwd, packages, version}, versionsMap) => {
  const nodeModulesPath = join(cwd, 'build/node_modules');

  // Cache all package JSONs for easy lookup below.
  const sourcePackageJSONs = new Map();
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const sourcePackageJSON = await readJson(
      join(cwd, 'packages', packageName, 'package.json')
    );
    sourcePackageJSONs.set(packageName, sourcePackageJSON);
  }

  const updateDependencies = async (targetPackageJSON, key) => {
    const targetDependencies = targetPackageJSON[key];
    if (targetDependencies) {
      const sourceDependencies = sourcePackageJSONs.get(targetPackageJSON.name)[
        key
      ];

      for (let i = 0; i < packages.length; i++) {
        const dependencyName = packages[i];
        const targetDependency = targetDependencies[dependencyName];

        if (targetDependency) {
          // For example, say we're updating react-dom's dependency on scheduler.
          // We compare source packages to determine what the new scheduler dependency constraint should be.
          // To do this, we look at both the local version of the scheduler (e.g. 0.11.0),
          // and the dependency constraint in the local version of react-dom (e.g. scheduler@^0.11.0).
          const sourceDependencyVersion = sourcePackageJSONs.get(dependencyName)
            .version;
          const sourceDependencyConstraint = sourceDependencies[dependencyName];

          // If the source dependency's version and the constraint match,
          // we will need to update the constraint to point at the dependency's new release version,
          // (e.g. scheduler@^0.11.0 becomes scheduler@^0.12.0 when we release scheduler 0.12.0).
          // Otherwise we leave the constraint alone (e.g. react@^16.0.0 doesn't change between releases).
          // Note that in both cases, we must update the target package JSON,
          // since canary releases are all locked to the canary version (e.g. 0.0.0-ddaf2b07c).
          if (
            sourceDependencyVersion ===
            sourceDependencyConstraint.replace(/^[\^\~]/, '')
          ) {
            targetDependencies[
              dependencyName
            ] = sourceDependencyConstraint.replace(
              sourceDependencyVersion,
              versionsMap.get(dependencyName)
            );
          } else {
            targetDependencies[dependencyName] = sourceDependencyConstraint;
          }
        }
      }
    }
  };

  // Update all package JSON versions and their dependencies/peerDependencies.
  // This must be done in a way that respects semver constraints (e.g. 16.7.0, ^16.7.0, ^16.0.0).
  // To do this, we use the dependencies defined in the source package JSONs,
  // because the canary dependencies have already been flattened to an exact match (e.g. 0.0.0-ddaf2b07c).
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packageJSONPath = join(nodeModulesPath, packageName, 'package.json');
    const packageJSON = await readJson(packageJSONPath);
    packageJSON.version = versionsMap.get(packageName);

    await updateDependencies(packageJSON, 'dependencies');
    await updateDependencies(packageJSON, 'peerDependencies');

    await writeJson(packageJSONPath, packageJSON, {spaces: 2});
  }

  clear();

  // Print the map of versions and their dependencies for confirmation.
  const printDependencies = (maybeDependency, label) => {
    if (maybeDependency) {
      for (let dependencyName in maybeDependency) {
        if (packages.includes(dependencyName)) {
          console.log(
            theme`• {package ${dependencyName}} {version ${
              maybeDependency[dependencyName]
            }} {dimmed ${label}}`
          );
        }
      }
    }
  };
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packageJSONPath = join(nodeModulesPath, packageName, 'package.json');
    const packageJSON = await readJson(packageJSONPath);
    console.log(
      theme`\n{package ${packageName}} {version ${versionsMap.get(
        packageName
      )}}`
    );
    printDependencies(packageJSON.dependencies, 'dependency');
    printDependencies(packageJSON.peerDependencies, 'peer');
  }
  await confirm('Do the versions above look correct?');

  clear();

  // A separate "React version" is used for the embedded renderer version to support DevTools,
  // since it needs to distinguish between different version ranges of React.
  // We need to replace it as well as the canary version number.
  const buildInfoPath = join(nodeModulesPath, 'react', 'build-info.json');
  const {reactVersion} = await readJson(buildInfoPath);

  if (!reactVersion) {
    console.error(
      theme`{error Unsupported or invalid build metadata in} {path build/node_modules/react/build-info.json}` +
        theme`{error . This could indicate that you have specified an outdated canary version.}`
    );
    process.exit(1);
  }

  // We print the diff to the console for review,
  // but it can be large so let's also write it to disk.
  const diffPath = join(cwd, 'build', 'temp.diff');
  let diff = '';
  let numFilesModified = 0;

  // Find-and-replace hard coded version (in built JS) for renderers.
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packagePath = join(nodeModulesPath, packageName);

    let files = await execRead(
      `find ${packagePath} -name '*.js' -exec echo {} \\;`,
      {cwd}
    );
    files = files.split('\n');
    files.forEach(path => {
      const newStableVersion = versionsMap.get(packageName);
      const beforeContents = readFileSync(path, 'utf8', {cwd});
      let afterContents = beforeContents;
      // Replace all canary version numbers (e.g. header @license).
      while (afterContents.indexOf(version) >= 0) {
        afterContents = afterContents.replace(version, newStableVersion);
      }
      // Replace inline renderer version numbers (e.g. shared/ReactVersion).
      while (afterContents.indexOf(reactVersion) >= 0) {
        afterContents = afterContents.replace(reactVersion, newStableVersion);
      }
      if (beforeContents !== afterContents) {
        numFilesModified++;
        // Using a relative path for diff helps with the snapshot test
        diff += printDiff(relative(cwd, path), beforeContents, afterContents);
        writeFileSync(path, afterContents, {cwd});
      }
    });
  }
  writeFileSync(diffPath, diff, {cwd});
  console.log(theme.header(`\n${numFilesModified} files have been updated.`));
  console.log(
    theme`A full diff is available at {path ${relative(cwd, diffPath)}}.`
  );
  await confirm('Do the changes above look correct?');

  clear();
};

// Run this directly because logPromise would interfere with printing package dependencies.
module.exports = run;
