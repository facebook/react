#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {join, relative} = require('path');
const theme = require('../theme');

module.exports = ({cwd}) => {
  const publishPath = relative(
    process.env.PWD,
    join(__dirname, '../publish.js')
  );

  clear();

  console.log(
    theme`
    {caution A release candidate has been prepared but you're not done yet!}

    You can review the contents of this release in {path ./build/node_modules/}

    {header Before publishing, please smoke test the packages!}

    Once you have finished smoke testing, you can publish this release by running:
    {path   ${publishPath}}
  `
      .replace(/\n +/g, '\n')
      .trim()
  );
};
