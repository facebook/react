/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

process.on('unhandledRejection', err => {
  throw err;
});

const chalk = require('chalk');
const createFlowCoverageReport = require('../flow/createFlowCoverageReport');
const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

const primaryRenderer = inlinedHostConfigs.find(
  info => info.isFlowTyped && info.shortName === process.argv[2]
);
if (!primaryRenderer) {
  console.log(
    'The ' +
      chalk.red('yarn flow-coverage') +
      ' command requires you to pick a primary renderer:'
  );
  console.log();
  inlinedHostConfigs.forEach(rendererInfo => {
    if (rendererInfo.isFlowTyped) {
      console.log(
        '  * ' + chalk.cyan('yarn flow-coverage ' + rendererInfo.shortName)
      );
    }
  });
  console.log();
  console.log(
    'If you are not sure, run ' + chalk.green('yarn flow-coverage dom') + '.'
  );
  console.log();
  process.exit(1);
}

createFlowCoverageReport(primaryRenderer.shortName);
