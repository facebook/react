#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {exec} = require('child-process-promise');
const {readdirSync} = require('fs');
const {readJsonSync} = require('fs-extra');
const {logPromise} = require('../utils');

const run = async ({cwd, dry, tempDirectory}) => {
  // Cleanup from previous build.
  await exec(`rm -rf ${cwd}/build`);

  // NPM pack all built packages.
  // We do this to ensure that the package.json files array is correct.
  const builtPackages = readdirSync(join(tempDirectory, 'build/node_modules/'));
  for (let i = 0; i < builtPackages.length; i++) {
    await exec(`npm pack ./${builtPackages[i]}`, {
      cwd: `${tempDirectory}/build/node_modules/`,
    });
  }

  await exec('mkdir build');
  await exec('mkdir build/node_modules');
  await exec(
    `cp -r ${tempDirectory}/build/node_modules/*.tgz ${cwd}/build/node_modules/`
  );

  // Unpack packages and parepare to publish.
  const compressedPackages = readdirSync('build/node_modules/');
  for (let i = 0; i < compressedPackages.length; i++) {
    await exec(
      `tar -zxvf ${cwd}/build/node_modules/${
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

  // Cleanup.
  await exec(`rm ${cwd}/build/node_modules/*.tgz`);
};

module.exports = async params => {
  return logPromise(run(params), 'Packing artifacts');
};
