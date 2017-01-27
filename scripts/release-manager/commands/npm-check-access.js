'use strict';

const npmUtils = require('./utils/npm');
const chalk = require('chalk');
const opn = require('opn');

module.exports = function(vorpal, app) {
  vorpal
    .command('npm-check-access')
    .description('Check to ensure you have correct access to npm packages')
    .action(function(args) {
      return new Promise((resolve, reject) => {
        const username = npmUtils.whoami(app);
        if (!username) {
          return reject(
            `${chalk.red('FAILED')} You aren't logged in to npm. Please run ` +
            `${chalk.underline(`npm adduser`)} and try again.`
          );
        }

        this.log(`${chalk.green('OK')} Logged in as ${chalk.bold(username)}`);

        const packagesNeedingAccess = npmUtils.packagesNeedingAccess(app, username);

        if (packagesNeedingAccess.length) {
          this.log(
            `${chalk.red('FAILED')} You don't have access to all of the packages ` +
            `you need. We just opened a URL to file a new issue requesting access.`
          );
          opn(
            npmUtils.generateAccessNeededIssue(username, packagesNeedingAccess),
            {wait: false}
          ).then(resolve);
        } else {
          this.log(`${chalk.green('OK')} You can publish all React packages`);
          resolve();
        }
      });
    });
};
