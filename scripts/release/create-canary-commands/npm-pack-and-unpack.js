#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {exec} = require('child-process-promise');
const {readdirSync} = require('fs');
const {readJsonSync} = require('fs-extra');
const {logPromise} = require('../utils');

const run = async ({cwd, dry, tempDirectory}) => {
  // Cleanup from previous build.
  await exec(`rm -rf ./build`, {cwd});

  // NPM pack all built packages.
  // We do this to ensure that the package.json files array is correct.
  const builtPackages = readdirSync(join(tempDirectory, 'build/node_modules/'));
  for (let i = 0; i < builtPackages.length; i++) {
    await exec(`npm pack ./${builtPackages[i]}`, {
      cwd: `${tempDirectory}/build/node_modules/`,
    });
  }

  await exec('mkdir build', {cwd});
  await exec('mkdir build/node_modules', {cwd});
  await exec(
    `cp -r ${tempDirectory}/build/node_modules/*.tgz ./build/node_modules/`,
    {cwd}
  );

  // Unpack packages and prepare to publish.
  const compressedPackages = readdirSync(join(cwd, 'build/node_modules/'));
  for (let i = 0; i < compressedPackages.length; i++) {
    await exec(
      `tar -zxvf ./build/node_modules/${
        compressedPackages[i]
      } -C ./build/node_modules/`,
      {cwd}
    );
    const packageJSON = readJsonSync(
      join(cwd, `./build/node_modules/package/package.json`)
    );
    await exec(
      `mv ./build/node_modules/package ./build/node_modules/${
        packageJSON.name
      }`,
      {cwd}
    );
  }

  // Cleanup.
  await exec(`rm ./build/node_modules/*.tgz`, {cwd});
};

module.exports = async params => {
  return logPromise(run(params), 'Packing artifacts');
};
