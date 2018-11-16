#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {readFileSync, writeFileSync} = require('fs');
const {readJson, writeJson} = require('fs-extra');
const {join} = require('path');
const printDiff = require('print-diff');
const {confirm, execRead} = require('../utils');

const run = async ({cwd, packages, version}, versionsMap) => {
  const nodeModulesPath = join(cwd, 'build/node_modules');

  // Cache all package JSONs for easy lookup below.
  const sourcePackageJSONs = new Map();
  const targetPackageJSONs = new Map();
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const sourcePackageJSON = await readJson(
      join(cwd, 'packages', packageName, 'package.json')
    );
    sourcePackageJSONs.set(packageName, sourcePackageJSON);
    const targetPackageJSON = await readJson(
      join(nodeModulesPath, packageName, 'package.json')
    );
    targetPackageJSONs.set(packageName, targetPackageJSON);
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
          // Othewise we leave the constraint alone (e.g. react@^16.0.0 doesn't change between releases).
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
  // because the canary dependencies have already been falttened to an exact match (e.g. 0.0.0-ddaf2b07c).
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packageJSONPath = join(nodeModulesPath, packageName, 'package.json');
    const packageJSON = await readJson(packageJSONPath);
    packageJSON.version = versionsMap.get(packageName);

    await updateDependencies(packageJSON, 'dependencies');
    await updateDependencies(packageJSON, 'peerDependencies');

    await writeJson(packageJSONPath, packageJSON, {spaces: 2});
  }

  // Print the map of versions and their dependencies for confirmation.
  const printDependencies = (maybeDependency, label) => {
    if (maybeDependency) {
      for (let dependencyName in maybeDependency) {
        if (packages.includes(dependencyName)) {
          console.log(
            chalk`• {green ${dependencyName}} @ {yellow ${
              maybeDependency[dependencyName]
            }} (${label})`
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
      chalk`\n{green ${packageName}} @ {yellow ${chalk.yellow(
        versionsMap.get(packageName)
      )}}`
    );
    printDependencies(packageJSON.dependencies, 'dependency');
    printDependencies(packageJSON.peerDependencies, 'peer');
  }
  await confirm('Do the versions above look correct?');

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
      const beforeContents = readFileSync(path, 'utf8', {cwd});
      const afterContents = beforeContents.replace(
        new RegExp(version, 'g'),
        versionsMap.get(packageName)
      );
      if (beforeContents !== afterContents) {
        printDiff(beforeContents, afterContents);
        writeFileSync(path, afterContents, {cwd});
      }
    });
  }
  await confirm('Do the replacements above look correct?');
};

// Run this directly because logPromise would interfere with printing package dependencies.
module.exports = run;
