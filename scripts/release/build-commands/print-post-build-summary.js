#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {join, relative} = require('path');
const {getUnexecutedCommands} = require('../utils');

const CHANGELOG_PATH =
  'https://github.com/facebook/react/edit/master/CHANGELOG.md';

module.exports = ({cwd, dry, path, version}) => {
  const publishPath = relative(
    process.env.PWD,
    join(__dirname, '../publish.js')
  );
  const command =
    `${publishPath} -v ${version}` +
    (path ? ` -p ${path}` : '') +
    (dry ? ' --dry' : '');

  const packagingFixturesPath = join(cwd, 'fixtures/packaging');
  const standaloneFixturePath = join(
    cwd,
    'fixtures/packaging/babel-standalone/dev.html'
  );

  console.log(
    chalk`
    {green.bold Build successful!}
    ${getUnexecutedCommands()}
    Next there are a couple of manual steps:

    {bold.underline Step 1: Update the CHANGELOG}

    Here are a few things to keep in mind:
    • The changes should be easy to understand. (Friendly one-liners are better than PR titles.)
    • Make sure all contributors are credited.
    • Verify that the markup is valid by previewing it in the editor: {blue.bold ${CHANGELOG_PATH}}

    {bold.underline Step 2: Smoke test the packages}

    1. Open {yellow.bold ${standaloneFixturePath}} in the browser.
    2. It should say {italic "Hello world!"}
    3. Next go to {yellow.bold ${packagingFixturesPath}} and run {bold node build-all.js}
    4. Install the "serve" module ({bold npm install -g serve})
    5. Go to the repo root and {bold serve -s .}
    6. Open {blue.bold http://localhost:5000/fixtures/packaging}
    7. Verify every iframe shows {italic "Hello world!"}

    After completing the above steps, resume the release process by running:
    {yellow.bold ${command}}
  `.replace(/\n +/g, '\n')
  );
};
