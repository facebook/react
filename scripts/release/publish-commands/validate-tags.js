#!/usr/bin/env node

'use strict';

const {readJson} = require('fs-extra');
const {join} = require('path');
const theme = require('../theme');

const run = async ({cwd, packages, tags}) => {
  // Prevent a "next" release from ever being published as @latest
  // All canaries share a version number, so it's okay to check any of them.
  const arbitraryPackageName = packages[0];
  const packageJSONPath = join(
    cwd,
    'build',
    'node_modules',
    arbitraryPackageName,
    'package.json'
  );
  const {version} = await readJson(packageJSONPath);
  const isExperimentalVersion = version.indexOf('experimental') !== -1;
  if (version.indexOf('-') !== -1) {
    if (tags.includes('latest')) {
      if (isExperimentalVersion) {
        console.log(
          theme`{error Experimental release} {version ${version}} {error cannot be tagged as} {tag latest}`
        );
      } else {
        console.log(
          theme`{error Next release} {version ${version}} {error cannot be tagged as} {tag latest}`
        );
      }
      process.exit(1);
    }
    if (tags.includes('next') && isExperimentalVersion) {
      console.log(
        theme`{error Experimental release} {version ${version}} {error cannot be tagged as} {tag next}`
      );
      process.exit(1);
    }
    if (tags.includes('experimental') && !isExperimentalVersion) {
      console.log(
        theme`{error Next release} {version ${version}} {error cannot be tagged as} {tag experimental}`
      );
      process.exit(1);
    }
  } else {
    if (!tags.includes('latest')) {
      console.log(
        theme`{error Stable release} {version ${version}} {error must always be tagged as} {tag latest}`
      );
      process.exit(1);
    }
    if (tags.includes('experimental')) {
      console.log(
        theme`{error Stable release} {version ${version}} {error cannot be tagged as} {tag experimental}`
      );
      process.exit(1);
    }
  }
};

module.exports = run;
