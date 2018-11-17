#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const clear = require('clear');
const {join, relative} = require('path');

module.exports = ({cwd}) => {
  const publishPath = relative(
    process.env.PWD,
    join(__dirname, '../publish.js')
  );

  clear();

  const packagingFixturesPath = join(cwd, 'fixtures/packaging');
  const standaloneFixturePath = join(
    cwd,
    'fixtures/packaging/babel-standalone/dev.html'
  );

  console.log(
    chalk`
    {red.bold A release candidate has been prepared but you're not done yet!}

    You can review the contents of this release in {yellow ./build/node_modules/}

    {green.bold Before publishing, please smoke test the packages!}

    1. Open {yellow ${standaloneFixturePath}} in the browser.
    2. It should say {italic "Hello world!"}
    3. Next go to {yellow ${packagingFixturesPath}} and run {green node build-all.js}
    4. Install the "pushstate-server" module ({green npm install -g pushstate-server})
    5. Go to the repo root and {green pushstate-server -s .}
    6. Open {cyan.underline http://localhost:9000/fixtures/packaging}
    7. Verify every iframe shows {italic "Hello world!"}

    After completing the above steps, you can publish this release by running:
    {yellow ${publishPath}}
  `
      .replace(/\n +/g, '\n')
      .trim()
  );
};
