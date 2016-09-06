/**
 * Command to init a project. This will create the .config.json file if it
 * doesn't already exist.
 */

'use strict';

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const untildify = require('untildify');

module.exports = function(vorpal, app) {
  vorpal
    .command('init')
    .description('Initializes a .config.json file for use')
    .action(function(args, cb) {
      fs.stat(app.PATH_TO_CONFIG, (err, stats) => {
        if (stats) {
          this.log('Config file exists, nothing to do.');
          cb();
        }

        this.prompt([
          {
            name: 'githubToken',
            type: 'input',
            message: `${chalk.bold('GitHub token?')} ${chalk.grey('(needs "repo" privs)')} `,
          },
          {
            name: 'reactPath',
            type: 'input',
            message: `${chalk.bold('Location of local React checkout?')} `,
            validate: (input) => {
              let npath = path.normalize(untildify(input));

              if (npath === '.') {
                return 'Cannot be `.`';
              }

              let stats;
              try {
                stats = fs.statSync(npath);
              } catch (e) {
                return `Error: ${e}`;
              }

              if (!stats.isDirectory()) {
                return `${npath} is not a directory.`;
              }

              // TODO: Look for markers indicating this is a React checkout.
              return true;
            },
          },
        ]).then((answers) => {
          fs.writeFile(app.PATH_TO_CONFIG, JSON.stringify(answers, null, 2), (err) => {
            if (err) {
              this.log('Error writing config file.', err);
            }
            cb();
          });
        });

      });
    });
};
