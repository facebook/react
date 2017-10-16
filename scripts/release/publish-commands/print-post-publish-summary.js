#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {getUnexecutedCommands} = require('../utils');

module.exports = ({version}) => {
  console.log(
    chalk`
    {green.bold Publish successful!}
    ${getUnexecutedCommands()}
    Next there are a couple of manual steps:

    {bold.underline Step 1: Create GitHub release}

    1. Open new release page: {blue.bold https://github.com/facebook/react/releases/new}
    2. Choose {bold ${version}} from the dropdown menu
    3. Paste the new release notes from {yellow.bold CHANGELOG.md}
    4. Attach all files in {yellow.bold build/dist/*.js} except {yellow.bold react-art.*} to the release.
    5. Press {bold "Publish release"}!

    {bold.underline Step 2: Update the version on reactjs.org}

    1. Git clone (or update) {blue.bold https://github.com/reactjs/reactjs.org}
    2. Open the {bold.yellow src/site-constants.js} file
    3. Update the {bold version} value to {bold ${version}}
    4. Open a Pull Request to {bold master}

    {bold.underline Step 3: Test the new release}

    1. Install CRA: {bold npm i -g create-react-app}
    2. Create a test application: {bold create-react-app myapp}
    3. Run it: {bold cd myapp && npm start}

    {bold.underline Step 4: Notify the DOM team}

    1. Notify DOM team members: {bold @nhunzaker @jquense @aweary}
  `.replace(/\n +/g, '\n')
  );
};
