// fetch upstream
// checkout 15-dev, update
// merge upstream/15-stable in
// done

'use strict';

const chalk = require('chalk');

var git = require('./utils/git');

module.exports = function(vorpal, app) {
  vorpal
    .command('start-release')
    .description('Start the process for shipping the next release')
    .action(function(args) {
      return new Promise((resolve, reject) => {
        // TODO: ensure that repo has upstream remote, correct branches setup.

        if (!git.isClean(app)) {
          this.log('ERROR: repo not in clean state');
          return reject();
        }

        // Fetch upstream - this ensures upstream/15-stable is updated and we
        // won't rely on the local branch.
        git.fetch(app, 'upstream');

        // Checkout 15-dev
        git.checkout(app, '15-dev');

        // Update to ensure latest commits are in. Will hit network again but
        // shouldn't need to get anything.
        git.pull(app);

        // Merge 15-stable in
        git.merge(app, 'upstream/15-stable', false);

        this.log(chalk.green.bold(`OK!`));
        this.log(
          `You can now start cherry-picking commits to this branch using the "stable-prs" command.`
        );
        resolve();
      });
    });
};
