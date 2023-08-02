/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

process.on('unhandledRejection', err => {
  throw err;
});

const chalk = require('chalk');
const runFlow = require('../flow/runFlow');
const inlinedHostConfigs = require('../shared/inlinedHostConfigs');
const inlinedBundlerConfigs = require('../shared/inlinedBundlerConfigs');

// This script is using `flow status` for a quick check with a server.
// Use it for local development.

const primaryRenderer = inlinedHostConfigs.find(
  info => info.isFlowTyped && info.shortName === process.argv[2]
);
if (!primaryRenderer) {
  console.log(
    'The ' +
      chalk.red('yarn flow') +
      ' command now requires you to pick a primary renderer and optionally a specific bundler:'
  );
  console.log();
  inlinedHostConfigs.forEach(rendererInfo => {
    if (rendererInfo.isFlowTyped) {
      if (
        Array.isArray(rendererInfo.bundlers) &&
        rendererInfo.bundlers.length > 0
      ) {
        rendererInfo.bundlers.forEach((bundlers, i) => {
          console.log(
            '  * ' +
              chalk.cyan(
                'yarn flow ' +
                  rendererInfo.shortName +
                  (i > 0 ? ' ' + bundlers : '')
              )
          );
        });
      } else {
        console.log('  * ' + chalk.cyan('yarn flow ' + rendererInfo.shortName));
      }
    }
  });
  console.log();
  console.log(
    'If you are not sure, run ' + chalk.green('yarn flow dom-node') + '.'
  );
  console.log(
    'This will still typecheck non-DOM packages, although less precisely.'
  );
  console.log();
  console.log('Note that checks for all renderers will run on CI.');
  console.log(
    'You can also do this locally with ' +
      chalk.cyan('yarn flow-ci') +
      ' but it will be slow.'
  );
  console.log();
  process.exit(1);
}

if (
  Array.isArray(primaryRenderer.bundlers) &&
  primaryRenderer.bundlers.length > 0
) {
  const targetBundler = process.argv[3];
  const availableBundlers = primaryRenderer.bundlers;
  const defaultBundler = availableBundlers[0];

  let bundlerInfo;
  if (targetBundler) {
    bundlerInfo = inlinedBundlerConfigs.find(
      info => info.shortName === targetBundler
    );
  } else {
    bundlerInfo = inlinedBundlerConfigs.find(
      info => info.shortName === defaultBundler
    );
  }

  if (targetBundler && !availableBundlers.includes(targetBundler)) {
    console.log(
      'The ' +
        chalk.red('yarn flow ' + primaryRenderer.shortName) +
        ' command requires a bundler argument that is supported:'
    );
    console.log();
    availableBundlers.forEach(d => {
      if (d === defaultBundler) {
        console.log(
          '  * ' +
            chalk.cyan('yarn flow ' + primaryRenderer.shortName) +
            ' (defaults to ' +
            d +
            ')'
        );
        console.log(
          '  * ' +
            chalk.cyan('yarn flow ' + primaryRenderer.shortName + ' ' + d)
        );
      } else {
        console.log(
          '  * ' +
            chalk.cyan('yarn flow ' + primaryRenderer.shortName + ' ' + d)
        );
      }
    });
    console.log();
    if (bundlerInfo) {
      console.log(
        'You tried to run with the ' +
          chalk.yellow('unsupported') +
          ' bundler ' +
          chalk.yellow(targetBundler) +
          '.'
      );
      console.log('Unsupported bundlers may be valid with other renderers.');
    } else {
      console.log(
        'You tried to run with the ' +
          chalk.red('unrecognized') +
          ' bundler ' +
          chalk.red(targetBundler) +
          '.'
      );
    }
    console.log();
    console.log(
      'Try running ' +
        chalk.green('yarn flow ' + primaryRenderer.shortName) +
        '.'
    );
    process.exit(1);
  }

  if (!bundlerInfo) {
    console.log(
      'The ' +
        chalk.red('yarn flow ' + primaryRenderer.shortName) +
        ' command now accepts a bundler argument:'
    );
    console.log();
    availableBundlers.forEach(d => {
      if (d === defaultBundler) {
        console.log(
          '  * ' +
            chalk.cyan('yarn flow ' + primaryRenderer.shortName) +
            ' (defaults to ' +
            d +
            ')'
        );
        console.log(
          '  * ' +
            chalk.cyan('yarn flow ' + primaryRenderer.shortName + ' ' + d)
        );
      } else {
        console.log(
          '  * ' +
            chalk.cyan('yarn flow ' + primaryRenderer.shortName + ' ' + d)
        );
      }
    });
    console.log();
    console.log(
      'You tried to run with the unrecognized bundler ' +
        chalk.red(targetBundler) +
        '.'
    );
    console.log();
    console.log(
      'If you are not sure, run ' +
        chalk.green('yarn flow ' + primaryRenderer.shortName) +
        '.'
    );
    process.exit(1);
  }

  runFlow(primaryRenderer.shortName + '--' + bundlerInfo.shortName, ['status']);
} else if (process.argv[3]) {
  console.log(
    'The ' +
      chalk.red('yarn flow ' + primaryRenderer.shortName) +
      ' command does not expect a bundler argument but it encountered: ' +
      chalk.red(process.argv[3])
  );
  console.log();
  console.log(
    'run ' + chalk.green('yarn flow ' + primaryRenderer.shortName) + ' instead.'
  );
  process.exit(1);
} else {
  runFlow(primaryRenderer.shortName, ['status']);
}
