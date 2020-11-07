#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const build = require('../build');

const main = async () => {
  await build('firefox');

  console.log(chalk.green('\nThe Firefox extension has been built!'));
  console.log(chalk.green('You can test this build by running:'));
  console.log(chalk.gray('\n# From the react-devtools root directory:'));
  console.log('yarn run test:firefox');
  console.log(
    chalk.gray('\n# You can also test against upcoming Firefox releases.')
  );
  console.log(
    chalk.gray(
      '# First download a release from https://www.mozilla.org/en-US/firefox/channel/desktop/'
    )
  );
  console.log(
    chalk.gray(
      '# And then tell web-ext which release to use (eg firefoxdeveloperedition, nightly, beta):'
    )
  );
  console.log('WEB_EXT_FIREFOX=nightly yarn run test:firefox');
  console.log(chalk.gray('\n# You can test against older versions too:'));
  console.log(
    'WEB_EXT_FIREFOX=/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox-bin yarn run test:firefox'
  );
};

main();

module.exports = {main};
