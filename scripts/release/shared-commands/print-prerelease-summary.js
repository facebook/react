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

    1. Open {path ./fixtures/packaging/babel-standalone/dev.html} in the browser.
    2. It should say {quote "Hello world!"}
    3. Next go to {path ./fixtures/packaging} and run {command node build-all.js}
    4. Go to the repo root and {command npx pushstate-server . 9000}
    5. Open {link http://localhost:9000/fixtures/packaging}
    6. Verify every iframe shows {quote "Hello world!"}

    After completing the above steps, you can publish this release by running:
    {path   ${publishPath}}
  `
      .replace(/\n +/g, '\n')
      .trim()
  );
};
