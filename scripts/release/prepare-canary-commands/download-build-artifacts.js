#!/usr/bin/env node

'use strict';

const http = require('request-promise-json');
const {exec} = require('child-process-promise');
const {existsSync, readdirSync} = require('fs');
const {readJsonSync} = require('fs-extra');
const {join} = require('path');
const {logPromise} = require('../utils');
const theme = require('../theme');

const run = async ({build, cwd}) => {
  // https://circleci.com/docs/2.0/artifacts/#downloading-all-artifacts-for-a-build-on-circleci
  const metadataURL = `https://circleci.com/api/v1.1/project/github/facebook/react/${build}/artifacts?circle-token=${
    process.env.CIRCLE_CI_API_TOKEN
  }`;
  const metadata = await http.get(metadataURL, true);
  const nodeModulesURL = metadata.find(
    entry => entry.path === 'home/circleci/project/node_modules.tgz'
  ).url;

  if (!existsSync(join(cwd, 'build'))) {
    await exec(`mkdir ./build`, {cwd});
  }

  // Download and extract artifact
  await exec(`rm -rf ./build/node_modules*`, {cwd});
  await exec(`curl ${nodeModulesURL} --output ./build/node_modules.tgz`, {cwd});
  await exec(`mkdir ./build/node_modules`, {cwd});
  await exec(`tar zxvf ./build/node_modules.tgz -C ./build/node_modules/`, {
    cwd,
  });

  // Unpack packages and prepare to publish
  const compressedPackages = readdirSync(join(cwd, 'build/node_modules/'));
  for (let i = 0; i < compressedPackages.length; i++) {
    await exec(
      `tar zxvf ./build/node_modules/${
        compressedPackages[i]
      } -C ./build/node_modules/`,
      {cwd}
    );
    const packageJSON = readJsonSync(
      join(cwd, `/build/node_modules/package/package.json`)
    );
    await exec(
      `mv ./build/node_modules/package ./build/node_modules/${
        packageJSON.name
      }`,
      {cwd}
    );
  }

  // Cleanup
  await exec(`rm ./build/node_modules.tgz`, {cwd});
  await exec(`rm ./build/node_modules/*.tgz`, {cwd});
};

module.exports = async ({build, cwd}) => {
  return logPromise(
    run({build, cwd}),
    theme`Downloading artifacts from Circle CI for build {build ${build}}`
  );
};
