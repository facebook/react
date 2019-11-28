/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');

const {window} = new JSDOM(
  `<body>
  <script>document.body.appendChild(document.createElement("hr"));</script>
</body>`,
  {runScripts: 'dangerously'}
);

global.window = window;
global.document = window.document;
global.navigator = window.navigator;

const packagesDir = path.join(__dirname, '../../build/node_modules');
const packages = fs.readdirSync(packagesDir);

process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

function failHardIf(predicate, message) {
  if (predicate) {
    console.error(message);
    process.exit(1);
  }
}

packages.forEach(async packageName => {
  console.log(`inspect ${packageName}`);
  const packageDir = path.join(packagesDir, packageName);
  const packageJson = require(path.join(packageDir, 'package.json'));

  if (packageJson.main != null) {
    failHardIf(
      !fs.existsSync(path.join(packageDir, packageJson.main)),
      `package.json for build module ${
        packageJson.name
      } contains a 'main' entry that does not exist`
    );

    const exported = require(packageDir);
    failHardIf(
      !exported,
      `package.json for build module ${
        packageJson.name
      } does not export anything from main`
    );
  }

  if (packageJson.exports != null) {
    if (packageJson.exports.require != null) {
      console.log('\tinspect cjs export');
      const cjsEntryFileName = path.join(
        packageDir,
        packageJson.exports.require
      );
      failHardIf(
        !fs.existsSync(cjsEntryFileName),
        `package.json for build module ${
          packageJson.name
        } contains a 'module' entry that does not exist`
      );
    }
    if (packageJson.exports.default != null) {
      console.log('\tinspect esm export');
      const esmEntryFileName = path.join(
        packageDir,
        packageJson.exports.default
      );
      failHardIf(
        !fs.existsSync(esmEntryFileName),
        `package.json for build module ${
          packageJson.name
        } contains a 'module' entry that does not exist`
      );

      const result = await import(packageDir);
      failHardIf(
        !result,
        `package.json for build module ${
          packageJson.name
        } does not export anything from esm`
      );
    }
  }
});
