/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
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

const IGNORED_PACKAGES = {
  'react-refresh': true,
  'react-interactions': true,
};
const packagesDir = path.join(__dirname, 'node_modules');
const packages = fs.readdirSync(packagesDir).filter(t => !IGNORED_PACKAGES[t]);
let errors = [];

process.on('unhandledRejection', err => {
  console.error(err);
  errors.push({err});
});

function ok(key) {
  console.log(`\t${key} ${chalk.green('ok')}`);
}

function fail(key, message) {
  errors.push({key, message});
  if (message) {
    console.log(`\t${key} ${chalk.red('fail')}\n\t\t`, message);
  } else {
    console.log(`\t${key} ${chalk.red('fail')}`);
  }
}

function check(key, predicate) {
  if (predicate) {
    ok(key);
  } else {
    fail(key);
  }
}

async function checkPackages() {
  for (let packageName of packages) {
    console.log(`inspect ${packageName}`);
    const packageDir = path.join(packagesDir, packageName);
    const packageJson = require(path.join(packageDir, 'package.json'));
    let mainFileName;

    // check main file existence
    if (packageJson.main) {
      mainFileName = path.join(packageDir, packageJson.main);
      check('pkg.main file exists', fs.existsSync(mainFileName));
    }

    // check exports map file existence
    if (packageJson.exports) {
      const exportKeys = Object.keys(packageJson.exports);
      exportKeys.forEach(key => {
        if (packageJson.exports[key].require) {
          check(
            `pkg.exports[${key}].require file exists`,
            fs.existsSync(
              path.join(packageDir, packageJson.exports[key].require)
            )
          );
        }
        if (packageJson.exports[key].default) {
          check(
            `pkg.exports[${key}].default file exists`,
            fs.existsSync(
              path.join(packageDir, packageJson.exports[key].default)
            )
          );
        }
      });
    }

    // check top-level require
    checkRequire(packageName);

    if (packageJson.exports) {
      for (let exportKey of Object.keys(packageJson.exports)) {
        let importPath = path.join(packageName, exportKey);

        checkRequire(importPath);
        await checkImport(importPath);
      }
    }
  }
}

function checkRequire(requirePath) {
  try {
    const result = require(requirePath);
    ok(`require('${requirePath}') doesn't throw`);
    check(`require('${requirePath}') has valid exports`, result);
  } catch (err) {
    fail(`require('${requirePath}') doesn't throw`, err);
  }
}

function checkImport(importPath) {
  return import(importPath)
    .then(result => {
      check(
        `import('${importPath}') has valid exports`,
        result && Object.keys(result).length > 0
      );
    })
    .catch(err => {
      fail(`import('${importPath}') doesn't throw`, err.message);
    });
}

checkPackages()
  .then(() => {
    if (errors.length > 0) {
      console.log(`caught ${errors.length} errors`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.log(`unhnadled error`, error);
    process.exit(2);
  });
