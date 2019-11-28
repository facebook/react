/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, '../../build/node_modules');
const packages = fs.readdirSync(packagesDir);

process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

packages.forEach(packageName => {
  const packageDir = path.join(packagesDir, packageName);
  const packageJson = require(path.join(packageDir, 'package.json'));

  if (packageJson.main != null) {
    if (!fs.existsSync(path.join(packageDir, packageJson.main))) {
      console.error(
        `package.json for build module ${
          packageJson.name
        } contains a 'main' entry that does not exist`
      );
      process.exit(1);
    }
  }
  if (packageJson.exports != null) {
    if (packageJson.exports.require != null) {
      const cjsEntryFileName = path.join(
        packageDir,
        packageJson.exports.require
      );
      if (!fs.existsSync(cjsEntryFileName)) {
        console.error(
          `package.json for build module ${
            packageJson.name
          } contains a 'module' entry that does not exist`
        );
        process.exit(1);
      }
    }
    if (packageJson.exports.default != null) {
      const esmEntryFileName = path.join(
        packageDir,
        packageJson.exports.default
      );
      if (!fs.existsSync(esmEntryFileName)) {
        console.error(
          `package.json for build module ${
            packageJson.name
          } contains a 'module' entry that does not exist`
        );
        process.exit(1);
      }
    }
  }
});
