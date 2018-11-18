#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {join} = require('path');
const {tmpdir} = require('os');
const {logPromise} = require('../utils');
const theme = require('../theme');

const run = async ({commit, cwd, tempDirectory}) => {
  const directory = `react-${commit}`;
  const temp = tmpdir();

  if (tempDirectory !== join(tmpdir(), directory)) {
    throw Error(`Unexpected temporary directory "${tempDirectory}"`);
  }

  await exec(`rm -rf ${directory}`, {cwd: temp});
  await exec(`git archive --format=tar --output=${temp}/react.tgz ${commit}`, {
    cwd,
  });
  await exec(`mkdir ${directory}`, {cwd: temp});
  await exec(`tar -xf ./react.tgz -C ./${directory}`, {cwd: temp});
};

module.exports = async params => {
  return logPromise(
    run(params),
    theme`Copying React repo to temporary directory ({path ${
      params.tempDirectory
    }})`
  );
};
