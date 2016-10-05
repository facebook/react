'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');

const chalk = require('chalk');

const git = require('./utils/git');


// Overview
// 1. Display current version
// 2. Prompt for new version
// 3. Update appropriate files
//    - package.json (version)
//    - npm-shrinkwrap.json (version)
//    - packages/react/package.json (version)
//    - packages/react-addons/package.json (version, peerDependencies.react)
//    - packages/react-dom/package.json (version, peerDependencies.react)
//    - packages/react-native-renderer/package.json (version, peerDependencies.react)
//    - packages/react-test-renderer/package.json (version, peerDependencies.react)
//    - src/ReactVersion.js (module.exports)
// 4. Commit?


function updateJSON(path, fields, value) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (e) {
    this.log(chalk.color.red('ERROR') + ` ${path} doesn't exist… skipping.`);
  }
  fields.forEach((field) => {
    let fieldPath = field.split('.');
    if (fieldPath.length === 1) {
      data[field] = value;
    } else {
      // assume length of 2 is some dep.react and we can just use ^ because we
      // know it's true. do something more versatile later
      data[fieldPath[0]][fieldPath[1]] = '^' + value;
    }
  });
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}


module.exports = function(vorpal, app) {
  vorpal
    .command('version')
    .description('Update the version of React, useful while publishing')
    .action(function(args, actionCB) {

      let currentVersion = app.getReactVersion();

      // TODO: See if we can do a better job for handling pre* bumps. The ones
      // semver adds are of the form -0, but we've used -alpha.0 or -rc.0.
      // 'prerelease' will increment those properly (but otherwise has the same problem).
      // Live with it for now since it won't be super common. Write docs.
      let choices = ['prerelease', 'patch', 'minor', 'major'].map((release) => {
        let version = semver.inc(currentVersion, release);
        return {
          value: version,
          name:`${chalk.bold(version)} (${release})`,
        };
      });
      choices.push('Other');

      this.prompt([
        {
          type: 'list',
          name: 'version',
          choices: choices,
          message: `New version (currently ${chalk.bold(currentVersion)}):`,
        },
        {
          type: 'input',
          name: 'version',
          message: `New version (currently ${chalk.bold(currentVersion)}): `,
          when: (res) => res.version === 'Other',
        },
      ]).then((res) => {
        let newVersion = semver.valid(res.version);

        if (!newVersion) {
          return actionCB(`${chalk.red('ERROR')} ${res.version} is not a semver-valid version`);
        }

        this.log(`Updating to ${newVersion}`);

        // The JSON files. They're all updated the same way so batch.
        [
          {
            file: 'package.json',
            fields: ['version'],
          },
          {
            file: 'npm-shrinkwrap.json',
            fields: ['version'],
          },
          {
            file: 'packages/react/package.json',
            fields: ['version'],
          },
          {
            file: 'packages/react-addons/package.json',
            fields: ['version', 'peerDependencies.react'],
          },
          {
            file: 'packages/react-dom/package.json',
            fields: ['version', 'peerDependencies.react'],
          },
          {
            file: 'packages/react-native-renderer/package.json',
            fields: ['version', 'peerDependencies.react'],
          },
          {
            file: 'packages/react-test-renderer/package.json',
            fields: ['version', 'peerDependencies.react'],
          },
        ].forEach((opts) => {
          updateJSON.apply(this, [path.join(app.config.reactPath, opts.file), opts.fields, newVersion]);
        });

        // We also need to update src/ReactVersion.js which has the version in
        // string form in JS code. We'll just do a string replace.

        const PATH_TO_REACTVERSION = path.join(app.config.reactPath, 'src/ReactVersion.js');

        let reactVersionContents = fs.readFileSync(PATH_TO_REACTVERSION, 'utf8');

        reactVersionContents =
          reactVersionContents.replace(currentVersion, newVersion);
        fs.writeFileSync(PATH_TO_REACTVERSION, reactVersionContents);

        this.prompt([
          {
            name: 'commit',
            type: 'confirm',
            message: 'Commit these changes (`git commit -a`)?',
            default: true,
          },
          {
            name: 'tag',
            type: 'confirm',
            message: 'Tag the version commit (not necessary for non-stable releases)?',
            default: true,
            when: (res) => res.commit,
          },
        ]).then((res) => {
          if (res.commit) {
            git.commit(app, newVersion, true);
          }
          if (res.tag) {
            git.tag(app, `v${newVersion}`);
          }
          actionCB();
        });
      });

    });
};
