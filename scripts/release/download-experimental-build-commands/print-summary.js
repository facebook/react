#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {join, relative} = require('path');
const theme = require('../theme');
const {getCommitFromCurrentBuild} = require('../utils');

module.exports = async () => {
  const commandPath = relative(
    process.env.PWD,
    join(__dirname, '../download-experimental-build.js')
  );

  clear();

  const commit = await getCommitFromCurrentBuild();

  const message = theme`
    {caution An experimental build has been downloaded!}

    You can download this build again by running:
    {path   ${commandPath}} --commit={commit ${commit}}
  `;

  console.log(message.replace(/\n +/g, '\n').trim());
};
