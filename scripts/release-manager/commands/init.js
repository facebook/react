/**
 * Command to init a project. This will create the .config.json file if it
 * doesn't already exist.
 */

'use strict';

const chalk = require('chalk');
const fs = require('fs');

const FILENAME = '.config.json';

module.exports = function(vorpal, options) {
  vorpal
    .command('init')
    .description('Initializes a .config.json file for use')
    .action(function(args, cb) {
      fs.stat(FILENAME, (err, stats) => {
        if (stats) {
          this.log('Config file exists, nothing to do.');
          cb();
        }

        this.prompt([
          {
            name: 'token',
            type: 'input',
            message: `${chalk.bold('GitHub token?')} ${chalk.grey('(needs "repo" privs)')} `
          }
        ]).then((answers) => {
          fs.writeFile(FILENAME, JSON.stringify(answers, null, 2), (err) => {
            if (err) {
              this.log('ERROR WRITING .config.json', err);
            }
            cb();
          });
        });

      });
    });
}
