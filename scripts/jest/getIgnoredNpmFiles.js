/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

const path = require('path');
const {existsSync, readdirSync, statSync} = require('fs');
const glob = require('glob');

require('./setupEnvironment');

function getIgnoredNpmFiles() {
  const packagesPath = path.resolve('packages');
  const packageNames = readdirSync('packages');

  const result = [];
  for (const packageName of packageNames) {
    const packagePath = path.join(packagesPath, packageName);

    if (statSync(packagePath).isFile()) {
      continue;
    }

    let packageInfo;
    const packageJSONModulePath = path.join(packagePath, 'package.js');
    const packageJSONPath = path.join(packagePath, 'package.json');
    if (existsSync(packageJSONModulePath)) {
      packageInfo = require(packageJSONModulePath);
    } else if (existsSync(packageJSONPath)) {
      packageInfo = require(packageJSONPath);
    } else {
      continue;
    }

    if (packageInfo.private) {
      continue;
    }

    if (packageInfo.files) {
      const ignoredFilesGlobs = [];
      for (let filePattern of packageInfo.files) {
        if (filePattern.endsWith('/')) {
          filePattern = filePattern.slice(0, -1);
        }
        ignoredFilesGlobs.push(filePattern);
      }
      const ignoredFilesGlob = '!(' + ignoredFilesGlobs.join('|') + ')';
      const ignoredFiles = glob
        .sync(ignoredFilesGlob, {cwd: packagePath})
        .map(f => path.join(packageName, f));
      result.push(...ignoredFiles);
    }
  }
  return result;
}

module.exports = getIgnoredNpmFiles;
