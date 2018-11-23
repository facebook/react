#!/usr/bin/env node

'use strict';

const http = require('request-promise-json');
const {exec} = require('child-process-promise');
const {readJsonSync} = require('fs-extra');
const {logPromise} = require('../utils');
const theme = require('../theme');

const run = async ({cwd, tags}) => {
  if (!tags.includes('latest')) {
    // Don't update error-codes for alphas.
    return;
  }

  // All packages are built from a single source revision,
  // so it is safe to read build info from any one of them.
  const {buildNumber, environment} = readJsonSync(
    `${cwd}/build/node_modules/react/build-info.json`
  );

  // If this release was created on Circle CI, grab the updated error codes from there.
  // Else the user will have to manually regenerate them.
  if (environment === 'ci') {
    // https://circleci.com/docs/2.0/artifacts/#downloading-all-artifacts-for-a-build-on-circleci
    // eslint-disable-next-line max-len
    const metadataURL = `https://circleci.com/api/v1.1/project/github/facebook/react/${buildNumber}/artifacts?circle-token=${
      process.env.CIRCLE_CI_API_TOKEN
    }`;
    const metadata = await http.get(metadataURL, true);

    // Each container stores an "error-codes" artifact, unfortunately.
    // We want to use the one that also ran `yarn build` since it may have modifications.
    const {node_index} = metadata.find(
      entry => entry.path === 'home/circleci/project/node_modules.tgz'
    );
    const {url} = metadata.find(
      entry =>
        entry.node_index === node_index &&
        entry.path === 'home/circleci/project/scripts/error-codes/codes.json'
    );

    // Download and stage changers
    await exec(`curl ${url} --output ./scripts/error-codes/codes.json`, {cwd});
  }
};

module.exports = async params => {
  return logPromise(run(params), theme`Retrieving error codes`);
};
