#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const http = require('request-promise-json');
const {exec} = require('child-process-promise');
const {readdirSync} = require('fs');
const {readJsonSync} = require('fs-extra');
const {logPromise} = require('../utils');

const run = async ({build, cwd}) => {
  // https://circleci.com/docs/2.0/artifacts/#downloading-all-artifacts-for-a-build-on-circleci
  const metadataURL = `https://circleci.com/api/v1.1/project/github/facebook/react/${build}/artifacts?circle-token=${
    process.env.CIRCLE_CI_API_TOKEN
  }`;
  const metadata = await http.get(metadataURL, true);
  const nodeModulesURL = metadata.find(
    entry => entry.path === 'home/circleci/project/node_modules.tgz'
  ).url;

  // Download and extract artifact
  await exec(`rm -rf ${cwd}/build/node_modules*`);
  await exec(`curl ${nodeModulesURL} --output ${cwd}/build/node_modules.tgz`);
  await exec(`mkdir ${cwd}/build/node_modules`);
  await exec(
    `tar zxvf ${cwd}/build/node_modules.tgz -C ${cwd}/build/node_modules/`
  );

  // Unpack packages and parepare to publish
  const compressedPackages = readdirSync('build/node_modules/');
  for (let i = 0; i < compressedPackages.length; i++) {
    await exec(
      `tar zxvf ${cwd}/build/node_modules/${
        compressedPackages[i]
      } -C ${cwd}/build/node_modules/`
    );
    const packageJSON = readJsonSync(
      `${cwd}/build/node_modules/package/package.json`
    );
    await exec(
      `mv ${cwd}/build/node_modules/package ${cwd}/build/node_modules/${
        packageJSON.name
      }`
    );
  }

  // Cleanup
  await exec(`rm ${cwd}/build/node_modules.tgz`);
  await exec(`rm ${cwd}/build/node_modules/*.tgz`);
};

module.exports = async ({build, cwd}) => {
  return logPromise(
    run({build, cwd}),
    `Downloading artifacts from Circle CI for build ${chalk.yellow.bold(
      `${build}`
    )}`
  );
};
