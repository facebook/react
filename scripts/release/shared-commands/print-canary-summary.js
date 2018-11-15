#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {join, relative} = require('path');

module.exports = ({cwd, build, path}) => {
  const publishPath = relative(
    process.env.PWD,
    join(__dirname, '../publish.js')
  );
  const command = `${publishPath}` + (path ? ` -p ${path}` : '');

  const packagingFixturesPath = join(cwd, 'fixtures/packaging');
  const standaloneFixturePath = join(
    cwd,
    'fixtures/packaging/babel-standalone/dev.html'
  );

  console.log(
    chalk`
    {green.bold A potential canary has been prepared!}
    Next there are a couple of manual steps:

    {bold.underline Smoke test the packages}

    1. Open {yellow.bold ${standaloneFixturePath}} in the browser.
    2. It should say {italic "Hello world!"}
    3. Next go to {yellow.bold ${packagingFixturesPath}} and run {bold node build-all.js}
    4. Install the "pushstate-server" module ({bold npm install -g pushstate-server})
    5. Go to the repo root and {bold pushstate-server -s .}
    6. Open {blue.bold http://localhost:9000/fixtures/packaging}
    7. Verify every iframe shows {italic "Hello world!"}

    After completing the above steps, you can publish this canary by running:
    {yellow.bold ${command}}
  `.replace(/\n +/g, '\n')
  );
};
