#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {readJsonSync} = require('fs-extra');
const theme = require('../theme');

const run = async ({cwd, packages, tags}) => {
  // All packages are built from a single source revision,
  // so it is safe to read the commit number from any one of them.
  const {commit, environment} = readJsonSync(
    `${cwd}/build/node_modules/react/build-info.json`
  );

  // Tags are named after the react version.
  const {version} = readJsonSync(
    `${cwd}/build/node_modules/react/package.json`
  );

  clear();

  if (tags.length === 1 && tags[0] === 'canary') {
    console.log(
      theme`{header A canary release} {version ${version}} {header has been published!}`
    );
  } else {
    console.log(
      theme.caution`The release has been published but you're not done yet!`
    );

    if (tags.includes('latest')) {
      console.log();
      console.log(
        theme.header`Please review and commit all local, staged changes.`
      );

      console.log();
      console.log('Version numbers have been updated in the following files:');
      for (let i = 0; i < packages.length; i++) {
        const packageName = packages[i];
        console.log(theme.path`• packages/%s/package.json`, packageName);
      }
      console.log(theme.path`• packages/shared/ReactVersion.js`);

      console.log();
      if (environment === 'ci') {
        console.log('Auto-generated error codes have been updated as well:');
        console.log(theme.path`• scripts/error-codes/codes.json`);
      } else {
        console.log(
          theme`{caution The release that was just published was created locally.} ` +
            theme`Because of this, you will need to update the generated ` +
            theme`{path scripts/error-codes/codes.json} file manually:`
        );
        console.log(theme`  {command git checkout} {version ${commit}}`);
        console.log(theme`  {command yarn build -- --extract-errors}`);
      }
    }

    console.log();
    console.log(
      theme`{header Don't forget to update and commit the }{path CHANGELOG}`
    );

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
      theme.header`Lastly, please fill in the release on GitHub. ` +
        theme`Don't forget to attach build artifacts from {path build/node_modules/}`
    );
    console.log(
      theme.link`https://github.com/facebook/react/releases/tag/v%s`,
      version
    );
    console.log();
  }
};

module.exports = run;
