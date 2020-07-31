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
  const {commit} = readJsonSync(
    join(cwd, 'build', 'node_modules', arbitraryPackageName, 'build-info.json')
  );

  // Tags are named after the react version.
  const {version} = readJsonSync(
    `${cwd}/build/node_modules/react/package.json`
  );

  clear();

  if (tags.length === 1 && tags[0] === 'next') {
    console.log(
      theme`{header A "next" release} {version ${version}} {header has been published!}`
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
    }

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

    // Update reactjs.org so the React version shown in the header is up to date.
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
