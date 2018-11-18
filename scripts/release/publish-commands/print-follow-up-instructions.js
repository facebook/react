#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {readJsonSync} = require('fs-extra');
const theme = require('../theme');

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
    theme.caution`The release has been published but you're not done yet!`
  );

  if (tags.includes('latest')) {
    console.log(
      theme.header`\nLocal versions may require updating after a stable release. Please verify the following files:`
    );
    for (let i = 0; i < packages.length; i++) {
      const packageName = packages[i];
      console.log(theme.path`• packages/%s/package.json`, packageName);
    }
    console.log(theme.path`• packages/shared/ReactVersion.js`);
  }

  // Prompt the release engineer to tag the commit and update the CHANGELOG.
  // (The script could automatically do this, but this seems safer.)
  console.log();
  console.log(
    theme.header`Tag the source for this release in Git with the following command:`
  );
  console.log(
    theme`  {command git tag -a v}{version %s} {command -m "v%s"} {version %s}`,
    version,
    version,
    commit
  );
  console.log(theme.command`  git push origin --tags`);
  console.log();
  console.log(
    theme`{header Don't forget to update and commit the }{path CHANGELOG}`
  );
  console.log();
  console.log(theme.header`Then fill in the release on GitHub:`);
  console.log(
    theme.link`https://github.com/facebook/react/releases/tag/v%s`,
    version
  );
  console.log();
};

module.exports = run;
