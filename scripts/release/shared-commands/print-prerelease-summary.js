#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {join, relative} = require('path');
const theme = require('../theme');

module.exports = ({cwd}, isStableRelease) => {
  const publishPath = relative(
    process.env.PWD,
    join(__dirname, '../publish.js')
  );

  clear();

  let message;
  if (isStableRelease) {
    message = theme`
      {caution A stable release candidate has been prepared!}

      You can review the contents of this release in {path build/node_modules/}

      {header Before publishing, consider testing this release locally with create-react-app!}

      You can publish this release by running:
      {path   ${publishPath}}
    `;
  } else {
    message = theme`
      {caution A canary release candidate has been prepared!}

      You can review the contents of this release in {path build/node_modules/}

      You can publish this release by running:
      {path   ${publishPath}}
    `;
  }

  console.log(message.replace(/\n +/g, '\n').trim());
};
