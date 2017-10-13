#!/usr/bin/env node

'use strict';

const chalk = require('chalk');

const CHANGELOG_PATH =
  'https://github.com/facebook/react/edit/master/CHANGELOG.md';

module.exports = () => {
  console.log(
    chalk`
    {green.bold Release build successful!}

    Next there are a couple of manual steps:

    {bold.underline Step 1: Update the CHANGELOG}

    Here are a few things to keep in mind:
    • The changes should be easy to understand. (Friendly one-liners are better than PR titles.)
    • Make sure all contributors are credited.
    • Verify that the markup is valid by previewing it in the editor: {blue.bold ${CHANGELOG_PATH}}

    {bold.underline Step 2: Smoke test the packages}

    1. Open {yellow.bold fixtures/packaging/babel-standalone/dev.html} in the browser.
    2. It should say {italic "Hello world!"}
    3. Next go to {yellow.bold fixtures/packaging} and run {bold node build-all.js}
    4. Install the "serve" module ({bold npm install -g serve})
    5. Go to the repo root and {bold run serve -s .}
    6. Open {blue.bold http://localhost:5000/fixtures/packaging}
    7. Verify every iframe shows {italic "Hello world!"}

    After completing the above steps, resume the release process by running {yellow.bold ./publish.js}
  `
      .trim()
      .replace(/\n +/g, '\n')
  );
};
