
// Publishes the built npm packages from build/packages
// 1. Show checklist (automate later)
// 2. Prompt to ensure build is complete
// 3. Prompt for dist-tag?


'use strict';

const path = require('path');
const semver = require('semver');

const glob = require('glob');


module.exports = function(vorpal, app) {
  vorpal
    .command('npm-publish')
    .description('Update the version of React, useful while publishing')
    .action(function(args) {
      return new Promise((resolve, reject) => {
        const currentVersion = app.getReactVersion();
        const isStable = semver.prerelease(currentVersion) === null;

        this.log(`Preparing to publish v${currentVersion}…`);
        if (isStable) {
          this.log(`"latest" dist-tag will be added to this version`);
        }

        // TODO: show checklist
        this.prompt([
          {
            type: 'confirm',
            message: 'Did you run `grunt build` or `grunt release` and bump the version number?',
            name: 'checklist',
          },
        ]).then((answers) => {
          if (!answers.checklist) {
            return reject('Complete the build process first');
          }

          // We'll grab all the tarballs and publish those directly. This
          // is how we've historically done it, though in the past it was
          // just npm publish pkg1.tgz && npm publish pkg2.tgz. This
          // avoided the need to cd and publish.
          const tgz = glob.sync('build/packages/*.tgz', {
            cwd: app.config.reactPath,
          });

          // Just in case they didn't actually prep this.
          // TODO: verify packages?
          if (tgz.length === 0) {
            reject('No built packages found');
          }

          // TODO: track success
          tgz.forEach((file) => {
            this.log(app.execInRepo(`npm publish ${file} --tag=next`));
          });

          if (isStable) {
            tgz.forEach((file) => {
              const pkg = path.parse(file).name;
              this.log(app.execInRepo(`npm dist-tag add ${pkg}@${currentVersion} latest`));
            });
          }

          resolve();
        });
      });

    });
};
