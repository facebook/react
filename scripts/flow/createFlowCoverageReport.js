/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const chalk = require('chalk');
const path = require('path');
const spawn = require('child_process').spawn;
const rimraf = require('rimraf');
const writeConfig = require('./flowConfig').writeConfig;

function deleteFlowConfig() {
  const file = path.join(__dirname, '../../.flowconfig');
  rimraf.sync(file);
}

async function createFlowCoverage(renderer) {
  return new Promise(resolve => {
    console.log(
      `Creating Flow coverage report for the ${chalk.yellow(
        renderer,
      )} renderer...`,
    );
    let cmd = path.join(
      __dirname,
      '../../node_modules/.bin/flow-coverage-report',
    );
    if (process.platform === 'win32') {
      cmd = cmd + '.cmd';
    }

    writeConfig(renderer, true);

    spawn(cmd, ['--config', 'scripts/flow/.flowcoverage'], {
      // Allow colors to pass through:
      stdio: 'inherit',
    }).on('close', function() {
      deleteFlowConfig();
      resolve();
    });
  });
}

module.exports = createFlowCoverage;
