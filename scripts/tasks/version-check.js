/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {isJUnitEnabled, writeJUnitReport} = require('../shared/reporting');

const reactVersion = require('../../package.json').version;
const versions = {
  'packages/react/package.json': require('../../packages/react/package.json')
    .version,
  'packages/react-dom/package.json': require('../../packages/react-dom/package.json')
    .version,
  'packages/react-test-renderer/package.json': require('../../packages/react-test-renderer/package.json')
    .version,
  'packages/shared/ReactVersion.js': require('../../packages/shared/ReactVersion'),
};

let errorMessages = [];

let allVersionsMatch = true;
Object.keys(versions).forEach(function(name) {
  const version = versions[name];
  if (version !== reactVersion) {
    allVersionsMatch = false;
    const errorMessage = `${name} version does not match package.json. Expected ${reactVersion}, saw ${version} .`;
    console.log(errorMessage);
    if (isJUnitEnabled()) {
      errorMessages.push(errorMessage);
    }
  }
});

if (!allVersionsMatch) {
  if (isJUnitEnabled()) {
    writeJUnitReport('version-check', errorMessages.join('\n'), false);
  }
  process.exit(1);
}
