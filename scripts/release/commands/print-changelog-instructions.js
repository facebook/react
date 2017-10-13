#!/usr/bin/env node

'use strict';

const chalk = require('chalk');

module.exports = () => {
  console.log(
    `Now it's time to addd release notes to the ${chalk.yellow.bold('CHANGELOG.md')}!\n\n` +
      'Here are a few things to keep in mind:\n' +
      '• The changes should be easy to understand. ' +
      '(Friendly one-liners are better than PR titles.)\n' +
      '• Make sure all contributors are credited.\n' +
      '• Verify that the markup is valid by previewing it in the editor: ' +
      chalk.cyan('https://github.com/facebook/react/edit/master/CHANGELOG.md')
  );
};
