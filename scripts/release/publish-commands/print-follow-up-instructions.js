#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {readJsonSync} = require('fs-extra');
const theme = require('../theme');

const run = async ({cwd, packages, tags}) => {
  // Tags are named after the react version.
  const {version} = readJsonSync(
    `${cwd}/build/node_modules/react/package.json`
  );

  clear();

  console.log(
    theme.caution`The release has been published but you're not done yet!`
  );

  if (tags.includes('latest')) {
    console.log();
    console.log(
      theme`{header Don't forget to also update and commit the }{path CHANGELOG}`
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
      '<commit>'
    );
    console.log(theme.command`  git push origin --tags`);

    console.log();
    console.log(theme.header`Lastly, please fill in the release on GitHub.`);
    console.log(
      theme.link`https://github.com/facebook/react/releases/tag/v%s`,
      version
    );

    // Update react.dev so the React version shown in the header is up to date.
    console.log();
    console.log(
      theme.header`Once you've pushed changes, update the docs site.`
    );
    console.log(
      'This will ensure that any newly-added error codes can be decoded.'
    );

    console.log();
  }
};

module.exports = run;
