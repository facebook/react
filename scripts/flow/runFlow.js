/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const chalk = require('chalk');
const spawn = require('child_process').spawn;
const {isJUnitEnabled, writeJUnitReport} = require('../shared/reporting');

require('./createFlowConfigs');

async function runFlow(renderer, args) {
  const spawnOptions = isJUnitEnabled() ? {} : {stdio: 'inherit'};
  let createReport = () => {};
  let reportChunks = [];

  return new Promise(resolve => {
    console.log(
      'Running Flow on the ' + chalk.yellow(renderer) + ' renderer...',
    );
    let cmd = __dirname + '/../../node_modules/.bin/flow';
    if (process.platform === 'win32') {
      cmd = cmd.replace(/\//g, '\\') + '.cmd';
    }
    const flow = spawn(cmd, args, {
      ...spawnOptions,
      // Use a specific renderer config:
      cwd: process.cwd() + '/scripts/flow/' + renderer + '/',
    });

    if (isJUnitEnabled()) {
      flow.stdout.on('data', data => {
        createReport = stepHasSucceeded => {
          if (!stepHasSucceeded) {
            reportChunks.push(data);
          }
          writeJUnitReport('flow', data, stepHasSucceeded);
        };
      });
    }

    flow.on('close', function(code) {
      if (code !== 0) {
        console.error(
          'Flow failed for the ' + chalk.red(renderer) + ' renderer',
        );
        createReport(false);
        console.log();
        process.exit(code);
      } else {
        console.log(
          'Flow passed for the ' + chalk.green(renderer) + ' renderer',
        );
        createReport(true);
        resolve();
      }
    });
  });
}

module.exports = runFlow;
