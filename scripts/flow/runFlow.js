'use strict';

const chalk = require('chalk');
const spawn = require('child_process').spawn;

require('./createFlowConfigs');

async function runFlow(renderer, args) {
  return new Promise(resolve => {
    console.log(
      'Running Flow for the ' + chalk.cyan(renderer) + ' renderer...',
    );
    let cmd = '../../../node_modules/.bin/flow';
    if (process.platform === 'win32') {
      cmd = cmd.replace(/\//g, '\\') + '.cmd';
    }
    spawn(cmd, args, {
      // Allow colors to pass through:
      stdio: 'inherit',
      // Use a specific renderer config:
      cwd: process.cwd() + '/scripts/flow/' + renderer + '/',
    }).on('close', function(code) {
      if (code !== 0) {
        console.error(
          'Flow failed for the ' + chalk.red(renderer) + ' renderer',
        );
        console.log();
        process.exit(code);
      } else {
        console.log(
          'Flow passed for the ' + chalk.green(renderer) + ' renderer',
        );
        console.log();
        resolve();
      }
    });
  });
}

module.exports = runFlow;
