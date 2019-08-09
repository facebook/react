#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {existsSync} = require('fs');
const {readJsonSync} = require('fs-extra');
const {join} = require('path');
const theme = require('../theme');
const {execRead} = require('../utils');

const run = async ({cwd, packages, tags}) => {
  // All packages are built from a single source revision,
  // so it is safe to read build info from any one of them.
  const arbitraryPackageName = packages[0];
  const {commit, environment} = readJsonSync(
    join(cwd, 'build', 'node_modules', arbitraryPackageName, 'build-info.json')
  );

  // Tags are named after the react version.
  const {version} = readJsonSync(
    `${cwd}/build/node_modules/react/package.json`
  );

  const branch = await execRead('git branch | grep \\* | cut -d " " -f2', {
    cwd,
  });

  clear();

  if (tags.length === 1 && tags[0] === 'canary') {
    console.log(
      theme`{header A canary release} {version ${version}} {header has been published!}`
    );
  } else {
    const nodeModulesPath = join(cwd, 'build/node_modules');

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
      const status = await execRead(
        'git diff packages/shared/ReactVersion.js',
        {cwd}
      );
      if (status) {
        console.log(theme.path`• packages/shared/ReactVersion.js`);
      }

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
      theme`{header Don't forget to also update and commit the }{path CHANGELOG}`
    );

    if (branch !== 'master') {
      console.log();
      console.log(
        theme`{header Don't forget to cherry-pick any updated error codes into the} {path master} {header branch}.`
      );
      console.log(
        theme`Else they will not be properly decoded on {link reactjs.org}.`
      );
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
    console.log(theme.header`Lastly, please fill in the release on GitHub.`);
    console.log(
      theme.link`https://github.com/facebook/react/releases/tag/v%s`,
      version
    );
    console.log(
      theme`\nThe GitHub release should also include links to the following artifacts:`
    );
    for (let i = 0; i < packages.length; i++) {
      const packageName = packages[i];
      if (existsSync(join(nodeModulesPath, packageName, 'umd'))) {
        const {version: packageVersion} = readJsonSync(
          join(nodeModulesPath, packageName, 'package.json')
        );
        console.log(
          theme`{path • %s:} {link https://unpkg.com/%s@%s/umd/}`,
          packageName,
          packageName,
          packageVersion
        );
      }
    }

    // Updating reactjs.org accomplishes two things:
    // (1) It ensures our Gatsby error codes plugin runs with the latest error codes.
    // (2) It keeps the React version shown in the header up to date.
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
