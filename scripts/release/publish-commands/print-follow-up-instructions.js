#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const clear = require('clear');
const {readJsonSync} = require('fs-extra');

const run = async ({cwd, packages, tags}) => {
  // All packages are built from a single source revision,
  // so it is safe to read the commit number from any one of them.
  const {commit} = readJsonSync(
    `${cwd}/build/node_modules/react/build-info.json`
  );

  // Tags are named after the react version.
  const {version} = readJsonSync(
    `${cwd}/build/node_modules/react/package.json`
  );

  clear();

  console.log(
    chalk`{red.bold The release has been published but you're not done yet!}`
  );

  if (tags.includes('latest')) {
    console.log(
      chalk`\n{green Local versions may require updating after a stable release. Please verify the following files:}`
    );
    for (let i = 0; i < packages.length; i++) {
      const packageName = packages[i];
      console.log(chalk`• packages/{green ${packageName}}/package.json`);
    }
    console.log(chalk`• packages/{green shared/ReactVersion.js}`);
  }

  // Prompt the release engineer to tag the commit and update the CHANGELOG.
  // (The script could automatically do this, but this seems safer.)
  console.log(
    chalk`\n{green Tag the source for this release in Git with the following command:}`
  );
  console.log(
    chalk`  git tag -a {yellow v${version}} -m "v${version}" {yellow ${commit}}`
  );
  console.log(chalk`  git push origin --tags`);
  console.log(
    chalk`\n{green Don't forget to update and commit the {white CHANGELOG}.}`
  );
  console.log(chalk`\n{green Then fill in the release on GitHub:}`);
  console.log(
    chalk`{cyan.underline https://github.com/facebook/react/releases/tag/v${version}}\n`
  );
};

module.exports = run;
