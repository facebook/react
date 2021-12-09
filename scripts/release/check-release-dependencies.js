'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

const fs = require('fs');
const semver = require('semver');

const {stablePackages} = require('../../ReactVersions');

function main() {
  if (!fs.existsSync('./build/oss-stable-semver')) {
    throw new Error('No build artifacts found');
  }

  const packages = new Map();
  for (const packageName in stablePackages) {
    if (!fs.existsSync(`build/oss-stable-semver/${packageName}/package.json`)) {
      throw new Error(`${packageName}`);
    } else {
      const info = JSON.parse(
        fs.readFileSync(`build/oss-stable-semver/${packageName}/package.json`)
      );
      packages.set(info.name, info);
    }
  }

  for (const [packageName, info] of packages) {
    if (info.dependencies) {
      for (const [depName, depRange] of Object.entries(info.dependencies)) {
        if (packages.has(depName)) {
          const releaseVersion = packages.get(depName).version;
          checkDependency(packageName, depName, releaseVersion, depRange);
        }
      }
    }

    if (info.peerDependencies) {
      for (const [depName, depRange] of Object.entries(info.peerDependencies)) {
        if (packages.has(depName)) {
          const releaseVersion = packages.get(depName).version;
          checkDependency(packageName, depName, releaseVersion, depRange);
        }
      }
    }
  }
}

function checkDependency(packageName, depName, version, range) {
  if (!semver.satisfies(version, range)) {
    throw new Error(
      `${packageName} has an invalid dependency on ${depName}: ${range}` +
        '\n\n' +
        'Actual version is: ' +
        version
    );
  }
}

main();
