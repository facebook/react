#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {existsSync, readdirSync} = require('fs');
const {readJsonSync} = require('fs-extra');
const {join} = require('path');
const {getArtifactsList, logPromise} = require('../utils');
const theme = require('../theme');

const run = async ({build, cwd}) => {
  const artifacts = await getArtifactsList(build);
  const nodeModulesArtifact = artifacts.find(entry =>
    entry.path.endsWith('node_modules.tgz')
  );

  if (!nodeModulesArtifact) {
    console.log(
      theme`{error The specified build (${build}) does not contain any build artifacts.}`
    );
    process.exit(1);
  }

  const nodeModulesURL = nodeModulesArtifact.url;

  if (!existsSync(join(cwd, 'build'))) {
    await exec(`mkdir ./build`, {cwd});
  }

  // Download and extract artifact
  await exec(`rm -rf ./build/node_modules*`, {cwd});
  await exec(`curl -L ${nodeModulesURL} --output ./build/node_modules.tgz`, {
    cwd,
  });
  await exec(`mkdir ./build/node_modules`, {cwd});
  await exec(`tar zxvf ./build/node_modules.tgz -C ./build/node_modules/`, {
    cwd,
  });

  // Unpack packages and prepare to publish
  const compressedPackages = readdirSync(join(cwd, 'build/node_modules/'));
  for (let i = 0; i < compressedPackages.length; i++) {
    await exec(
      `tar zxvf ./build/node_modules/${compressedPackages[i]} -C ./build/node_modules/`,
      {cwd}
    );
    const packageJSON = readJsonSync(
      join(cwd, `/build/node_modules/package/package.json`)
    );
    await exec(
      `mv ./build/node_modules/package ./build/node_modules/${packageJSON.name}`,
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
