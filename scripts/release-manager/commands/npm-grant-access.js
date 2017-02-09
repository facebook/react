'use strict';

const npmUtils = require('./utils/npm');
const chalk = require('chalk');

module.exports = function(vorpal, app) {
  vorpal
    .command('npm-grant-access')
    .description('Grant access to somebody to publish React. Assumes you ran "npm-check-access" first.')
    .action(function(args) {
      return new Promise((resolve, reject) => {
        this.prompt({
          type: 'input',
          message: 'Who would you like to grant access to? ',
          name: 'username',
        }).then((answers) => {
          if (!answers.username) {
            return reject('ABORTING');
          }

          const packagesNeedingAccess = npmUtils.packagesNeedingAccess(app, answers.username);

          if (packagesNeedingAccess.length) {
            this.log(`${chalk.yellow('PENDING')} Granting access to ${packagesNeedingAccess}`);
            npmUtils.grantAccess(app, answers.username, packagesNeedingAccess);
            this.log(`${chalk.green('OK')} Access has been granted to ${answers.username}.`);
            resolve();
          } else {
            this.log(`${chalk.green('OK')} ${answers.username} already has access.`);
            resolve();
          }

        });
      });
    });
};
